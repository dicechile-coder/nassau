-- Nassau Academy English — Round 4: AI tutor and AI marking

-- Per-student AI overrides (set by admin)
alter table public.profiles add column if not exists ai_bonus int not null default 0;
alter table public.profiles add column if not exists ai_unlimited boolean not null default false;

-- Daily AI usage per student (written only by server functions)
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  kind text not null check (kind in ('tutor','marking')),
  count int not null default 0,
  tokens int not null default 0,
  primary key (user_id, day, kind)
);
alter table public.ai_usage enable row level security;
drop policy if exists "ai_usage: read own or staff" on public.ai_usage;
create policy "ai_usage: read own or staff" on public.ai_usage for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

-- Log of AI calls for quality checks (staff only)
create table if not exists public.ai_logs (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  step_id uuid references public.steps(id) on delete set null,
  kind text not null,
  input jsonb,
  output jsonb,
  tokens int,
  model text,
  created_at timestamptz not null default now()
);
alter table public.ai_logs enable row level security;
drop policy if exists "ai_logs: staff read" on public.ai_logs;
create policy "ai_logs: staff read" on public.ai_logs for select to authenticated using (public.is_staff());

-- New step kind: writing tasks marked by AI (scored), plus existing open tasks (feedback only)
create or replace function public.step_kind(p_type text, p_content jsonb)
returns text language sql immutable as $$
  select case
    when p_type in ('multiple_choice','listening_choose','scenario_choice','dialogue_completion','edit_choice',
                    'dialogue_diagnosis','meaning_context','false_friends_quiz','error_detect') then 'choice'
    when p_type = 'nationality_confirm' then 'nationality'
    when p_type in ('sentence_order','reorder_question','sentence_reorder') then 'order'
    when p_type = 'fill_in' then 'fill'
    when p_type = 'sort_groups' then 'sort'
    when p_type = 'sequence_order' then 'sequence'
    when p_type = 'personalized_input' then 'personal'
    when p_type = 'spelling_guided' then 'spelling'
    when p_type = 'model_dialogue' then 'info'
    when p_type = 'h5p' then 'h5p'
    when p_type = 'writing_task' then 'writing'
    when p_type = 'exit_ticket' and coalesce(p_content->'answer_data'->>'kind','') in ('completion','badge_ticket') then 'info'
    when p_type = 'exit_ticket' then 'open'
    else 'ai'
  end;
$$;

create or replace function public.step_gradable(p_type text, p_content jsonb)
returns boolean language sql immutable as $$
  select case public.step_kind(p_type, p_content)
    when 'choice' then true
    when 'order' then true
    when 'sort' then true
    when 'sequence' then true
    when 'writing' then true
    when 'fill' then p_content->'answer_data' ? 'answers'
    else false
  end;
$$;

-- Steps for the player now include a per-student seed, used to pick a writing-task variation.
create or replace function public.get_lesson_steps(p_lesson uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if not public.can_open_lesson(p_lesson) then raise exception 'This lesson is locked'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', s.id,
      'position', s.position,
      'type', s.type,
      'kind', public.step_kind(s.type, s.content),
      'gradable', public.step_gradable(s.type, s.content),
      'title', s.title,
      'needs_audio', s.needs_audio,
      'seed', abs(hashtext(auth.uid()::text || s.id::text)),
      'content', public.public_step_content(s.type, s.content),
      'result', (select jsonb_build_object('correct', r.correct, 'tries', r.tries)
                 from public.step_results r where r.user_id = auth.uid() and r.step_id = s.id)
    ) order by s.position)
    from public.steps s
    where s.lesson_id = p_lesson and s.status = 'published'
  ), '[]'::jsonb);
end;
$$;

-- Today's AI allowance for the current student
create or replace function public.my_ai_allowance()
returns jsonb language sql stable security definer set search_path = public as $$
  with s as (select value from public.app_settings where key = 'ai'),
       p as (select ai_bonus, ai_unlimited, role from public.profiles where id = auth.uid()),
       u as (select kind, count from public.ai_usage where user_id = auth.uid() and day = current_date)
  select jsonb_build_object(
    'unlimited', coalesce((select ai_unlimited or role = 'admin' from p), false),
    'tutor_limit', coalesce(((select value from s)->>'daily_tutor_limit')::int, 20) + coalesce((select ai_bonus from p), 0),
    'marking_limit', coalesce(((select value from s)->>'daily_marking_limit')::int, 30) + coalesce((select ai_bonus from p), 0),
    'tutor_used', coalesce((select count from u where kind = 'tutor'), 0),
    'marking_used', coalesce((select count from u where kind = 'marking'), 0)
  );
$$;

revoke execute on function public.my_ai_allowance() from public, anon;
grant execute on function public.my_ai_allowance() to authenticated;

-- Writing tasks can only be marked by the AI function
create or replace function public.check_step(p_step uuid, p_answer jsonb, p_preview boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s public.steps;
  k text;
  ad jsonb;
  ok boolean := false;
  prev public.step_results;
  tries int;
  final boolean;
  store_field text;
  val text;
  preview boolean := coalesce(p_preview, false);
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select * into s from public.steps where id = p_step and status = 'published';
  if not found then raise exception 'Step not found'; end if;
  if not public.can_open_lesson(s.lesson_id) then raise exception 'This lesson is locked'; end if;
  if preview and not public.is_staff() then raise exception 'Preview is for staff only'; end if;

  k := public.step_kind(s.type, s.content);
  ad := coalesce(s.content->'answer_data', '{}'::jsonb);

  if k = 'choice' then
    ok := public.norm_answer(p_answer->>'choice') = public.norm_answer(s.content->>'correct_answer');

  elsif k = 'order' then
    ok := exists (
      select 1 from jsonb_array_elements_text(
        coalesce(ad->'accept', jsonb_build_array(s.content->>'correct_answer'))) a
      where public.norm_answer(a) = public.norm_answer(p_answer->>'text'));

  elsif k = 'fill' then
    if ad ? 'answers' then
      ok := jsonb_typeof(p_answer->'blanks') = 'array'
        and jsonb_array_length(p_answer->'blanks') = jsonb_array_length(ad->'answers')
        and not exists (
          select 1 from jsonb_array_elements_text(ad->'answers') with ordinality a(v, i)
          where public.norm_answer(a.v) <> public.norm_answer(p_answer->'blanks'->>(a.i::int - 1)));
    else
      ok := jsonb_typeof(p_answer->'blanks') = 'array'
        and not exists (select 1 from jsonb_array_elements_text(p_answer->'blanks') b where trim(b) = '');
    end if;

  elsif k = 'sort' then
    ok := not exists (
      select 1 from jsonb_array_elements(ad->'items') i
      where coalesce(p_answer->'groups'->>(i->>'word'), '') <> i->>'group');

  elsif k = 'sequence' then
    ok := (p_answer->'order') = (ad->'correctOrder');

  elsif k in ('personal', 'spelling', 'nationality') then
    val := trim(coalesce(p_answer->>'text', p_answer->>'choice', ''));
    if k = 'spelling' then
      ok := val ~* '^[a-z]([ -]*[a-z])*$';
    elsif k = 'nationality' then
      ok := true;  -- any choice is fine, including skip
    else
      ok := val <> '';
    end if;
    if k = 'nationality' then
      val := trim(coalesce(p_answer->>'text', ''));  -- the nationality word itself; empty when skipped
    end if;
    store_field := ad->>'store';
    if ok and not preview and store_field in ('preferred_name','country','nationality','name_spelling') and val <> '' then
      execute format('update public.profiles set %I = $1 where id = $2', store_field)
        using case when k = 'spelling' then upper(val) else val end, auth.uid();
    end if;

  elsif k = 'writing' then
    raise exception 'This exercise is marked by the AI tutor';

  elsif k = 'open' then
    ok := trim(coalesce(p_answer->>'text', '')) <> '';

  else  -- info and ai (until Round 4): viewing / practising completes the step
    ok := true;
  end if;

  select * into prev from public.step_results where user_id = auth.uid() and step_id = p_step;
  tries := coalesce(prev.tries, 0) + 1;
  final := ok or tries >= 2;

  -- After the second wrong try the result is fixed until the lesson is restarted.
  if not preview and not (prev.user_id is not null and prev.tries >= 2 and not prev.correct) then
    insert into public.step_results (user_id, step_id, lesson_id, correct, tries, answer, updated_at)
    values (auth.uid(), p_step, s.lesson_id, ok, tries, p_answer, now())
    on conflict (user_id, step_id) do update
      set correct = excluded.correct, tries = excluded.tries, answer = excluded.answer, updated_at = now();
  end if;

  return jsonb_build_object(
    'correct', ok,
    'final', final,
    'tries', tries,
    'feedback', case when ok then s.content->>'feedback_correct'
                     when final then coalesce(s.content->>'feedback_incorrect', s.content->>'feedback_retry')
                     else coalesce(s.content->>'feedback_retry', s.content->>'feedback_incorrect') end,
    'explanation', case when ok or final then s.content->>'explanation' end,
    'explanation_es', case when ok or final then s.content->>'explanation_es' end
  );
end;
$$;
