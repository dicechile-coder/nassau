-- Round 9: more than one course. Each course has a language and a voice set.
-- Adds the Dutch A1.1 course skeleton (draft: only staff see it until it is published).
alter table public.courses add column if not exists language text not null default 'en';
alter table public.courses add column if not exists voice_set text not null default 'voices';
do $$ begin
  alter table public.courses add constraint courses_language_chk check (language in ('en', 'nl', 'es'));
exception when duplicate_object then null; end $$;

update public.courses set language = 'en', voice_set = 'voices' where code = 'en-a1-1';

do $$
declare c uuid; m uuid;
  mods text[][] := array[
    array['Kennismaken', 'Greetings, names, countries, spelling and ages.'],
    array['Familie en spullen', 'Family, everyday objects, colours, describing people, whose is it.'],
    array['Dag en tijd', 'Telling the time, your morning, what others do, how often.'],
    array['In de stad', 'Directions, in/op/aan/bij, er is/er zijn, and a tour of Punda.']];
  les text[] := array[
    'Hallo, ik ben…', 'Waar kom je vandaan?', 'Hoe spel je dat?', 'Wie is dat?',
    'Mijn familie', 'Wat is dat?', 'Hoe ziet ze eruit?', 'Is die tas van jou?',
    'Hoe laat is het?', 'Mijn ochtend', 'Hij werkt, zij studeert', 'Altijd, soms, nooit',
    'Waar is de apotheek?', 'In, op, aan, bij', 'Er is, er zijn', 'Eindproject'];
begin
  if exists (select 1 from public.courses where code = 'nl-a1-1') then return; end if;
  insert into public.courses (code, title, level, description, status, position, language, voice_set)
  values ('nl-a1-1', 'Nederlands A1.1', 'A1.1',
          'Dutch for beginners, made for Spanish speakers in Curaçao and Aruba. Four modules: kennismaken, familie en spullen, dag en tijd, in de stad.',
          'draft', 2, 'nl', 'voices_nl')
  returning id into c;
  for i in 1..4 loop
    insert into public.modules (course_id, position, title, description) values (c, i, mods[i][1], mods[i][2]) returning id into m;
    for j in 1..4 loop
      insert into public.lessons (module_id, position, title, is_checkpoint, status)
      values (m, j, les[(i - 1) * 4 + j], j = 4, 'draft');
    end loop;
  end loop;
end $$;
