-- Spanish A1.1 course skeleton (draft: only staff see it until it is published).
do $$
declare c uuid; m uuid;
  mods text[][] := array[
    array['Conocerse', 'Kennismaken: groeten, namen, landen, spellen en leeftijd.'],
    array['Personas y cosas', 'Familie, spullen en kleuren, mensen beschrijven, van wie is het.'],
    array['El día a día', 'De tijd, je ochtend, werk en studie, een dag op het strand.'],
    array['En la ciudad', 'De weg vragen, op de markt, hay, en een dag in Punda.']];
  les text[] := array[
    'Hola, soy Jan', '¿De dónde eres?', '¿Cómo se escribe?', 'Tengo 30 años',
    'Mi familia', '¿Qué es esto?', '¿Cómo es?', '¿De quién es?',
    '¿Qué hora es?', 'Mi mañana', '¿En qué trabajas?', '¡A la playa!',
    '¿Dónde está la farmacia?', 'En el mercado', 'Hay una tienda', 'Un día en Punda'];
begin
  if exists (select 1 from public.courses where code = 'es-a1-1') then return; end if;
  insert into public.courses (code, title, level, description, status, position, language, voice_set)
  values ('es-a1-1', 'Español A1.1', 'A1.1',
          'Spaans voor beginners, gemaakt voor Nederlandstaligen op Curaçao. Latijns-Amerikaans Spaans, met uitleg in het Nederlands en Engels.',
          'draft', 3, 'es', 'voices_es')
  returning id into c;
  for i in 1..4 loop
    insert into public.modules (course_id, position, title, description) values (c, i, mods[i][1], mods[i][2]) returning id into m;
    for j in 1..4 loop
      insert into public.lessons (module_id, position, title, is_checkpoint, status)
      values (m, j, les[(i - 1) * 4 + j], j = 4, 'draft');
    end loop;
  end loop;
end $$;
