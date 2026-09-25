-- Role-plays: the example answers in the script ("accept") are hints for the student, not secret answers.
-- Keep them visible for ai_roleplay so the chat can show them as tap-to-use buttons; every other type still hides them.
create or replace function public.public_step_content(p_type text, p_content jsonb)
 returns jsonb
 language plpgsql
 immutable
 set search_path to 'public'
as $function$
declare
  c jsonb := p_content - 'correct_answer' - 'explanation' - 'explanation_es' - 'feedback_correct'
                        - 'feedback_incorrect' - 'horizons_id' - 'published' - 'required' - 'retry_allowed';
  ad jsonb := coalesce(p_content->'answer_data', '{}'::jsonb);
begin
  ad := ad - 'accept' - 'answers' - 'correctOrder' - 'mismatchPosition' - 'rubric';
  if jsonb_typeof(ad->'script') = 'array' and p_type <> 'ai_roleplay' then
    ad := jsonb_set(ad, '{script}', (select jsonb_agg(e - 'accept' order by n) from jsonb_array_elements(ad->'script') with ordinality x(e, n)));
  end if;
  if p_type = 'sort_groups' then
    ad := jsonb_set(ad, '{items}', coalesce((select jsonb_agg(i->>'word') from jsonb_array_elements(p_content->'answer_data'->'items') i), '[]'::jsonb));
  end if;
  if p_type = 'sentence_reorder' then
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
$function$;
