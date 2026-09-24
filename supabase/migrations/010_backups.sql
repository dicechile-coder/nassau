-- Nassau Academy English — backups
-- backup_export(): everything needed to rebuild the course and the students' progress, as one JSON (Admin → Health → Download backup)
-- backup_snapshot(): keeps a copy inside the database too (last 8), run by the weekly report

create table if not exists public.backups (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  size_bytes int,
  data jsonb not null
);
alter table public.backups enable row level security;
drop policy if exists "backups: admin read" on public.backups;
create policy "backups: admin read" on public.backups for select to authenticated using (public.is_admin());

create or replace function public.backup_export()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then raise exception 'Admins only'; end if;
  return jsonb_build_object(
    'made_at', now(),
    'version', 1,
    'courses',        (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from courses t),
    'modules',        (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from modules t),
    'lessons',        (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from lessons t),
    'steps',          (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from steps t),
    'app_settings',   (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from app_settings t),
    'audio_lines',    (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from audio_lines t),
    'profiles',       (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from profiles t),
    'lesson_progress',(select coalesce(jsonb_agg(to_jsonb(t)), '[]') from lesson_progress t),
    'step_results',   (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from step_results t),
    'student_stats',  (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from student_stats t),
    'xp_events',      (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from xp_events t),
    'activity_days',  (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from activity_days t)
  );
end;
$$;

create or replace function public.backup_snapshot()
returns jsonb language plpgsql security definer set search_path = public as $$
declare d jsonb; sz int; new_id bigint;
begin
  if auth.uid() is not null and not public.is_admin() then raise exception 'Admins only'; end if;
  d := public.backup_export();
  sz := octet_length(d::text);
  insert into backups (size_bytes, data) values (sz, d) returning id into new_id;
  delete from backups where id not in (select id from backups order by created_at desc limit 8);
  return jsonb_build_object('id', new_id, 'size_bytes', sz, 'kept', (select count(*) from backups));
end;
$$;

revoke execute on function public.backup_export() from public, anon;
revoke execute on function public.backup_snapshot() from public, anon;
grant execute on function public.backup_export() to authenticated;
grant execute on function public.backup_snapshot() to authenticated;
