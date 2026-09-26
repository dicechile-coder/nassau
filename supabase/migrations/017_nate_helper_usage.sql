-- 017: Floating Nate (help chat) gets its own daily AI counter, next to "tutor" (role-plays) and "marking".
alter table public.ai_usage drop constraint if exists ai_usage_kind_check;
alter table public.ai_usage add constraint ai_usage_kind_check check (kind in ('tutor', 'marking', 'helper'));

-- my_ai_allowance(): also report Nate's limit and usage (daily_helper_limit in app_settings.ai, default 30)
create or replace function public.my_ai_allowance()
returns jsonb language sql stable security definer set search_path = public as $$
  with s as (select value from public.app_settings where key = 'ai'),
       p as (select ai_bonus, ai_unlimited, role from public.profiles where id = auth.uid()),
       u as (select kind, count from public.ai_usage where user_id = auth.uid() and day = current_date)
  select jsonb_build_object(
    'unlimited', coalesce((select ai_unlimited or role = 'admin' from p), false),
    'tutor_limit', coalesce(((select value from s)->>'daily_tutor_limit')::int, 20) + coalesce((select ai_bonus from p), 0),
    'marking_limit', coalesce(((select value from s)->>'daily_marking_limit')::int, 30) + coalesce((select ai_bonus from p), 0),
    'helper_limit', coalesce(((select value from s)->>'daily_helper_limit')::int, 30) + coalesce((select ai_bonus from p), 0),
    'tutor_used', coalesce((select count from u where kind = 'tutor'), 0),
    'marking_used', coalesce((select count from u where kind = 'marking'), 0),
    'helper_used', coalesce((select count from u where kind = 'helper'), 0)
  );
$$;
