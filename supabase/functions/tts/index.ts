// Supabase Edge Function: tts  (admin only)
// Generates the course audio with ElevenLabs and stores it in the public "audio" bucket.
//   action "voices"   → the voices in your ElevenLabs account (name, id, preview)
//   action "test"     → { voice_id, text } → a short sample (base64 mp3), nothing is saved
//   action "generate" → { id } → one audio_lines row: every part in its character's voice,
//                        joined into one MP3, saved to audio/A1/…, and attached to the exercise
// Needs the secret ELEVENLABS_API_KEY. The key never leaves this function.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const API = "https://api.elevenlabs.io/v1";

function b64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) return json({ error: "Not signed in" }, 401);
    const { data: prof } = await admin.from("profiles").select("role").eq("id", u.user.id).maybeSingle();
    if (prof?.role !== "admin") return json({ error: "Admins only" }, 403);

    const key = Deno.env.get("ELEVENLABS_API_KEY");
    if (!key) return json({ error: "ELEVENLABS_API_KEY is not set in Supabase → Edge Functions → Secrets" }, 400);

    const body = await req.json();
    const { data: sRow } = await admin.from("app_settings").select("value").eq("key", "voices").maybeSingle();
    const s = sRow?.value ?? {};
    const model = s.model || "eleven_multilingual_v2";
    const format = s.format || "mp3_44100_192";

    async function speak(voiceId: string, text: string, speed: number) {
      const r = await fetch(`${API}/text-to-speech/${voiceId}?output_format=${format}`, {
        method: "POST",
        headers: { "xi-api-key": key!, "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify({
          text, model_id: model,
          voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: Math.min(1.2, Math.max(0.7, speed)) },
        }),
      });
      if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 300)}`);
      return new Uint8Array(await r.arrayBuffer());
    }

    if (body.action === "voices") {
      const r = await fetch(`${API}/voices`, { headers: { "xi-api-key": key } });
      if (!r.ok) return json({ error: `ElevenLabs ${r.status}: ${(await r.text()).slice(0, 300)}` }, 502);
      const d = await r.json();
      return json({ voices: (d.voices ?? []).map((v: any) => ({ id: v.voice_id, name: v.name, labels: v.labels ?? {}, preview: v.preview_url })) });
    }

    if (body.action === "test") {
      const text = String(body.text ?? "").slice(0, 300);
      if (!body.voice_id || !text) return json({ error: "voice_id and text needed" }, 400);
      const audio = await speak(String(body.voice_id), text, Number(body.speed) || 1);
      return json({ audio: b64(audio) });
    }

    if (body.action === "generate") {
      const { data: row } = await admin.from("audio_lines").select("*").eq("id", String(body.id ?? "")).maybeSingle();
      if (!row) return json({ error: "Line not found" }, 404);
      const voices = s.voices ?? {};
      const speed = Number((s.speed ?? {})[String(row.module)] ?? 1);
      const parts: Uint8Array[] = [];
      let chars = 0;
      for (let i = 0; i < row.lines.length; i++) {
        const l = row.lines[i];
        const voice = voices[l.speaker] || (l.speaker === "All" ? voices["Maya"] : null);
        if (!voice) return json({ error: `No voice chosen for ${l.speaker}` }, 400);
        const text = (i > 0 ? '<break time="0.8s" /> ' : "") + l.say;
        chars += l.say.length;
        parts.push(await speak(voice, text, speed));
      }
      const total = parts.reduce((a, p) => a + p.length, 0);
      const mp3 = new Uint8Array(total);
      let o = 0; for (const p of parts) { mp3.set(p, o); o += p.length; }

      const path = row.kind === "episode" ? `A1/E${String(row.episode).padStart(2, "0")}/${row.id}.mp3` : `A1/exercises/${row.id}.mp3`;
      const up = await admin.storage.from("audio").upload(path, mp3, { contentType: "audio/mpeg", upsert: true });
      if (up.error) return json({ error: `Storage: ${up.error.message}` }, 500);
      const publicUrl = `${admin.storage.from("audio").getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;

      await admin.from("audio_lines").update({ url: publicUrl, chars, generated_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", row.id);
      if (row.step_id) {
        const { data: st } = await admin.from("steps").select("content").eq("id", row.step_id).maybeSingle();
        if (st) await admin.from("steps").update({ content: { ...(st.content ?? {}), audio_url: publicUrl }, updated_at: new Date().toISOString() }).eq("id", row.step_id);
      }
      return json({ id: row.id, url: publicUrl, chars, bytes: total });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
