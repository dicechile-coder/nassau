-- Nassau Academy English — Round 3: admin editor helpers

alter table public.steps add column if not exists updated_at timestamptz not null default now();

-- Move an exercise up or down within its lesson (admins only)
create or replace function public.move_step(p_step uuid, p_direction int)
returns void language plpgsql security definer set search_path = public as $$
declare
  s public.steps; other public.steps;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  select * into s from public.steps where id = p_step;
  if not found then raise exception 'Step not found'; end if;
  if p_direction < 0 then
    select * into other from public.steps where lesson_id = s.lesson_id and position < s.position order by position desc limit 1;
  else
    select * into other from public.steps where lesson_id = s.lesson_id and position > s.position order by position asc limit 1;
  end if;
  if not found then return; end if;
  update public.steps set position = -1 where id = s.id;
  update public.steps set position = s.position, updated_at = now() where id = other.id;
  update public.steps set position = other.position, updated_at = now() where id = s.id;
end;
$$;

-- Add a new exercise at the end of a lesson (admins only)
create or replace function public.add_step(p_lesson uuid, p_type text, p_title text, p_content jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  insert into public.steps (lesson_id, position, type, title, content, status)
  values (p_lesson, coalesce((select max(position) from public.steps where lesson_id = p_lesson), 0) + 1,
          p_type, p_title, coalesce(p_content, '{}'::jsonb), 'draft')
  returning id into new_id;
  return new_id;
end;
$$;

revoke execute on function public.move_step(uuid, int) from public, anon;
revoke execute on function public.add_step(uuid, text, text, jsonb) from public, anon;
grant execute on function public.move_step(uuid, int) to authenticated;
grant execute on function public.add_step(uuid, text, text, jsonb) to authenticated;
