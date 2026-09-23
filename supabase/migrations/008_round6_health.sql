-- Nassau Academy English — Round 6: health report (Admin → Health tab and the weekly report)

create or replace function public.health_report()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  r jsonb;
begin
  -- staff in the app; the database owner (weekly report) has no signed-in user
  if auth.uid() is not null and not public.is_staff() then raise exception 'Staff only'; end if;

  select jsonb_build_object(
    'generated_at', now(),
    'students', jsonb_build_object(
      'total',            (select count(*) from profiles where role = 'student'),
      'new_7d',           (select count(*) from profiles where role = 'student' and created_at > now() - interval '7 days'),
      'active_7d',        (select count(distinct user_id) from activity_days where day > current_date - 7),
      'active_today',     (select count(distinct user_id) from activity_days where day >= current_date - 1),
      'lessons_passed_7d',(select count(*) from lesson_progress where passed and completed_at > now() - interval '7 days'),
      'exercises_7d',     (select coalesce(sum(steps), 0) from activity_days where day > current_date - 7)
    ),
    'ai', jsonb_build_object(
      'calls_7d',   (select count(*) from ai_logs where created_at > now() - interval '7 days'),
      'tokens_7d',  (select coalesce(sum(tokens), 0) from ai_logs where created_at > now() - interval '7 days'),
      'students_at_limit_today', (select count(*) from ai_usage u
                                  where u.day = current_date
                                    and u.count >= coalesce(((select value from app_settings where key = 'ai')->>
                                          (case when u.kind = 'tutor' then 'daily_tutor_limit' else 'daily_marking_limit' end))::int, 20)),
      'model',      (select value->>'model' from app_settings where key = 'ai'),
      'last_test',  (select value->'last_test' from app_settings where key = 'ai')
    ),
    'content', jsonb_build_object(
      'lessons_published', (select count(*) from lessons where status = 'published'),
      'exercises_published', (select count(*) from steps where status = 'published'),
      'exercises_draft',   (select count(*) from steps where status <> 'published'),
      'missing_video',     (select count(*) from lessons where status = 'published' and needs_video and coalesce(video_url, '') = ''),
      'missing_audio',     (select count(*) from steps where status = 'published' and needs_audio and coalesce(content->>'audio_url', '') = ''),
      'empty_lessons',     (select coalesce(jsonb_agg(l.title), '[]'::jsonb) from lessons l
                            where l.status = 'published'
                              and not exists (select 1 from steps s where s.lesson_id = l.id and s.status = 'published')),
      'broken_exercises',  (select coalesce(jsonb_agg(jsonb_build_object('lesson', l.title, 'step', s.position, 'title', s.title, 'problem', p.problem)), '[]'::jsonb)
                            from steps s join lessons l on l.id = s.lesson_id
                            cross join lateral (select case
                              when public.step_kind(s.type, s.content) = 'choice' and s.type <> 'nationality_confirm'
                                   and not coalesce(s.content->'options' ? (s.content->>'correct_answer'), false)
                                then 'correct answer is not one of the options'
                              when public.step_kind(s.type, s.content) = 'order'
                                   and coalesce(s.content->>'correct_answer', '') = ''
                                   and jsonb_array_length(coalesce(s.content->'answer_data'->'accept', '[]'::jsonb)) = 0
                                then 'no accepted sentence'
                              when public.step_kind(s.type, s.content) = 'sequence'
                                   and jsonb_array_length(coalesce(s.content->'answer_data'->'correctOrder', '[]'::jsonb)) = 0
                                then 'no correct order'
                              when public.step_kind(s.type, s.content) = 'h5p' and coalesce(s.content->>'h5p_url', '') = ''
                                then 'no H5P link'
                            end as problem) p
                            where s.status = 'published' and p.problem is not null)
    )
  ) into r;
  return r;
end;
$$;

revoke execute on function public.health_report() from public, anon;
grant execute on function public.health_report() to authenticated;
