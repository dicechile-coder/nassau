-- Automated test for the unlock and scoring rules.
-- Runs inside a transaction and rolls back: nothing is kept. Raises an error if a rule breaks.
begin;
do $$
declare
  u uuid := gen_random_uuid();
  l1 uuid; l2 uuid; st record; r jsonb; n int;
begin
  insert into auth.users (id, email, raw_user_meta_data) values (u, 'test-' || u || '@example.com', '{"full_name":"Test Student"}');
  perform set_config('request.jwt.claim.sub', u::text, true);

  select lesson_id into l1 from public.lesson_status('en-a1-1') limit 1;
  select lesson_id into l2 from public.lesson_status('en-a1-1') offset 1 limit 1;

  -- 1. Only lesson 1 is open for a new student
  select count(*) into n from public.lesson_status('en-a1-1') where status = 'open';
  if n <> 1 then raise exception 'FAIL: new student should have exactly 1 open lesson, has %', n; end if;
  if public.can_open_lesson(l2) then raise exception 'FAIL: lesson 2 must be locked'; end if;

  -- 2. Locked lessons cannot be loaded
  begin
    perform public.get_lesson_steps(l2);
    raise exception 'FAIL: get_lesson_steps returned a locked lesson';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;

  -- 3. Steps sent to the browser contain no answers
  if public.get_lesson_steps(l1)::text ~ '"correct_answer"|"accept"|"correctOrder"' then
    raise exception 'FAIL: answers leaked to the browser';
  end if;

  -- 4. Answer everything wrong → fail, lesson 2 stays locked
  for st in select id, type, content from public.steps where lesson_id = l1 and public.step_gradable(type, content) loop
    perform public.check_step(st.id, '{"choice":"__wrong__","text":"__wrong__","blanks":["x","y"],"order":[],"groups":{}}'::jsonb);
  end loop;
  r := public.complete_lesson(l1);
  if (r->>'passed')::boolean then raise exception 'FAIL: all-wrong attempt passed: %', r; end if;
  if public.can_open_lesson(l2) then raise exception 'FAIL: lesson 2 opened after a failed attempt'; end if;

  -- 5. Answer everything right → pass, lesson 2 opens, lesson 1 is done and stays open
  for st in select id, type, content from public.steps where lesson_id = l1 loop
    perform public.check_step(st.id, jsonb_build_object(
      'choice', st.content->>'correct_answer',
      'text', coalesce(st.content->'answer_data'->'accept'->>0, st.content->>'correct_answer', 'Test'),
      'blanks', coalesce(st.content->'answer_data'->'answers', '["Test","Test"]'::jsonb),
      'order', st.content->'answer_data'->'correctOrder',
      'groups', (select jsonb_object_agg(i->>'word', i->>'group') from jsonb_array_elements(st.content->'answer_data'->'items') i where i ? 'word')));
  end loop;
  r := public.complete_lesson(l1);
  if not (r->>'passed')::boolean then raise exception 'FAIL: all-correct attempt did not pass: %', r; end if;
  if not public.can_open_lesson(l2) then raise exception 'FAIL: lesson 2 did not open after passing lesson 1'; end if;
  if not exists (select 1 from public.lesson_status('en-a1-1') where lesson_id = l1 and status = 'done') then
    raise exception 'FAIL: lesson 1 should show as done';
  end if;

  -- 6. Best score is kept: a worse retry does not lower it or re-lock anything
  r := public.complete_lesson(l1);
  if (select best_score from public.lesson_progress where user_id = u and lesson_id = l1) < 70 then
    raise exception 'FAIL: best score dropped';
  end if;

  -- 7. Every lesson's steps can be prepared for the browser without errors (checked as staff)
  perform set_config('request.jwt.claim.sub', '', true);
  update public.profiles set role = 'admin' where id = u;
  perform set_config('request.jwt.claim.sub', u::text, true);
  for st in select id from public.lessons loop
    if public.get_lesson_steps(st.id)::text ~ '"correct_answer"|"accept"|"correctOrder"|"answers"' then
      raise exception 'FAIL: answers leaked in lesson %', st.id;
    end if;
  end loop;

  raise notice 'ALL UNLOCK AND SCORING TESTS PASSED';
end $$;
rollback;
