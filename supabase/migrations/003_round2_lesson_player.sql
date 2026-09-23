-- Nassau Academy English — Round 2: lesson player logic
-- Answers are checked on the server; students never receive the correct answers in advance.

alter table public.profiles add column if not exists nationality text;
alter table public.profiles add column if not exists name_spelling text;
alter table public.lessons add column if not exists content text;
alter table public.lessons add column if not exists content_es text;

-- One row per student per exercise step
create table if not exists public.step_results (
  user_id uuid not null references auth.users(id) on delete cascade,
  step_id uuid not null references public.steps(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  correct boolean not null default false,
  tries int not null default 0,
  answer jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, step_id)
);
alter table public.step_results enable row level security;
drop policy if exists "step_results: read own or staff" on public.step_results;
create policy "step_results: read own or staff" on public.step_results for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

-- ---------- helpers ----------
create or replace function public.norm_answer(t text)
returns text language sql immutable as $$
  select trim(regexp_replace(
           regexp_replace(lower(translate(coalesce(t, ''), '’‘“”–—', '''''""--')), '[^a-z0-9 ]', '', 'g'),
         '\s+', ' ', 'g'));
$$;

-- What kind of interaction a step type needs
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
    when p_type = 'exit_ticket' and coalesce(p_content->'answer_data'->>'kind','') in ('completion','badge_ticket') then 'info'
    when p_type = 'exit_ticket' then 'open'
    else 'ai'   -- ai_roleplay, ai_conversation, speak_or_type, final_mission: full AI support in Round 4
  end;
$$;

-- Does this step count towards the lesson score?
create or replace function public.step_gradable(p_type text, p_content jsonb)
returns boolean language sql immutable as $$
  select case public.step_kind(p_type, p_content)
    when 'choice' then true
    when 'order' then true
    when 'sort' then true
    when 'sequence' then true
    when 'fill' then p_content->'answer_data' ? 'answers'
    else false
  end;
$$;

-- Can the current user open this lesson? (staff always; students only open/done lessons)
create or replace function public.can_open_lesson(p_lesson uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_staff() or exists (
    select 1
    from public.lessons l
    join public.modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
    cross join lateral public.lesson_status(c.code) s
    where l.id = p_lesson and s.lesson_id = p_lesson and s.status <> 'locked'
  );
$$;

-- Content that is safe to send to the browser (no answers)
create or replace function public.public_step_content(p_type text, p_content jsonb)
returns jsonb language plpgsql immutable as $$
declare
  c jsonb := p_content - 'correct_answer' - 'explanation' - 'explanation_es' - 'feedback_correct'
                        - 'feedback_incorrect' - 'horizons_id' - 'published' - 'required' - 'retry_allowed';
  ad jsonb := coalesce(p_content->'answer_data', '{}'::jsonb);
begin
  ad := ad - 'accept' - 'answers' - 'correctOrder' - 'mismatchPosition' - 'rubric';
  if jsonb_typeof(ad->'script') = 'array' then
    -- role-play scripts: keep the tutor lines, hide the expected student answers
    ad := jsonb_set(ad, '{script}', (select jsonb_agg(e - 'accept' order by n) from jsonb_array_elements(ad->'script') with ordinality x(e, n)));
  end if;
  if p_type = 'sort_groups' then
    ad := jsonb_set(ad, '{items}', coalesce((select jsonb_agg(i->>'word') from jsonb_array_elements(p_content->'answer_data'->'items') i), '[]'::jsonb));
  end if;
  if p_type = 'sentence_reorder' then
    -- the only option is the correct sentence: send shuffled words instead
    c := c - 'options';
    ad := ad || jsonb_build_object('tokens',
      coalesce((select jsonb_agg(w order by md5(w || (p_content->>'correct_answer')))
                from regexp_split_to_table(p_content->>'correct_answer', '\s+') w), '[]'::jsonb));
  end if;
  if p_content ? 'answer_data' or p_type = 'sentence_reorder' then
    c := jsonb_set(c, '{answer_data}', ad);
  end if;
  return c;
end;
$$;

-- ---------- lesson steps for the player ----------
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
      'content', public.public_step_content(s.type, s.content),
      'result', (select jsonb_build_object('correct', r.correct, 'tries', r.tries)
                 from public.step_results r where r.user_id = auth.uid() and r.step_id = s.id)
    ) order by s.position)
    from public.steps s
    where s.lesson_id = p_lesson and s.status = 'published'
  ), '[]'::jsonb);
end;
$$;

-- ---------- check one answer ----------
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

-- ---------- finish a lesson ----------
create or replace function public.complete_lesson(p_lesson uuid, p_preview boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  total int; right_ int; score int; pass int; was_passed boolean; best int;
  wrong jsonb; preview boolean := coalesce(p_preview, false);
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if not public.can_open_lesson(p_lesson) then raise exception 'This lesson is locked'; end if;
  if preview and not public.is_staff() then raise exception 'Preview is for staff only'; end if;

  select pass_mark into pass from public.lessons where id = p_lesson;

  select count(*), count(*) filter (where r.correct)
    into total, right_
  from public.steps s
  left join public.step_results r on r.step_id = s.id and r.user_id = auth.uid()
  where s.lesson_id = p_lesson and s.status = 'published' and public.step_gradable(s.type, s.content);

  score := case when total = 0 then 100 else round(100.0 * right_ / total) end;

  select coalesce(jsonb_agg(s.id order by s.position), '[]'::jsonb) into wrong
  from public.steps s
  left join public.step_results r on r.step_id = s.id and r.user_id = auth.uid()
  where s.lesson_id = p_lesson and s.status = 'published'
    and public.step_gradable(s.type, s.content) and not coalesce(r.correct, false);

  if preview then
    return jsonb_build_object('score', score, 'passed', score >= pass, 'pass_mark', pass,
                              'best_score', score, 'wrong_steps', wrong, 'preview', true);
  end if;

  insert into public.lesson_progress (user_id, lesson_id, best_score, passed, attempts, completed_at, updated_at)
  values (auth.uid(), p_lesson, score, score >= pass, 1, case when score >= pass then now() end, now())
  on conflict (user_id, lesson_id) do update
    set best_score = greatest(public.lesson_progress.best_score, excluded.best_score),
        passed = public.lesson_progress.passed or excluded.passed,
        attempts = public.lesson_progress.attempts + 1,
        completed_at = coalesce(public.lesson_progress.completed_at, excluded.completed_at),
        updated_at = now()
  returning passed, best_score into was_passed, best;

  -- fresh tries for the next attempt (results are kept, so only wrong steps need redoing)
  update public.step_results set tries = 0 where user_id = auth.uid() and lesson_id = p_lesson;

  return jsonb_build_object('score', score, 'passed', score >= pass, 'ever_passed', was_passed,
                            'pass_mark', pass, 'best_score', best, 'wrong_steps', wrong, 'preview', false);
end;
$$;

-- ---------- permissions ----------
revoke execute on function public.can_open_lesson(uuid) from public, anon;
revoke execute on function public.get_lesson_steps(uuid) from public, anon;
revoke execute on function public.check_step(uuid, jsonb, boolean) from public, anon;
revoke execute on function public.complete_lesson(uuid, boolean) from public, anon;
grant execute on function public.can_open_lesson(uuid) to authenticated;
grant execute on function public.get_lesson_steps(uuid) to authenticated;
grant execute on function public.check_step(uuid, jsonb, boolean) to authenticated;
grant execute on function public.complete_lesson(uuid, boolean) to authenticated;
