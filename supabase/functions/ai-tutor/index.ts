// Supabase Edge Function: ai-tutor
// action "chat": one turn of an AI role-play (Nate, Luis, Maya…)
//   voice: send "audio" (base64) + "audio_type" → transcribed with ElevenLabs (Scribe), returned as "heard"
//   send "speak": true → the reply comes back as spoken audio too ("audio", base64 mp3) in the character's voice
// action "mark": marks an open writing task with the A1 rubric
// Needs the secrets OPENROUTER_API_KEY (and ELEVENLABS_API_KEY for voice). Limits come from app_settings.ai
// and profiles.ai_bonus / ai_unlimited. Recordings are not stored.
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

const XI = "https://api.elevenlabs.io/v1";
const VOICE_SET: Record<string, string> = { en: "voices", nl: "voices_nl", es: "voices_es" };
const MAX_AUDIO = 1_500_000; // bytes, about 1 minute of compressed speech

function toB64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
function fromB64(b64: string) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Speech → text with ElevenLabs Scribe, in the course language
// "names" are passed as key terms so character names (Jan, Sofía…) and the student's own name are recognised
async function transcribe(key: string, audio: Uint8Array, type: string, lang: string, names: string[] = []) {
  const ext = type.includes("mp4") || type.includes("m4a") || type.includes("aac") ? "m4a" : type.includes("ogg") ? "ogg" : type.includes("wav") ? "wav" : type.includes("mpeg") || type.includes("mp3") ? "mp3" : "webm";
  const form = new FormData();
  form.append("model_id", "scribe_v2");
  form.append("language_code", lang);
  form.append("tag_audio_events", "false");
  form.append("timestamps_granularity", "none");
  for (const n of [...new Set(names.filter(Boolean))].slice(0, 20)) form.append("keyterms", n);
  form.append("file", new Blob([audio], { type: type || "audio/webm" }), `speech.${ext}`);
  const r = await fetch(`${XI}/speech-to-text`, { method: "POST", headers: { "xi-api-key": key }, body: form });
  if (!r.ok) throw new Error(`Speech recognition failed (${r.status}): ${(await r.text()).slice(0, 200)}`);
  const d = await r.json();
  return String(d.text ?? "").replace(/\s+/g, " ").trim();
}

// The character's voice from the course's voice set (app_settings voices / voices_nl / voices_es)
function voiceFor(set: Record<string, any>, persona: string) {
  const voices: Record<string, string> = set.voices ?? {};
  const norm = (x: string) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/^(the|el|la|de|het)\s+/, "").trim();
  const byNorm = new Map(Object.entries(voices).map(([k, v]) => [norm(k), v]));
  const alias: Record<string, string> = { "fruit seller": "seller", "peter de vries": "meneer de vries", "oude man": "old man" };
  const p = norm(persona);
  return byNorm.get(p) || byNorm.get(alias[p] ?? "") || byNorm.get("nate") || byNorm.get("sofia") || Object.values(voices)[0] || null;
}

async function speakText(key: string, set: Record<string, any>, voiceId: string, text: string) {
  const r = await fetch(`${XI}/text-to-speech/${voiceId}?output_format=mp3_44100_64`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text: text.slice(0, 400), model_id: set.model || "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: 0.92 },
    }),
  });
  if (!r.ok) throw new Error(`Voice failed (${r.status})`);
  return toB64(new Uint8Array(await r.arrayBuffer()));
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
    // Course language: "en" (English), "nl" (Dutch) or "es" (Spanish). Default English.
    const courseLang = (lesson as any)?.module?.course?.language;
    const lang = courseLang === "nl" || courseLang === "es" ? courseLang : "en";
    const settings = settingsRow?.value ?? {};
    const model = settings.model ?? "google/gemini-2.5-flash";
    const p = { ...profile, preferred_name: profile?.preferred_name || profile?.full_name?.split(" ")[0] || null } as Record<string, string | null>;
    const c = step.content ?? {};
    const ad = c.answer_data ?? {};

    // ---------- voice (optional) ----------
    const xiKey = Deno.env.get("ELEVENLABS_API_KEY") ?? "";
    const wantsVoice = action === "chat" && (Boolean(body.speak) || typeof body.audio === "string");
    let voiceSet: Record<string, any> = {};
    if (wantsVoice) {
      if (!xiKey) return json({ error: "Voice is not configured" }, 500);
      const { data: vs } = await admin.from("app_settings").select("value").eq("key", VOICE_SET[lang]).maybeSingle();
      voiceSet = vs?.value ?? {};
    }
    const speakReply = async (text: string) => {
      if (!body.speak || !text) return null;
      const vid = voiceFor(voiceSet, ad.persona || "Nate");
      if (!vid) return null;
      try { return await speakText(xiKey, voiceSet, vid, text); } catch { return null; }
    };

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
      const opening = fill(first?.text ?? "Hello! Let's practise.", p);
      return json({ reply: opening, audio: await speakReply(opening), done: false, remaining: unlimited ? null : Math.max(limit - used, 0) });
    }
    if (!unlimited && used >= limit) {
      return json({ limit_reached: true, message: "You have used today's AI practice. It resets tomorrow — you can skip this step for now." }, 200);
    }

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) return json({ error: "AI is not configured" }, 500);

    let messages: { role: string; content: string }[];
    let studentTurns = 0;

    // A voice message: turn the recording into text first; it becomes the student's newest message
    let heard: string | null = null;
    if (action === "chat" && typeof body.audio === "string") {
      const bytes = fromB64(body.audio);
      if (bytes.length > MAX_AUDIO) return json({ error: "That recording is too long. Please keep it under 15 seconds." }, 400);
      const names = [ad.persona, p.preferred_name, "Nassau", "Curaçao", "Jan", "Sofía", "Luis", "Maya", "Emma", "Ana", "Nate", "Carmen", "Diego"]
        .map(n => String(n ?? "").replace(/^(the|el)\s+/i, "").trim()).filter(n => n && n.length < 40);
      heard = await transcribe(xiKey, bytes, String(body.audio_type ?? "audio/webm"), lang, names);
      if (!heard) return json({ heard: "", retry: true, remaining: unlimited ? null : Math.max(limit - used, 0) });
      body.messages = [...(body.messages as Msg[]), { role: "student", text: heard }];
    }

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
      const formalEs = ["Carmen", "Señor", "el vendedor", "Vendedor", "Rosa"].includes(persona);
      const system = lang === "es" ? [
        `You are ${persona}, a friendly character in a Spanish course for complete beginners (CEFR A1) at Nassau Academy in Curaçao.`,
        persona === "Carmen" ? `You are Carmen, Sofía's Venezuelan mother: warm, patient and a little motherly.` : "",
        persona === "Señor" ? `You are an older gentleman in Punda (Willemstad), polite and helpful.` : "",
        /vendedor/i.test(persona) ? `You are a fruit seller at the floating market in Punda, cheerful and quick.` : "",
        `Most students are Dutch speakers living in Curaçao who want to talk with Latin Americans; some speak English.`,
        `You are practising a short scene with the student, ${p.preferred_name || "the student"}${p.country ? ` from ${p.country}` : ""}.`,
        `Lesson: "${lesson?.title ?? ""}". Goal: ${lesson?.objective ?? ""}. Language focus: ${lesson?.content ?? ""}`,
        lesson?.tip ? `Typical mistake in this lesson: ${lesson.tip}` : "",
        `Scene plan:\n${script || "- Have a short friendly conversation about the lesson topic."}`,
        `Rules:`,
        `- Speak ONLY simple A1 Latin American Spanish in "reply". Present tense only (no past tenses). Maximum 2 short sentences. Use only words a beginner knows.`,
        formalEs ? `- You are older / a stranger: the student should address you with "usted". You may address the student with "tú".` : `- Use "tú" with the student (informal).`,
        `- Stay in the scene. If the student goes off-topic, gently bring them back.`,
        `- If the student makes a mistake related to the lesson (ser/estar, tener for age, gender endings, tú/usted, word order…), put ONE short correction in "tip": first the correct Spanish sentence, then a very short explanation in Dutch and English, e.g. "Tengo 27 años. · In het Spaans: tener (niet ser). · Spanish uses tener for age." Otherwise "tip" is empty.`,
        `- If the student writes in Dutch or English, reply in simple Spanish and put the Spanish sentence they need in "tip".`,
        `- Accept missing accents and ¿ ¡ marks, and small spelling mistakes outside the lesson focus.`,
        heard ? `- The student's last message was SPOKEN and transcribed automatically: ignore punctuation, capitals and accents in it; correct only grammar and word choice.` : "",
        `- Never ask for sensitive personal information (address, phone, passwords).`,
        `- The scene is "done" when the student has done every part of the scene plan, or after ${MAX_STUDENT_TURNS} student messages. When done, end with a short friendly goodbye in Spanish.`,
        `Reply ONLY with JSON: {"reply": string, "tip": string, "done": boolean, "goals_met": boolean}`,
      ].filter(Boolean).join("\n") : lang === "nl" ? [
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
        heard ? `- The student's last message was SPOKEN and transcribed automatically: ignore punctuation and capitals in it; correct only grammar and word choice.` : "",
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
        heard ? `- The student's last message was SPOKEN and transcribed automatically: ignore punctuation and capitals in it; correct only grammar and word choice.` : "",
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
      const target = lang === "nl" ? "Dutch" : lang === "es" ? "Spanish" : "English";
      const system = [
        `You mark short writing tasks for complete beginners (CEFR A1) learning ${target}, ${lang === "es" ? "most of them Dutch speakers" : "most of them Spanish speakers"}.`,
        `Be kind, encouraging and fair for A1. Focus mainly on the lesson target; ignore small errors outside it.`,
        `Rubric, each 0–2 points:`,
        `- task: 0 = most required information missing, 1 = some missing, 2 = all included`,
        `- target: 0 = lesson target not used or always wrong, 1 = used with some errors, 2 = used correctly`,
        `- words: 0 = hard to understand, 1 = some word/spelling errors, 2 = mostly correct for A1`,
        `- communication: 0 = a reader cannot follow it, 1 = understandable with effort, 2 = easy to understand`,
        `If the answer is empty, not in ${target}, or not about the task, set "no_score": true and give a short "reason".`,
        `If the answer is far above A1 level (likely copied), set "level_flag": true.`,
        `Give one short "strength", at most two "corrections" (lesson target first) with the corrected sentence, and an optional one-line ${lang === "es" ? "Dutch" : "Spanish"} hint "hint_es".`,
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
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-Title": "Nassau Academy" },
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
      input: action === "chat" ? { messages: body.messages, voice: heard !== null } : { text: body.text, variation_index: body.variation_index },
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
      const reply = String(out.reply ?? "");
      return json({ reply, tip: String(out.tip ?? ""), done, goals_met: Boolean(out.goals_met), remaining, heard, audio: await speakReply(reply) });
    }

    // mark
    if (out.no_score) return json({ no_score: true, reason: out.reason || `Please answer the task in ${lang === "nl" ? "Dutch" : lang === "es" ? "Spanish" : "English"}.`, remaining });
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
