-- Round 9b: a word list per lesson (shown at the end of the lesson and as a printable PDF).
alter table public.lessons add column if not exists vocab jsonb not null default '[]'::jsonb;
comment on column public.lessons.vocab is 'Word list of the lesson: [{nl|en, en, es}] shown at the end of the lesson and as a printable PDF.';
-- Content of Dutch A1.1 (16 lessons, 152 steps) was loaded with supabase/seed/nl_a1_1_lessons.py.
