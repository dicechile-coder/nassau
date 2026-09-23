-- Nassau Academy English — Round 1 database setup
-- Run once in Supabase: SQL Editor → New query → paste everything → Run.

-- ============ Profiles & roles ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  preferred_name text,
  country text,
  role text not null default 'student' check (role in ('student','admin','checker')),
  created_at timestamptz not null default now()
);

create or replace function public.current_role_name()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() = 'admin', false);
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() in ('admin','checker'), false);
$$;

-- New sign-up → profile row
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, preferred_name)
  values (new.id,
          new.raw_user_meta_data->>'full_name',
          split_part(coalesce(new.raw_user_meta_data->>'full_name', ''), ' ', 1));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only admins (or the SQL editor) may change a role
create or replace function public.protect_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Only an administrator can change roles';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_role();

alter table public.profiles enable row level security;
drop policy if exists "profiles: read own or staff" on public.profiles;
create policy "profiles: read own or staff" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_staff());
drop policy if exists "profiles: update own or admin" on public.profiles;
create policy "profiles: update own or admin" on public.profiles
  for update to authenticated using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- ============ Content ============
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  level text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  position int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  position int not null,
  title text not null,
  description text,
  icon text,
  unique (course_id, position)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  position int not null,
  title text not null,
  objective text,
  summary text,
  can_do text,
  target_vocab text,
  target_grammar text,
  tip text,
  tip_es text,
  minutes int,
  pass_mark int not null default 70 check (pass_mark between 0 and 100),
  is_checkpoint boolean not null default false,
  video_url text,
  needs_video boolean not null default true,
  status text not null default 'draft' check (status in ('draft','published')),
  updated_at timestamptz not null default now(),
  unique (module_id, position)
);

create table if not exists public.steps (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  position int not null,
  type text not null,
  title text,
  content jsonb not null default '{}'::jsonb,
  points int not null default 1,
  needs_audio boolean not null default false,
  status text not null default 'published' check (status in ('draft','published')),
  unique (lesson_id, position)
);

-- ============ Progress ============
create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  best_score int,
  passed boolean not null default false,
  attempts int not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- ============ Settings (no secrets here — API keys live in Edge Function secrets) ============
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value) values
  ('ai', '{"provider":"openrouter","model":"google/gemini-2.5-flash","daily_tutor_limit":20,"daily_marking_limit":30,"last_test":null}')
on conflict (key) do nothing;

-- ============ Row level security ============
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.steps enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "courses: read" on public.courses;
create policy "courses: read" on public.courses for select to authenticated
  using (status = 'published' or public.is_staff());
drop policy if exists "courses: admin write" on public.courses;
create policy "courses: admin write" on public.courses for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "modules: read" on public.modules;
create policy "modules: read" on public.modules for select to authenticated using (true);
drop policy if exists "modules: admin write" on public.modules;
create policy "modules: admin write" on public.modules for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "lessons: read" on public.lessons;
create policy "lessons: read" on public.lessons for select to authenticated
  using (status = 'published' or public.is_staff());
drop policy if exists "lessons: admin write" on public.lessons;
create policy "lessons: admin write" on public.lessons for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Steps (exercise content incl. answers) are only readable by staff directly.
-- Students will receive steps through a server function in Round 2, without answers.
drop policy if exists "steps: staff read" on public.steps;
create policy "steps: staff read" on public.steps for select to authenticated using (public.is_staff());
drop policy if exists "steps: admin write" on public.steps;
create policy "steps: admin write" on public.steps for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Progress: students read their own; writes happen only through server functions (Round 2).
drop policy if exists "progress: read own or staff" on public.lesson_progress;
create policy "progress: read own or staff" on public.lesson_progress for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

drop policy if exists "settings: staff read" on public.app_settings;
create policy "settings: staff read" on public.app_settings for select to authenticated using (public.is_staff());
drop policy if exists "settings: admin write" on public.app_settings;
create policy "settings: admin write" on public.app_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ============ The one unlock rule (used by hub, lesson page and server) ============
-- Lesson 1 is open; every next lesson opens when the previous one is passed.
create or replace function public.lesson_status(p_course_code text)
returns table (lesson_id uuid, module_id uuid, status text, best_score int)
language sql stable security definer set search_path = public as $$
  with ordered as (
    select l.id, l.module_id,
           row_number() over (order by m.position, l.position) as rn
    from public.lessons l
    join public.modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
    where c.code = p_course_code and l.status = 'published'
  ),
  joined as (
    select o.id, o.module_id, o.rn, p.best_score, coalesce(p.passed, false) as passed
    from ordered o
    left join public.lesson_progress p on p.lesson_id = o.id and p.user_id = auth.uid()
  )
  select j.id, j.module_id,
         case
           when j.passed then 'done'
           when j.rn = 1 then 'open'
           when coalesce(lag(j.passed) over (order by j.rn), false) then 'open'
           else 'locked'
         end,
         j.best_score
  from joined j
  order by j.rn;
$$;

grant execute on function public.lesson_status(text) to authenticated;

-- ============ Seed: English A1.1 (from the Horizons CMS) ============
do $$
declare
  c uuid; m uuid;
begin
  if exists (select 1 from public.courses where code = 'en-a1-1') then
    return;
  end if;

  insert into public.courses (code, title, level, description, status)
  values ('en-a1-1', 'English A1.1', 'A1.1',
    'A survival English course for beginners. Four modules: personal identity, family & descriptions, daily routine & time, and around town.',
    'published')
  returning id into c;

  -- Module 1
  insert into public.modules (course_id, position, title, description, icon) values
    (c, 1, 'First Conversations & Personal Identity',
     'Greet someone, exchange names, say where you are from, spell your name, and complete a short first conversation.', 'Waves')
  returning id into m;
  insert into public.lessons (module_id, position, title, objective, summary, tip, minutes, is_checkpoint, status) values
    (m, 1, 'Hello, I''m…', 'After this lesson, you can start a simple conversation in English and tell someone your name.',
     'Hello / Hi, I''m…, My name is…, What''s your name?, Nice to meet you.',
     '“I’m” means “I am”, and “What’s” means “What is”. English uses these short forms a lot in conversation.', 28, false, 'published'),
    (m, 2, 'Where are you from?', 'After this lesson, you can say where you are from and ask another person.',
     'I''m from + country; I''m + nationality; Where are you from?',
     'Use a country after “from”: “I’m from Colombia.” Use a nationality to describe yourself: “I’m Colombian.”', 28, false, 'published'),
    (m, 3, 'Could you spell that?', 'After this lesson, you can spell your name when a receptionist needs the exact letters.',
     'The alphabet in sound families; How do you spell…?; Sorry, can you repeat that?',
     'English E sounds like “ee”; English I sounds like “eye”. Spanish speakers often mix these two.', 33, false, 'published'),
    (m, 4, 'Meet someone new', 'You can use everything from this module in one friendly first meeting.',
     'Greeting → name → origin → spelling, in one conversation.',
     'If you do not pass the first time, you only practise your weakest skill again.', 33, true, 'published');

  -- Module 2
  insert into public.modules (course_id, position, title, description, icon) values
    (c, 2, 'Family, Belongings & Descriptions',
     'Possessives, everyday objects and colours, describing people, and the Spanish word “su”.', 'Users')
  returning id into m;
  insert into public.lessons (module_id, position, title, objective, summary, tip, minutes, is_checkpoint, status) values
    (m, 1, 'Family Members & Relationships', 'You can talk about your family and use my, your, his, her, our and their.',
     'Possessive adjectives and family vocabulary (mother, father, sister, brother, parents).',
     'The Spanish word “su” can be HIS, HER, ITS or THEIR in English. Be specific!', 25, false, 'published'),
    (m, 2, 'Everyday Objects & Colors', 'You can name everyday objects and colours and use this, that, these and those.',
     'Plural endings (-s, -es) and demonstratives with everyday objects and colours.',
     'Adjectives never take an “s” in English: “blue cars”, not “blues cars”.', 25, false, 'published'),
    (m, 3, 'Describing People & Physical Appearance', 'You can describe what a person looks like.',
     'Descriptive adjectives (tall, short, young, old) and adjective order.',
     'Use “to be” for traits (“She is tall”) and “to have” for features (“She has brown hair”).', 25, false, 'published'),
    (m, 4, 'Module 2 Checkpoint & Family Tree', 'You can build a family tree and say who things belong to.',
     'Possessive ’s and possessive pronouns (mine, yours, his, hers).',
     'Use possessive ’s: “Maria’s car”, not “the car of Maria”.', 30, true, 'published');

  -- Module 3
  insert into public.modules (course_id, position, title, description, icon) values
    (c, 3, 'Daily Routine, Time & Frequency',
     'Present simple, telling time, daily habits and how often you do things.', 'Clock')
  returning id into m;
  insert into public.lessons (module_id, position, title, objective, summary, tip, minutes, is_checkpoint, status) values
    (m, 1, 'Telling Time & Days of the Week', 'You can say the time and the day, and plan your week.',
     'Prepositions of time (at 5:00, on Monday, in the morning) and the days of the week.',
     'Always use “It is” when telling the time: “It is 5 o’clock”, not “Is 5 o’clock”.', 25, false, 'published'),
    (m, 2, 'My Daily Morning Routine', 'You can describe your normal morning.',
     'Daily verbs (wake up, take a shower, eat breakfast, drink coffee) in the present simple.',
     'Use the present simple for habits: “I wake up at 7”, not “I am waking up at 7 every day”.', 25, false, 'published'),
    (m, 3, 'Third-Person Singular (-S Ending)', 'You can talk about another person''s routine.',
     'He / she / it + -s (works, plays, watches) and its pronunciation.',
     'Add -s for he / she / it: “He works”, not “He work”.', 25, false, 'published'),
    (m, 4, 'Module 3 Checkpoint & Weekly Habits', 'You can say how often you do things.',
     'Frequency adverbs (always, usually, sometimes, never) and their position.',
     'Frequency adverbs go before the main verb (“I always eat”) but after “to be” (“I am always happy”).', 30, true, 'published');

  -- Module 4
  insert into public.modules (course_id, position, title, description, icon) values
    (c, 4, 'Around Town, Places & Prepositions',
     'Places in the city, directions, in / on / at, and there is / there are.', 'MapPin')
  returning id into m;
  insert into public.lessons (module_id, position, title, objective, summary, tip, minutes, is_checkpoint, status) values
    (m, 1, 'Places in the City & Directions', 'You can ask where places are and give simple directions.',
     'City vocabulary (bank, hospital, school, library, restaurant) and directions (turn left, go straight).',
     'Make questions with “Where is…?” or “Is there…?”, not only with your voice.', 25, false, 'published'),
    (m, 2, 'Decoding IN, ON, AT (The “EN” Trap)', 'You can say where you are with in, on and at.',
     'In, on, at, next to, between — instead of the catch-all Spanish “en”.',
     'IN for inside spaces and cities, ON for surfaces and streets, AT for specific points.', 25, false, 'published'),
    (m, 3, 'There Is / There Are', 'You can say what there is in a place.',
     'There is / there are with a, an, some, any.',
     'Spanish “hay” is one word; English needs “There is a bank” and “There are two banks”.', 25, false, 'published'),
    (m, 4, 'A1.1 Final Capstone', 'You can introduce yourself and others and talk about family, routine and places.',
     'Review of all four modules with a final AI conversation.',
     'Focus on not translating directly from Spanish.', 35, true, 'published');
end $$;
