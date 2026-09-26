// Supabase Edge Function: nate — the floating help chat for signed-in students (text only).
//   { greet: true, course_code, lesson_id?, step_id? }  → a free greeting + "continue" button (no AI call)
//   { messages: [{role, text}], course_code, lesson_id?, step_id? } → Nate's answer (counts as "helper" in ai_usage)
// Nate knows the student's course, progress and the exercise on screen (never its answers),
// and answers platform questions only from the help text below.
// Needs the secret OPENROUTER_API_KEY. Daily limit: app_settings.ai.daily_helper_limit (default 30).
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

type Msg = { role: "student" | "nate"; text: string };

// ---------- the help text: everything Nate may say about the platform ----------
const HELP = `
NASSAU ACADEMY — HOW THE PLATFORM WORKS (self-study courses)
- Courses: English A1.1 (help in Spanish), Dutch A1.1 (help in Spanish and English), Spanish A1.1 (help in Dutch and English). Level A1.2 follows later. Students switch course with the course tabs at the top of the learning hub (/learn).
- Each course has 4 modules with 4 lessons. Every lesson: a short story video, then about 9 exercises, a role-play conversation with a story character, and a "real-life win" at the end.
- Unlocking: the next lesson opens when you pass the previous one with at least 70%. You can always go back to earlier lessons.
- Exercises: you get feedback straight away. A wrong answer can be tried once more. After a lesson you can practise only the exercises you missed.
- Role-plays (AI conversations): type your answer, or tap the microphone to send a voice message. The character replies in text and with voice; the speaker button in the chat header turns voice replies on or off. The first time, the browser asks for microphone permission: choose Allow. You can also skip a role-play for now.
- AI limits per day: about 20 role-play messages and 30 writing corrections; they reset every day. Nate's own messages have their own daily limit.
- Words: every lesson has a word list ("Words in this lesson") that you can save or download as PDF.
- Progress page (/learn/progress): best score, attempts and date passed per lesson, a calendar of practice days, XP and streak.
- XP: correct answer 10 XP (5 XP on the second try), finishing an AI conversation 10 XP, passing a lesson 50 XP, perfect score +20 XP. XP is given once per exercise.
- Streak: practise at least one exercise a day. One missed day per week is forgiven automatically by the streak freeze.
- Sound problems: check the volume and that the phone is not on silent; refresh the page; try Chrome, Edge or Safari. Microphone problems: allow the microphone in the browser settings for this site.
- Password: use "Forgot your password?" on the login page (/forgot-password).
- Teacher-led classes (group or private, Dutch NT2 and naturalization exam preparation) take place on the Moodle platform; there is a Moodle link in the website menu. A free placement talk can be booked at /placement.
- Prices for self-study have not been announced yet.
- Contact: email nassau.curacao@outlook.com or WhatsApp +599 9511 2981.
`;

const LANG_NAME: Record<string, string> = { en: "English", nl: "Dutch", es: "Spanish" };
// the language(s) Nate uses to explain things, per course
const HELP_LANG: Record<string, string> = { en: "simple English (Spanish is fine if the student writes in Spanish)", nl: "Spanish, or English if the student writes in English", es: "Dutch, or English if the student writes in English" };

function greeting(lang: string, name: string, nextIn: { num: string; title: string } | null, allDone: boolean, onLesson: boolean) {
  const n = name ? ` ${name}` : "";
  const next = nextIn; // titles keep their own punctuation ("Where are you from?", "Hallo, ik ben…")
  const t = {
    en: {
      hi: `Hi${n}! I'm Nate, your helper. Ask me anything about the course.`,
      next: next ? `Your next lesson: ${next.num} · ${next.title}` : "",
      done: "You finished every lesson of this course. Well done!",
      lesson: "Stuck on an exercise? Ask me and I'll explain it (without giving the answer).",
      go: "Continue",
    },
    nl: {
      hi: `¡Hola${n}! Soy Nate, tu ayudante. · Hi! I'm Nate, your helper.`,
      next: next ? `Tu próxima lección · Your next lesson: ${next.num} · ${next.title}` : "",
      done: "¡Terminaste todas las lecciones de este curso! · You finished the course!",
      lesson: "¿No entiendes un ejercicio? Pregúntame. · Stuck? Ask me.",
      go: "Continuar · Continue",
    },
    es: {
      hi: `Hoi${n}! Ik ben Nate, je hulp. · Hi! I'm Nate, your helper.`,
      next: next ? `Je volgende les · Your next lesson: ${next.num} · ${next.title}` : "",
      done: "Je hebt alle lessen van deze cursus af! · You finished the course!",
      lesson: "Snap je een oefening niet? Vraag het mij. · Stuck? Ask me.",
      go: "Verder · Continue",
    },
  }[lang as "en" | "nl" | "es"] ?? null;
  const g = t ?? { hi: `Hi${n}! I'm Nate.`, next: "", done: "", lesson: "", go: "Continue" };
  const lines = [g.hi, onLesson ? g.lesson : allDone ? g.done : g.next].filter(Boolean);
  return { text: lines.join("\n"), go: g.go };
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
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const body = await req.json();
    const lessonId = body.lesson_id ? String(body.lesson_id) : null;
    const stepId = body.step_id ? String(body.step_id) : null;

    const [{ data: profile }, { data: settingsRow }] = await Promise.all([
      admin.from("profiles").select("preferred_name, full_name, role, ai_bonus, ai_unlimited").eq("id", user.id).maybeSingle(),
      admin.from("app_settings").select("value").eq("key", "ai").maybeSingle(),
    ]);
    const staff = profile?.role === "admin" || profile?.role === "checker";
    const name = profile?.preferred_name || profile?.full_name?.split(" ")[0] || "";

    // ---------- the course: from the lesson on screen, else the one chosen in the hub ----------
    let courseCode = String(body.course_code ?? "en-a1-1");
    let lesson: any = null;
    if (lessonId) {
      const { data: canOpen } = await userClient.rpc("can_open_lesson", { p_lesson: lessonId });
      if (canOpen) {
        const { data } = await admin.from("lessons")
          .select("id, position, title, objective, content, tip, module:modules(position, title, course:courses(code))")
          .eq("id", lessonId).maybeSingle();
        lesson = data;
        if (lesson?.module?.course?.code) courseCode = lesson.module.course.code;
      }
    }
    const { data: course } = await admin.from("courses").select("id, code, title, language, status").eq("code", courseCode).maybeSingle();
    if (!course || (course.status !== "published" && !staff)) return json({ error: "Course not found" }, 404);
    const lang = ["en", "nl", "es"].includes(course.language) ? course.language : "en";

    // ---------- progress: the next open lesson ----------
    const [{ data: statuses }, { data: mods }] = await Promise.all([
      userClient.rpc("lesson_status", { p_course_code: course.code }),
      admin.from("modules").select("position, lessons(id, position, title, status)").eq("course_id", course.id),
    ]);
    const info = new Map<string, { num: string; title: string }>();
    for (const m of mods ?? []) for (const l of (m as any).lessons ?? []) info.set(l.id, { num: `${m.position}.${l.position}`, title: l.title });
    const st = (statuses ?? []) as { lesson_id: string; status: string }[];
    const nextRow = st.find(s => s.status === "open");
    const next = nextRow ? { id: nextRow.lesson_id, ...info.get(nextRow.lesson_id)! } : null;
    const doneCount = st.filter(s => s.status === "done").length;
    const allDone = st.length > 0 && doneCount === st.length;

    // ---------- greeting: free, no AI ----------
    if (body.greet) {
      const g = greeting(lang, name, next, allDone, Boolean(lesson));
      const showGo = next && !lesson;
      return json({ reply: g.text, action: showGo ? { label: g.go, to: `/learn/lesson/${next!.id}` } : null });
    }

    // ---------- the exercise on screen (instructions only, never answers) ----------
    let stepInfo = "";
    if (lesson && stepId) {
      const { data: step } = await admin.from("steps").select("id, lesson_id, type, title, content").eq("id", stepId).maybeSingle();
      if (step && step.lesson_id === lesson.id) {
        const c = step.content ?? {};
        stepInfo = [
          `Exercise type: ${step.type}`,
          step.title ? `Title: ${String(step.title).slice(0, 200)}` : "",
          c.instruction ? `Instruction: ${String(c.instruction).slice(0, 300)}` : "",
          c.question ? `Question: ${String(c.question).slice(0, 300)}` : "",
        ].filter(Boolean).join("\n");
      }
    }

    // ---------- daily limit ----------
    const settings = settingsRow?.value ?? {};
    const today = new Date().toISOString().slice(0, 10);
    const limit = (settings.daily_helper_limit ?? 30) + (profile?.ai_bonus ?? 0);
    const unlimited = profile?.ai_unlimited || profile?.role === "admin";
    const { data: usage } = await admin.from("ai_usage").select("count, tokens").eq("user_id", user.id).eq("day", today).eq("kind", "helper").maybeSingle();
    const used = usage?.count ?? 0;
    if (!unlimited && used >= limit) {
      const msg = { en: "That's all my messages for today. I'm back tomorrow!", nl: "Por hoy no puedo contestar más. ¡Hasta mañana! · That's all for today.", es: "Voor vandaag kan ik niet meer antwoorden. Tot morgen! · That's all for today." }[lang as "en"] ?? "That's all for today.";
      return json({ reply: msg, limit_reached: true });
    }

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) return json({ error: "AI is not configured" }, 500);

    const history: Msg[] = (Array.isArray(body.messages) ? body.messages : []).slice(-12).map((m: Msg) => ({
      role: m.role === "nate" ? "nate" : "student",
      text: String(m.text ?? "").slice(0, 500),
    }));
    if (!history.some(m => m.role === "student")) return json({ error: "Please type a question." }, 400);

    const system = [
      `You are Nate, the friendly helper of Nassau Academy, a language school in Curaçao. You chat in a small help window on the learning platform.`,
      `The student is ${name || "a student"}, taking the course "${course.title}" (learning ${LANG_NAME[lang]}, CEFR A1 beginner). Lessons done: ${doneCount} of ${st.length || 16}.`,
      next ? `Their next open lesson: ${next.num} · ${next.title}.` : allDone ? `They finished every lesson of this course.` : "",
      lesson ? `They are now in lesson ${lesson.module?.position}.${lesson.position} "${lesson.title}". Goal: ${lesson.objective ?? ""}. Language focus: ${lesson.content ?? ""}${lesson.tip ? ` Typical mistake: ${lesson.tip}` : ""}` : "They are not in a lesson right now.",
      stepInfo ? `The exercise on their screen:\n${stepInfo}` : "",
      `Help text (the ONLY source for facts about the platform, prices, contact and courses):\n${HELP}`,
      `Rules:`,
      `- Answer in ${HELP_LANG[lang]}. If the student writes in another of English, Spanish or Dutch, answer in that language. Keep it short: at most 4 short sentences, plain words, no markdown.`,
      `- Platform questions: answer only from the help text. If it is not there, say you are not sure and give the contact email or WhatsApp. Never invent features, prices or dates.`,
      `- Language questions: explain the grammar or word simply for an A1 beginner, with one short example sentence in ${LANG_NAME[lang]}.`,
      `- NEVER give, confirm or hint at the answer to the exercise on screen, even if asked directly or if the student guesses. Explain the general rule with a DIFFERENT example that uses other words and other people than the exercise and the lesson story (e.g. for gender endings use "mexicano / mexicana", not the word in the exercise). Then encourage them to try.`,
      `- Only talk about learning languages and this platform. Politely decline other topics.`,
      `- Never ask for passwords, addresses, phone numbers or payment details.`,
      `- If sending the student to their next lesson helps, set "action" to "continue". For the progress page use "progress". For contact questions use "contact". Otherwise "none".`,
      `Reply ONLY with JSON: {"reply": string, "action": "continue" | "progress" | "contact" | "none"}`,
    ].filter(Boolean).join("\n");

    const model = settings.model ?? "google/gemini-2.5-flash";
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-Title": "Nassau Academy" },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, ...history.map(m => ({ role: m.role === "nate" ? "assistant" : "user", content: m.text }))],
        temperature: 0.4,
        max_tokens: 400,
        response_format: { type: "json_object" },
      }),
    });
    const ai = await res.json();
    if (!res.ok) return json({ error: ai?.error?.message ?? `AI error ${res.status}` }, 502);
    const out = parseJson(ai?.choices?.[0]?.message?.content ?? "");
    const tokens = ai?.usage?.total_tokens ?? 0;

    await admin.from("ai_usage").upsert({ user_id: user.id, day: today, kind: "helper", count: used + 1, tokens: (usage?.tokens ?? 0) + tokens });
    await admin.from("ai_logs").insert({
      user_id: user.id, step_id: stepId && stepInfo ? stepId : null, kind: "helper", model, tokens,
      input: { messages: history, course: course.code, lesson_id: lesson?.id ?? null }, output: out,
    });

    const labels: Record<string, Record<string, string>> = {
      continue: { en: "Continue", nl: "Continuar · Continue", es: "Verder · Continue" },
      progress: { en: "My progress", nl: "Mi progreso · My progress", es: "Mijn voortgang · My progress" },
      contact: { en: "Contact", nl: "Contacto · Contact", es: "Contact" },
    };
    let action = null;
    if (out.action === "continue" && next) action = { label: labels.continue[lang], to: `/learn/lesson/${next.id}` };
    if (out.action === "progress") action = { label: labels.progress[lang], to: "/learn/progress" };
    if (out.action === "contact") action = { label: labels.contact[lang], to: "/contact" };

    return json({ reply: String(out.reply ?? "").slice(0, 900), action, remaining: unlimited ? null : Math.max(limit - used - 1, 0) });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
