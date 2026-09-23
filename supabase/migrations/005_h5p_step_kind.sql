-- H5P activities: shown inside the lesson, completed when the student continues (not scored).
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
    when p_type = 'exit_ticket' and coalesce(p_content->'answer_data'->>'kind','') in ('completion','badge_ticket') then 'info'
    when p_type = 'exit_ticket' then 'open'
    else 'ai'
  end;
$$;
