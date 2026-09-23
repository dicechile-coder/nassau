# Nassau Academy English

Self-study English platform (Level A1.1 first). React + Vite front end, Supabase back end, deployed on Hostinger from this repository (`main` → beta.nassauacademy.com).

## Structure
- `src/` — the web app (pages, auth, course loading)
- `supabase/migrations/` — database setup files, run in order in Supabase → SQL Editor
- `supabase/functions/` — Supabase Edge Functions (server code; AI calls)

## Environment variables (Hostinger)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (publishable key)

## Secrets (Supabase → Edge Functions → Secrets)
- `OPENROUTER_API_KEY`

Never commit keys to this repository.
