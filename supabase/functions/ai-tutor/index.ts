// Supabase Edge Function: ai-tutor
// action "chat": one turn of an AI role-play (Nate, Luis, Maya…)
// action "mark": marks an open writing task with the A1 rubric
// Needs the secret OPENROUTER_API_KEY. Limits come from app_settings.ai and profiles.ai_bonus / ai_unlimited.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const MAX_STUDENT_TURNS = 6;
const MAX_TEXT = 1200;

type Msg = { role: "student" | "tutor"; text: string };

function fill(text: string, p: Record<string, string | null>) {
  return String(text ?? "").replace(/\{(\w+)\}/g, (m, k) => {
    if (k === "preferred_name") return p.preferred_name || "friend";
    if (k === "country") return p.country || "your country";
    if (k === "nationality") return p.nationality || "";
    if (k === "badge_name" || k === "name_spelling") return (p.name_spelling || p.preferred_name || "").toUpperCase();
    return m;
  });
}

function parseJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("AI did not return JSON");
  return JSON.parse(text.slice(start, end + 1));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: u } = await admin.auth.getUser(token);
    const user = u?.user;
    if (!user) return json({ error: "Not signed in" }, 401);

    const body = await req.json();
    const action = body.action as "chat" | "mark";
    const stepId = String(body.step_id ?? "");

    const [{ data: step }, { data: profile }, { data: settingsRow }] = await Promise.all([
      admin.from("steps").select("id, lesson_id, type, title, content, status").eq("id", stepId).maybeSingle(),
      admin.from("profiles").select("preferred_name, full_name, country, nationality, name_spelling, role, ai_bonus, ai_unlimited").eq("id", user.id).maybeSingle(),
      admin.from("app_settings").select("value").eq("key", "ai").maybeSingle(),
    ]);
    if (!step) return json({ error: "Exercise not found" }, 404);
    const staff = profile?.role === "admin" || profile?.role === "checker";
    const preview = Boolean(body.preview) && staff;

    // Lesson access is checked as the student, with the same rule as everywhere else.
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: canOpen } = await userClient.rpc("can_open_lesson", { p_lesson: step.lesson_id });
    if (!canOpen) return json({ error: "This lesson is locked" }, 403);
    if (step.status !== "published" && !staff) return json({ error: "Exercise not available" }, 404);

    const { data: lesson } = await admin.from("lessons")
      .select("title, objective, content, tip, module:modules(course:courses(language))").eq("id", step.lesson_id).maybeSingle();
    // Course language: "en" (English course) or "nl" (Dutch course). Default English.
    const lang = (lesson as any)?.module?.course?.language === "nl" ? "nl" : "en";
    const settings = settingsRow?.value ?? {};
    const model = settings.model ?? "google/gemini-2.5-flash";
    const p = { ...profile, preferred_name: profile?.preferred_name || profile?.full_name?.split(" ")[0] || null } as Record<string, string | null>;
    const c = step.content ?? {};
    const ad = c.answer_data ?? {};

    // ---------- daily limit ----------
    const kind = action === "chat" ? "tutor" : "marking";
    const today = new Date().toISOString().slice(0, 10);
    const limit = (kind === "tutor" ? (settings.daily_tutor_limit ?? 20) : (settings.daily_marking_limit ?? 30)) + (profile?.ai_bonus ?? 0);
    const unlimited = profile?.ai_unlimited || profile?.role === "admin";
    const { data: usage } = await admin.from("ai_usage").select("count, tokens").eq("user_id", user.id).eq("day", today).eq("kind", kind).maybeSingle();
    const used = usage?.count ?? 0;

    // Opening line of a role-play costs nothing
    if (action === "chat" && (!Array.isArray(body.messages) || body.messages.length === 0)) {
      const first = (ad.script ?? []).find((s: { role: string }) => s.role === "tutor");
      return json({ reply: fill(first?.text ?? "Hello! Let's practise.", p), done: false, remaining: unlimited ? null : Math.max(limit - used, 0) });
    }
    if (!unlimited && used >= limit) {
      return json({ limit_reached: true, message: "You have used today's AI practice. It resets tomorrow — you can skip this step for now." }, 200);
    }

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) return json({ error: "AI is not configured" }, 500);

    let messages: { role: string; content: string }[];
    let studentTurns = 0;

    if (action === "chat") {
      const history: Msg[] = (body.messages as Msg[]).slice(-20).map(m => ({
        role: m.role === "tutor" ? "tutor" : "student",
        text: String(m.text ?? "").slice(0, 400),
      }));
      studentTurns = history.filter(m => m.role === "student").length;
      const script = (ad.script ?? []).map((s: { role: string; text?: string; kind?: string; accept?: string[] }) =>
        s.role === "tutor"
          ? `- You say (adapt naturally): "${fill(s.text ?? "", p)}"`
          : `- The student should: ${s.kind ?? "answer"}${s.accept?.length ? ` (for example: ${s.accept.slice(0, 3).map(a => `"${a}"`).join(", ")})` : ""}`
      ).join("\n");
      const persona = ad.persona || "Nate";
      const formal = ["Peter de Vries", "Oude man"].includes(persona);
      const system = lang === "nl" ? [
        `You are ${persona}, a friendly character in a Dutch course for complete beginners (CEFR A1) at Nassau Academy in Curaçao.`,
        persona === "Peter de Vries" ? `You are meneer De Vries, the Dutch teacher: calm, warm and precise.` : "",
        `Most students are Spanish speakers from Latin America; some speak English.`,
        `You are practising a short scene with the student, ${p.preferred_name || "the student"}${p.country ? ` from ${p.country}` : ""}.`,
        `Lesson: "${lesson?.title ?? ""}". Goal: ${lesson?.objective ?? ""}. Language focus: ${lesson?.content ?? ""}`,
        lesson?.tip ? `Typical mistake in this lesson: ${lesson.tip}` : "",
        `Scene plan:\n${script || "- Have a short friendly conversation about the lesson topic."}`,
        `Rules:`,
        `- Speak ONLY simple A1 Dutch (standard Dutch, ABN) in "reply". Maximum 2 short sentences. Use only words a beginner knows.`,
        formal ? `- You are older / the teacher: the student should address you with "u". You address the student with "je/jij".` : `- Use "jij/je" with the student (informal).`,
        `- Stay in the scene. If the student goes off-topic, gently bring them back.`,
        `- If the student makes a mistake related to the lesson (word order, verb form, de/het, jij/u…), put ONE short correction in "tip": first the correct Dutch sentence, then a very short explanation in Spanish and English, e.g. "Ik ben 27 jaar. · En neerlandés: ik ben (no: ik heb). · Dutch uses ben for age." Otherwise "tip" is empty.`,
        `- If the student writes in Spanish or English, reply in simple Dutch and put the Dutch sentence they need in "tip".`,
        `- Accept small spelling mistakes outside the lesson focus.`,
        `- Never ask for sensitive personal information (address, phone, passwords).`,
        `- The scene is "done" when the student has done every part of the scene plan, or after ${MAX_STUDENT_TURNS} student messages. When done, end with a short friendly goodbye in Dutch.`,
        `Reply ONLY with JSON: {"reply": string, "tip": string, "done": boolean, "goals_met": boolean}`,
      ].filter(Boolean).join("\n") : [
        `You are ${persona}, a friendly character in an English course for complete beginners (CEFR A1) at Nassau Academy in Curaçao.`,
        `You are practising a short scene with the student, ${p.preferred_name || "the student"}${p.country ? ` from ${p.country}` : ""}.`,
        `Lesson: "${lesson?.title ?? ""}". Goal: ${lesson?.objective ?? ""}. Language focus: ${lesson?.content ?? ""}`,
        lesson?.tip ? `Typical mistake of Spanish speakers in this lesson: ${lesson.tip}` : "",
        `Scene plan:\n${script || "- Have a short friendly conversation about the lesson topic."}`,
        `Rules:`,
        `- Use only very simple A1 English. Maximum 2 short sentences per reply.`,
        `- Stay in the scene. If the student goes off-topic, gently bring them back.`,
        `- If the student makes a mistake related to the lesson, put ONE short correction in "tip" (e.g. Say: "I'm from Colombia."). Otherwise "tip" is empty.`,
        `- If the student writes in Spanish, answer in simple English and add a 3–6 word Spanish hint in "tip".`,
        `- Never ask for sensitive personal information (address, phone, passwords).`,
        `- The scene is "done" when the student has done every part of the scene plan, or after ${MAX_STUDENT_TURNS} student messages. When done, end with a short friendly goodbye.`,
        `Reply ONLY with JSON: {"reply": string, "tip": string, "done": boolean, "goals_met": boolean}`,
      ].filter(Boolean).join("\n");
      messages = [{ role: "system", content: system }, ...history.map(m => ({
        role: m.role === "tutor" ? "assistant" : "user", content: m.text,
      }))];
    } else {
      const text = String(body.text ?? "").trim().slice(0, MAX_TEXT);
      if (!text) return json({ no_score: true, reason: "Please write your answer first." });
      const variations = Array.isArray(c.variations) ? c.variations : [];
      const vi = variations.length ? Math.abs(Number(body.variation_index) || 0) % variations.length : -1;
      const variation = vi >= 0 ? variations[vi] : null;
      const task = [
        fill(c.task ?? c.instruction ?? c.question ?? "", p),
        variation ? `Situation for this student: ${typeof variation === "string" ? fill(variation, p) : fill(JSON.stringify(variation), p)}` : "",
        ad.model ? `Model answer (for reference only): ${fill(ad.model, p)}` : "",
        c.target ? `Lesson target to check: ${c.target}` : `Lesson focus: ${lesson?.content ?? lesson?.title ?? ""}`,
        c.required?.length ? `Required details: ${c.required.join(", ")}` : "",
      ].filter(Boolean).join("\n");
      const target = lang === "nl" ? "Dutch" : "English";
      const system = [
        `You mark short writing tasks for complete beginners (CEFR A1) learning ${target}, most of them Spanish speakers.`,
        `Be kind, encouraging and fair for A1. Focus mainly on the lesson target; ignore small errors outside it.`,
        `Rubric, each 0–2 points:`,
        `- task: 0 = most required information missing, 1 = some missing, 2 = all included`,
        `- target: 0 = lesson target not used or always wrong, 1 = used with some errors, 2 = used correctly`,
        `- words: 0 = hard to understand, 1 = some word/spelling errors, 2 = mostly correct for A1`,
        `- communication: 0 = a reader cannot follow it, 1 = understandable with effort, 2 = easy to understand`,
        `If the answer is empty, not in ${target}, or not about the task, set "no_score": true and give a short "reason".`,
        `If the answer is far above A1 level (likely copied), set "level_flag": true.`,
        `Give one short "strength", at most two "corrections" (lesson target first) with the corrected sentence, and an optional one-line Spanish hint "hint_es".`,
        `Never rewrite the whole text. Use simple English in all feedback.`,
        `Reply ONLY with JSON: {"no_score": boolean, "reason": string, "scores": {"task": 0-2, "target": 0-2, "words": 0-2, "communication": 0-2}, "strength": string, "corrections": [{"wrong": string, "right": string, "why": string}], "hint_es": string, "level_flag": boolean}`,
      ].join("\n");
      messages = [
        { role: "system", content: system },
        { role: "user", content: `Task:\n${task}\n\nStudent's answer:\n${text}` },
      ];
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-Title": "Nassau Academy English" },
      body: JSON.stringify({
        model,
        messages,
        temperature: action === "chat" ? 0.6 : 0.2,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
    });
    const ai = await res.json();
    if (!res.ok) return json({ error: ai?.error?.message ?? `AI error ${res.status}` }, 502);
    const raw = ai?.choices?.[0]?.message?.content ?? "";
    const tokens = ai?.usage?.total_tokens ?? 0;
    const out = parseJson(raw);

    // usage + log
    await admin.from("ai_usage").upsert({ user_id: user.id, day: today, kind, count: used + 1, tokens: (usage?.tokens ?? 0) + tokens });
    await admin.from("ai_logs").insert({
      user_id: user.id, step_id: step.id, kind: action, model, tokens,
      input: action === "chat" ? { messages: body.messages } : { text: body.text, variation_index: body.variation_index },
      output: out,
    });

    // record the result (not in preview)
    const record = async (correct: boolean, answer: unknown) => {
      if (preview) return { tries: 1 };
      const { data: prev } = await admin.from("step_results").select("correct, tries").eq("user_id", user.id).eq("step_id", step.id).maybeSingle();
      const tries = (prev?.tries ?? 0) + 1;
      if (prev && prev.tries >= 2 && !prev.correct) return { tries };
      await admin.from("step_results").upsert({
        user_id: user.id, step_id: step.id, lesson_id: step.lesson_id, correct, tries, answer, updated_at: new Date().toISOString(),
      });
      return { tries };
    };

    const remaining = unlimited ? null : Math.max(limit - used - 1, 0);

    if (action === "chat") {
      const done = Boolean(out.done) || studentTurns >= MAX_STUDENT_TURNS;
      if (done) await record(true, { conversation: body.messages, goals_met: Boolean(out.goals_met) });
      return json({ reply: String(out.reply ?? ""), tip: String(out.tip ?? ""), done, goals_met: Boolean(out.goals_met), remaining });
    }

    // mark
    if (out.no_score) return json({ no_score: true, reason: out.reason || `Please answer the task in ${lang === "nl" ? "Dutch" : "English"}.`, remaining });
    const s = out.scores ?? {};
    const clamp = (n: unknown) => Math.max(0, Math.min(2, Number(n) || 0));
    const scores = { task: clamp(s.task), target: clamp(s.target), words: clamp(s.words), communication: clamp(s.communication) };
    const total = scores.task + scores.target + scores.words + scores.communication;
    const levelFlag = Boolean(out.level_flag);
    const gradable = step.type === "writing_task";
    const pass = gradable ? total >= 5 && !levelFlag : true;
    const { tries } = await record(pass, { text: body.text, variation_index: body.variation_index, total, scores });
    return json({
      correct: pass,
      final: pass || tries >= 2,
      tries,
      total,
      scores,
      strength: String(out.strength ?? ""),
      corrections: (Array.isArray(out.corrections) ? out.corrections : []).slice(0, 2),
      hint_es: String(out.hint_es ?? ""),
      level_flag: levelFlag,
      remaining,
    });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
