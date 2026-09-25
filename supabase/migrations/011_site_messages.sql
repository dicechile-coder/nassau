-- Round 7b: messages from the public website (contact + placement talk forms).
-- Anyone may send (insert only); only admins can read, mark handled or delete.
create table if not exists public.site_messages (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  kind        text not null check (kind in ('contact', 'placement')),
  name        text not null check (char_length(name) between 1 and 120),
  email       text not null check (char_length(email) between 3 and 200 and email like '%@%'),
  language    text check (language is null or language in ('dutch', 'nt2', 'naturalization', 'english', 'spanish')),
  format      text check (format is null or format in ('in-person', 'online')),
  message     text not null default '' check (char_length(message) <= 4000),
  page        text check (page is null or char_length(page) <= 200),
  handled     boolean not null default false
);

alter table public.site_messages enable row level security;

drop policy if exists "site_messages: anyone can send" on public.site_messages;
create policy "site_messages: anyone can send" on public.site_messages
  for insert to anon, authenticated with check (handled = false);

drop policy if exists "site_messages: admin read" on public.site_messages;
create policy "site_messages: admin read" on public.site_messages
  for select to authenticated using (public.is_admin());

drop policy if exists "site_messages: admin update" on public.site_messages;
create policy "site_messages: admin update" on public.site_messages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "site_messages: admin delete" on public.site_messages;
create policy "site_messages: admin delete" on public.site_messages
  for delete to authenticated using (public.is_admin());

grant insert on public.site_messages to anon, authenticated;
grant select, update, delete on public.site_messages to authenticated;

create index if not exists site_messages_created_idx on public.site_messages (created_at desc);
