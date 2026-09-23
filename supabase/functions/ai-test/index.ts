// Supabase Edge Function: ai-test
// Checks that the AI provider answers with the model chosen in admin.
// Needs the secret OPENROUTER_API_KEY (Supabase → Edge Functions → Secrets).
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey);

  // Who is calling? Only admins may run the test.
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user) return json({ ok: false, message: "Not signed in" }, 401);

  const { data: profile } = await admin
    .from("profiles").select("role").eq("id", userData.user.id).single();
  if (profile?.role !== "admin") return json({ ok: false, message: "Admins only" }, 403);

  const { data: row } = await admin.from("app_settings").select("value").eq("key", "ai").single();
  const settings = row?.value ?? {};
  const model = settings.model ?? "google/gemini-2.5-flash";

  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  let result: { ok: boolean; message: string; model: string; at: string };

  if (!apiKey) {
    result = { ok: false, message: "OPENROUTER_API_KEY secret is missing", model, at: new Date().toISOString() };
  } else {
    try {
      const started = Date.now();
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "X-Title": "Nassau Academy English",
        },
        body: JSON.stringify({
          model,
          max_tokens: 10,
          messages: [{ role: "user", content: "Reply with the single word: OK" }],
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        result = { ok: false, message: body?.error?.message ?? `HTTP ${res.status}`, model, at: new Date().toISOString() };
      } else {
        const reply = body?.choices?.[0]?.message?.content ?? "";
        result = {
          ok: true,
          message: `Answered "${String(reply).trim().slice(0, 40)}" in ${Date.now() - started} ms`,
          model,
          at: new Date().toISOString(),
        };
      }
    } catch (e) {
      result = { ok: false, message: String(e), model, at: new Date().toISOString() };
    }
  }

  await admin.from("app_settings")
    .update({ value: { ...settings, last_test: result }, updated_at: new Date().toISOString() })
    .eq("key", "ai");

  return json(result);
});
