-- Nassau Academy English — Round 5: XP, streaks (with one freeze per week), progress page, admin student view

-- ---------- Security fix: students may not change their own AI allowance ----------
create or replace function public.protect_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Only an administrator can change roles';
    end if;
    if new.ai_bonus is distinct from old.ai_bonus or new.ai_unlimited is distinct from old.ai_unlimited then
      raise exception 'Only an administrator can change AI allowances';
    end if;
  end if;
  return new;
end;
$$;

-- Student's time zone decides when a "day" starts for streaks (set automatically from the browser)
alter table public.profiles add column if not exists timezone text not null default 'America/Curacao';

-- ---------- Tables (written only by server functions; students can only read their own) ----------
create table if not exists public.student_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp int not null default 0,
  streak_current int not null default 0,
  streak_best int not null default 0,
  last_active date,
  freeze_used_on date,          -- the missed day that a streak freeze covered
  updated_at timestamptz not null default now()
);
alter table public.student_stats enable row level security;
drop policy if exists "student_stats: read own or staff" on public.student_stats;
create policy "student_stats: read own or staff" on public.student_stats for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

create table if not exists public.xp_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,        -- step | lesson_pass | lesson_perfect
  ref uuid not null,           -- step id or lesson id
  points int not null,
  created_at timestamptz not null default now(),
  primary key (user_id, source, ref)   -- each reward only once, so replays cannot farm XP
);
alter table public.xp_events enable row level security;
drop policy if exists "xp_events: read own or staff" on public.xp_events;
create policy "xp_events: read own or staff" on public.xp_events for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

create table if not exists public.activity_days (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  xp int not null default 0,
  steps int not null default 0,
  primary key (user_id, day)
);
alter table public.activity_days enable row level security;
drop policy if exists "activity_days: read own or staff" on public.activity_days;
create policy "activity_days: read own or staff" on public.activity_days for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

-- ---------- Helpers ----------
-- Today's date in the student's time zone (falls back to Curaçao if the zone is unknown)
create or replace function public.local_day(p_user uuid)
returns date language plpgsql stable security definer set search_path = public as $$
declare tz text;
begin
  select timezone into tz from public.profiles where id = p_user;
  begin
    return (now() at time zone coalesce(tz, 'America/Curacao'))::date;
  exception when others then
    return (now() at time zone 'America/Curacao')::date;
  end;
end;
$$;

-- Records activity for today, updates the streak and adds XP
create or replace function public.record_activity(p_user uuid, p_xp int, p_steps int)
returns void language plpgsql security definer set search_path = public as $$
declare
  today date := public.local_day(p_user);
  st public.student_stats;
begin
  insert into public.activity_days (user_id, day, xp, steps) values (p_user, today, p_xp, p_steps)
  on conflict (user_id, day) do update
    set xp = public.activity_days.xp + excluded.xp, steps = public.activity_days.steps + excluded.steps;

  insert into public.student_stats (user_id) values (p_user) on conflict (user_id) do nothing;
  select * into st from public.student_stats where user_id = p_user for update;

  if st.last_active is distinct from today then
    if st.last_active = today - 1 then
      st.streak_current := st.streak_current + 1;
    elsif st.last_active = today - 2
          and (st.freeze_used_on is null or date_trunc('week', st.freeze_used_on) <> date_trunc('week', (today - 1)::timestamp)) then
      -- one missed day, covered by this week's streak freeze
      st.streak_current := st.streak_current + 1;
      st.freeze_used_on := today - 1;
    else
      st.streak_current := 1;
    end if;
    st.last_active := today;
  end if;

  update public.student_stats
     set xp = xp + p_xp,
         streak_current = st.streak_current,
         streak_best = greatest(streak_best, st.streak_current),
         last_active = st.last_active,
         freeze_used_on = st.freeze_used_on,
         updated_at = now()
   where user_id = p_user;
end;
$$;

-- Gives a reward once; returns the points actually added (0 if it was already given)
create or replace function public.award_xp(p_user uuid, p_source text, p_ref uuid, p_points int)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into public.xp_events (user_id, source, ref, points) values (p_user, p_source, p_ref, p_points)
  on conflict do nothing;
  get diagnostics n = row_count;
  return case when n > 0 then p_points else 0 end;
end;
$$;

-- ---------- Triggers ----------
-- Every answered exercise counts as activity; the first correct answer earns XP:
--   scored exercise 10 XP (5 XP on the second try), AI role-play 10 XP, other steps 2 XP
create or replace function public.on_step_result()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  s public.steps; k text; pts int := 0;
begin
  if tg_op = 'UPDATE' and new.tries = 0 then return new; end if;   -- lesson restart resets tries: not activity
  if new.correct and (tg_op = 'INSERT' or not old.correct) then
    select * into s from public.steps where id = new.step_id;
    k := public.step_kind(s.type, s.content);
    pts := case
      when k = 'ai' then 10
      when public.step_gradable(s.type, s.content) then case when new.tries <= 1 then 10 else 5 end
      else 2 end;
    pts := public.award_xp(new.user_id, 'step', new.step_id, pts);
  end if;
  perform public.record_activity(new.user_id, pts, 1);
  return new;
end;
$$;

drop trigger if exists step_results_progress on public.step_results;
create trigger step_results_progress after insert or update on public.step_results
  for each row execute function public.on_step_result();

-- Passing a lesson: 50 XP the first time, plus 20 XP for a perfect score
create or replace function public.on_lesson_progress()
returns trigger language plpgsql security definer set search_path = public as $$
declare pts int := 0;
begin
  if new.passed then pts := pts + public.award_xp(new.user_id, 'lesson_pass', new.lesson_id, 50); end if;
  if new.best_score = 100 then pts := pts + public.award_xp(new.user_id, 'lesson_perfect', new.lesson_id, 20); end if;
  if pts > 0 then perform public.record_activity(new.user_id, pts, 0); end if;
  return new;
end;
$$;

drop trigger if exists lesson_progress_xp on public.lesson_progress;
create trigger lesson_progress_xp after insert or update on public.lesson_progress
  for each row execute function public.on_lesson_progress();

-- ---------- Read functions ----------
-- The student's own progress summary (streak shown as 0 once it is really broken)
create or replace function public.my_progress()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  st public.student_stats;
  today date;
  freeze_free boolean;
  shown int;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  today := public.local_day(auth.uid());
  select * into st from public.student_stats where user_id = auth.uid();
  -- a freeze is free if none was used for a missed day in this week (or last week's freeze doesn't count)
  freeze_free := st.freeze_used_on is null
                 or date_trunc('week', st.freeze_used_on) <> date_trunc('week', (today - 1)::timestamp);
  shown := case
    when st.last_active is null then 0
    when st.last_active >= today - 1 then st.streak_current
    when st.last_active = today - 2 and freeze_free then st.streak_current   -- still savable today
    else 0 end;
  return jsonb_build_object(
    'xp', coalesce(st.xp, 0),
    'streak', coalesce(shown, 0),
    'streak_best', coalesce(st.streak_best, 0),
    'active_today', st.last_active = today,
    'at_risk', st.last_active = today - 2 and freeze_free,
    'freeze_available', freeze_free,
    'today', today,
    'xp_week', coalesce((select sum(xp) from public.activity_days where user_id = auth.uid() and day > today - 7), 0),
    'days', coalesce((select jsonb_agg(jsonb_build_object('day', day, 'xp', xp, 'steps', steps) order by day)
                      from public.activity_days where user_id = auth.uid() and day > today - 28), '[]'::jsonb),
    'freeze_day', st.freeze_used_on
  );
end;
$$;

-- Admin: list of students with their progress
create or replace function public.admin_students()
returns table (id uuid, full_name text, preferred_name text, email text, role text, country text, created_at timestamptz,
               xp int, streak int, last_active date, lessons_passed int, ai_bonus int, ai_unlimited boolean,
               ai_today int)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'Staff only'; end if;
  return query
  select p.id, p.full_name, p.preferred_name, u.email::text, p.role, p.country, p.created_at,
         coalesce(s.xp, 0),
         case when s.last_active >= public.local_day(p.id) - 1 then s.streak_current else 0 end,
         s.last_active,
         (select count(*)::int from public.lesson_progress lp where lp.user_id = p.id and lp.passed),
         p.ai_bonus, p.ai_unlimited,
         (select coalesce(sum(a.count), 0)::int from public.ai_usage a where a.user_id = p.id and a.day = current_date)
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.student_stats s on s.user_id = p.id
  order by p.created_at desc;
end;
$$;

-- ---------- Permissions ----------
revoke execute on function public.local_day(uuid) from public, anon, authenticated;
revoke execute on function public.record_activity(uuid, int, int) from public, anon, authenticated;
revoke execute on function public.award_xp(uuid, text, uuid, int) from public, anon, authenticated;
revoke execute on function public.on_step_result() from public, anon, authenticated;
revoke execute on function public.on_lesson_progress() from public, anon, authenticated;
revoke execute on function public.my_progress() from public, anon;
revoke execute on function public.admin_students() from public, anon;
grant execute on function public.my_progress() to authenticated;
grant execute on function public.admin_students() to authenticated;

-- ---------- Backfill from what students already did ----------
insert into public.xp_events (user_id, source, ref, points, created_at)
select r.user_id, 'step', r.step_id,
       case when public.step_kind(s.type, s.content) = 'ai' then 10
            when public.step_gradable(s.type, s.content) then 10 else 2 end,
       r.updated_at
from public.step_results r join public.steps s on s.id = r.step_id
where r.correct
on conflict do nothing;

insert into public.xp_events (user_id, source, ref, points, created_at)
select user_id, 'lesson_pass', lesson_id, 50, coalesce(completed_at, updated_at)
from public.lesson_progress where passed
on conflict do nothing;

insert into public.xp_events (user_id, source, ref, points, created_at)
select user_id, 'lesson_perfect', lesson_id, 20, updated_at
from public.lesson_progress where best_score = 100
on conflict do nothing;

insert into public.activity_days (user_id, day, xp, steps)
select user_id, (created_at at time zone 'America/Curacao')::date, sum(points), count(*) filter (where source = 'step')
from public.xp_events group by 1, 2
on conflict (user_id, day) do nothing;

insert into public.student_stats (user_id, xp, streak_current, streak_best, last_active)
select user_id, sum(xp), 1, 1, max(day) from public.activity_days group by user_id
on conflict (user_id) do nothing;

-- ---------- Advisor fix: fixed search_path on helper functions ----------
alter function public.norm_answer(text) set search_path = public;
alter function public.step_kind(text, jsonb) set search_path = public;
alter function public.step_gradable(text, jsonb) set search_path = public;
do $$ declare f text; begin
  select oid::regprocedure::text into f from pg_proc where proname = 'public_step_content' and pronamespace = 'public'::regnamespace;
  execute format('alter function %s set search_path = public', f);
end $$;
