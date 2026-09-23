-- Round 1 fix: helper functions are not callable by visitors who are not signed in.
revoke execute on function public.current_role_name() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_staff() from public, anon;
revoke execute on function public.lesson_status(text) from public, anon;
-- Trigger functions: nobody calls these directly.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_role() from public, anon, authenticated;
-- Signed-in users still need these (used by access rules and the hub).
grant execute on function public.current_role_name() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.lesson_status(text) to authenticated;
