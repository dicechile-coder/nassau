-- A1.1 content pack for Modules 2–4 (drafts). Safe to run twice: existing items are skipped.

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'model_dialogue', 'Scene — Maya’s family photos', '{"instruction": "Listen and read the scene from the story.", "question": "Scene — Maya’s family photos", "transcript": "Maya: Look, my photos. This is my family.\nMaya: This is my mother, and this is my father. My parents.\nSofía: Parents… like “parientes”?\nMaya: No. Parents: mother and father.\nLuis: My sister? Her name is Ana. My parents? Their names are Rosa and Jorge.", "answer_data": {"kind": "model_dialogue"}, "pack_id": "r4-m2l1-1"}'::jsonb, true, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 1
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l1-1');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'multiple_choice', 'Luis has a sister. ___ name is Ana.', '{"instruction": "Choose the correct answer.", "question": "Luis has a sister. ___ name is Ana.", "options": ["His", "Her", "Their", "Your"], "correct_answer": "Her", "explanation": "Ana is a woman, so we say “her name”.", "explanation_es": "Ana es mujer, por eso decimos “her name”.", "feedback_retry": "Is Ana a man or a woman?", "feedback_correct": "Correct!", "pack_id": "r4-m2l1-2"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 1
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l1-2');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'multiple_choice', 'Luis’s mother and father are his ___.', '{"instruction": "Choose the correct answer.", "question": "Luis’s mother and father are his ___.", "options": ["parents", "relatives", "cousins"], "correct_answer": "parents", "explanation": "“Parents” = mother and father. It is not “parientes” (relatives).", "explanation_es": "“Parents” = madre y padre. No es “parientes”.", "feedback_retry": "“Parents” is a false friend.", "feedback_correct": "Correct!", "pack_id": "r4-m2l1-3"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 1
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l1-3');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'fill_in', 'This is Maya. ______ brother is Dean.', '{"instruction": "Complete the sentences.", "question": "This is Maya. ______ brother is Dean.\nLuis and Ana are from Colombia. ______ parents are Rosa and Jorge.", "word_bank": ["His", "Her", "Their"], "answer_data": {"kind": "fill_in", "blanks": 2, "answers": ["Her", "Their"]}, "explanation": "Maya is a woman → her. Luis and Ana are two people → their.", "explanation_es": "Maya es mujer → her. Luis y Ana son dos personas → their.", "feedback_retry": "One woman → her. Two people → their.", "feedback_correct": "Correct!", "pack_id": "r4-m2l1-4"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 1
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l1-4');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'sentence_order', 'Build: His name is Pablo', '{"instruction": "Tap the words in order.", "question": "Make a sentence.", "answer_data": {"kind": "sentence_order", "tokens": ["His", "name", "is", "Pablo"], "accept": ["His name is Pablo"]}, "feedback_retry": "Start with “His”.", "feedback_correct": "Correct!", "pack_id": "r4-m2l1-5"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 1
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l1-5');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'writing_task', 'Writing: Write 3–4 sentences about a family. Use my, his, her or thei', '{"instruction": "Write in English. The AI tutor checks your writing.", "task": "Write 3–4 sentences about a family. Use my, his, her or their.", "variations": ["Write about your own family: three people.", "Write about a friend’s family: his or her mother, father and one brother or sister.", "Write about Maya’s family: her mother, her father, her sister Kim and her brother Dean."], "required": ["family words (mother, father, sister, brother, parents)", "at least two of: my, his, her, their"], "target": "possessive adjectives my / his / her / their and family words", "min_words": 15, "answer_data": {"kind": "writing_task", "model": "This is my family. My mother is Rosa. Her sister is Carmen. My brother is Pablo. His wife is Lucy."}, "pack_id": "r4-m2l1-6"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 1
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l1-6');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'ai_roleplay', 'Talk with Maya', '{"instruction": "Talk with Maya about your family.", "question": "Conversation with Maya", "answer_data": {"kind": "ai_roleplay", "persona": "Maya", "script": [{"role": "tutor", "text": "Hi {preferred_name}! Look, this is my family. Who is in your family?"}, {"role": "expect", "kind": "family_members", "accept": ["my mother", "my father", "my sister", "my brother"]}, {"role": "tutor", "text": "Nice! What is your mother’s name?"}, {"role": "expect", "kind": "possessive", "accept": ["her name is", "my mother’s name is"]}]}, "pack_id": "r4-m2l1-7"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 1
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l1-7');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'model_dialogue', 'Scene — The lost-and-found box', '{"instruction": "Listen and read the scene from the story.", "question": "Scene — The lost-and-found box", "transcript": "Mr. Jan: Your bag? What colour is it?\nLuis: It’s blue.\nMr. Jan: These bags are blue.\nLuis: Blues bags…\nSofía: “Blue bags.” Blue — no S.\nLuis: This is a pen. These are pens. This is a box. These are boxes.", "answer_data": {"kind": "model_dialogue"}, "pack_id": "r4-m2l2-1"}'::jsonb, true, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 2
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l2-1');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'multiple_choice', 'Choose the correct phrase.', '{"instruction": "Choose the correct answer.", "question": "Choose the correct phrase.", "options": ["two blues bags", "two blue bags", "two blue bag"], "correct_answer": "two blue bags", "explanation": "Adjectives never take -s in English: “blue bags”. Only the noun is plural.", "explanation_es": "Los adjetivos nunca llevan -s: “blue bags”. Solo el sustantivo es plural.", "feedback_retry": "Which word gets the -s: the colour or the thing?", "feedback_correct": "Correct!", "pack_id": "r4-m2l2-2"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 2
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l2-2');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'multiple_choice', 'The keys are far from you. ___ are my keys.', '{"instruction": "Choose the correct answer.", "question": "The keys are far from you. ___ are my keys.", "options": ["This", "These", "Those", "That"], "correct_answer": "Those", "explanation": "Plural and far → those. Plural and near → these.", "explanation_es": "Plural y lejos → those. Plural y cerca → these.", "feedback_retry": "Keys = plural. Far = that / those.", "feedback_correct": "Correct!", "pack_id": "r4-m2l2-3"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 2
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l2-3');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'fill_in', 'one box → two ______', '{"instruction": "Complete the sentences.", "question": "one box → two ______\none watch → two ______\none pen → two ______", "word_bank": [], "answer_data": {"kind": "fill_in", "blanks": 3, "answers": ["boxes", "watches", "pens"]}, "explanation": "Words ending in -x, -ch, -sh, -s add -es: boxes, watches. Most words add -s: pens.", "explanation_es": "Palabras que terminan en -x, -ch, -sh, -s añaden -es. La mayoría añade -s.", "feedback_retry": "Box and watch add -es.", "feedback_correct": "Correct!", "pack_id": "r4-m2l2-4"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 2
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l2-4');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'sort_groups', 'Singular or plural?', '{"instruction": "Put each item in the correct group.", "question": "Singular or plural?", "answer_data": {"kind": "sort_groups", "groups": ["Singular", "Plural"], "items": [{"word": "box", "group": "Singular"}, {"word": "pens", "group": "Plural"}, {"word": "watches", "group": "Plural"}, {"word": "key", "group": "Singular"}, {"word": "glasses", "group": "Plural"}, {"word": "phone", "group": "Singular"}]}, "feedback_retry": "Plural words usually end in -s or -es.", "feedback_correct": "Correct!", "pack_id": "r4-m2l2-5"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 2
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l2-5');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'writing_task', 'Writing: You lost your bag. Write a short lost-and-found notice (3–4 ', '{"instruction": "Write in English. The AI tutor checks your writing.", "task": "You lost your bag. Write a short lost-and-found notice (3–4 sentences).", "variations": ["You lost a blue bag. Inside: two pens, a phone and your keys.", "You lost a red backpack. Inside: three books and a black watch.", "You lost a green box. Inside: glasses and two notebooks."], "required": ["the colour of the bag or box", "what is inside (plural words)"], "target": "plurals with -s / -es and colours before nouns (no -s on colours)", "min_words": 15, "answer_data": {"kind": "writing_task", "model": "I lost my blue bag. It has two pens, a phone and my keys. Please call Nassau Academy."}, "pack_id": "r4-m2l2-6"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 2
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l2-6');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'ai_roleplay', 'Talk with Mr. Jan', '{"instruction": "Find your lost bag at Mr. Jan’s shop.", "question": "Conversation with Mr. Jan", "answer_data": {"kind": "ai_roleplay", "persona": "Mr. Jan", "script": [{"role": "tutor", "text": "Hello! Is this your bag? What colour is your bag?"}, {"role": "expect", "kind": "colour", "accept": ["it’s blue", "it is red", "my bag is black"]}, {"role": "tutor", "text": "OK. And what is in your bag?"}, {"role": "expect", "kind": "plural_items", "accept": ["two pens", "my keys", "three books"]}]}, "pack_id": "r4-m2l2-7"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 2
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l2-7');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'model_dialogue', 'Scene — The café', '{"instruction": "Listen and read the scene from the story.", "question": "Scene — The café", "transcript": "Luis: A woman has my bag. A blue bag.\nWaiter: She is young. She is short. She is long black hair.\nSofía: “She HAS long black hair.”\nWaiter: Yes! She has long black hair.\nMaya: That man is old. He has glasses. Not him.", "answer_data": {"kind": "model_dialogue"}, "pack_id": "r4-m2l3-1"}'::jsonb, true, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 3
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l3-1');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'multiple_choice', 'Choose the correct sentence.', '{"instruction": "Choose the correct answer.", "question": "Choose the correct sentence.", "options": ["She is long hair.", "She has long hair.", "She have long hair."], "correct_answer": "She has long hair.", "explanation": "Hair, eyes and glasses use “have / has”: She has long hair.", "explanation_es": "Pelo, ojos y lentes usan “have / has”: She has long hair.", "feedback_retry": "Hair → has.", "feedback_correct": "Correct!", "pack_id": "r4-m2l3-2"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 3
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l3-2');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'multiple_choice', 'He ___ tall and young.', '{"instruction": "Choose the correct answer.", "question": "He ___ tall and young.", "options": ["is", "has", "are"], "correct_answer": "is", "explanation": "Tall, short, young and old use “to be”: He is tall.", "explanation_es": "Tall, short, young y old usan “to be”: He is tall.", "feedback_retry": "Tall and young → is.", "feedback_correct": "Correct!", "pack_id": "r4-m2l3-3"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 3
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l3-3');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'fill_in', 'Emma ______ short. She ______ long black hair.', '{"instruction": "Complete the sentences.", "question": "Emma ______ short. She ______ long black hair.\nNate ______ tall. He ______ short brown hair.", "word_bank": ["is", "has"], "answer_data": {"kind": "fill_in", "blanks": 4, "answers": ["is", "has", "is", "has"]}, "explanation": "Traits (tall, short) → is. Hair → has.", "explanation_es": "Rasgos (tall, short) → is. Pelo → has.", "feedback_retry": "Height → is. Hair → has.", "feedback_correct": "Correct!", "pack_id": "r4-m2l3-4"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 3
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l3-4');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'sentence_order', 'Build: She has long black hair', '{"instruction": "Tap the words in order.", "question": "Make a sentence.", "answer_data": {"kind": "sentence_order", "tokens": ["She", "has", "long", "black", "hair"], "accept": ["She has long black hair"]}, "feedback_retry": "Size (long) comes before colour (black).", "feedback_correct": "Correct!", "pack_id": "r4-m2l3-5"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 3
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l3-5');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'writing_task', 'Writing: Describe a person so a friend can find them (3–4 sentences).', '{"instruction": "Write in English. The AI tutor checks your writing.", "task": "Describe a person so a friend can find them (3–4 sentences).", "variations": ["Describe a tall, old man with glasses.", "Describe a young woman with short red hair.", "Describe a person in your family."], "required": ["is + tall / short / young / old", "has + hair (and its colour)"], "target": "“is” for traits and “has” for hair, eyes and glasses; adjectives before the noun", "min_words": 15, "answer_data": {"kind": "writing_task", "model": "My sister is young and short. She has long brown hair and brown eyes."}, "pack_id": "r4-m2l3-6"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 3
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l3-6');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'ai_roleplay', 'Talk with Nate', '{"instruction": "Help Nate find your friend at the café.", "question": "Conversation with Nate", "answer_data": {"kind": "ai_roleplay", "persona": "Nate", "script": [{"role": "tutor", "text": "I’m at the café. I’m looking for your friend. Is your friend tall or short?"}, {"role": "expect", "kind": "trait", "accept": ["he is tall", "she is short"]}, {"role": "tutor", "text": "And the hair? What colour is it?"}, {"role": "expect", "kind": "feature", "accept": ["she has black hair", "he has short brown hair"]}]}, "pack_id": "r4-m2l3-7"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 3
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l3-7');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'model_dialogue', 'Scene — Whose bag is it?', '{"instruction": "Listen and read the scene from the story.", "question": "Scene — Whose bag is it?", "transcript": "Emma: Is this bag yours?\nLuis: Yes! It’s mine! Thank you!\nSofía: Is this phone yours, Luis?\nLuis: No, that phone is Maya’s. It’s hers.\nLuis: This is the mother of Luis…\nSofía: “Luis’s mother.”", "answer_data": {"kind": "model_dialogue"}, "pack_id": "r4-m2l4-1"}'::jsonb, true, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 4
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l4-1');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'multiple_choice', 'Choose the correct sentence.', '{"instruction": "Choose the correct answer.", "question": "Choose the correct sentence.", "options": ["This is the car of Maria.", "This is Maria’s car.", "This is Maria car."], "correct_answer": "This is Maria’s car.", "explanation": "English uses ’s for people: Maria’s car.", "explanation_es": "El inglés usa ’s con personas: Maria’s car (no “the car of Maria”).", "feedback_retry": "Use ’s after the name.", "feedback_correct": "Correct!", "pack_id": "r4-m2l4-2"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 4
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l4-2');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'multiple_choice', '“Is this phone yours?” — “No, it’s ___. It’s Maya’s phone.”', '{"instruction": "Choose the correct answer.", "question": "“Is this phone yours?” — “No, it’s ___. It’s Maya’s phone.”", "options": ["hers", "his", "mine", "her"], "correct_answer": "hers", "explanation": "Maya’s phone = her phone = hers.", "explanation_es": "El teléfono de Maya = hers.", "feedback_retry": "Maya is a woman: her → hers.", "feedback_correct": "Correct!", "pack_id": "r4-m2l4-3"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 4
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l4-3');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'fill_in', 'Rosa is ______ mother. (Luis)', '{"instruction": "Complete the sentences.", "question": "Rosa is ______ mother. (Luis)\nThis is ______ bag. (Emma)", "word_bank": [], "answer_data": {"kind": "fill_in", "blanks": 2, "answers": ["Luis’s", "Emma’s"]}, "explanation": "Name + ’s: Luis’s mother, Emma’s bag.", "explanation_es": "Nombre + ’s: Luis’s mother, Emma’s bag.", "feedback_retry": "Add ’s to the name.", "feedback_correct": "Correct!", "pack_id": "r4-m2l4-4"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 4
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l4-4');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'sequence_order', 'Order the conversation.', '{"instruction": "Put the lines in a natural order.", "question": "Order the conversation.", "answer_data": {"kind": "sequence_order", "items": [{"id": "A", "text": "Is this bag yours?"}, {"id": "B", "text": "Yes, it’s mine! Thank you!"}, {"id": "C", "text": "You’re welcome. Your badge says “LUES”!"}], "correctOrder": ["A", "B", "C"]}, "feedback_retry": "Start with the question.", "feedback_correct": "Correct!", "pack_id": "r4-m2l4-5"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 4
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l4-5');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'writing_task', 'Writing: Write 4 sentences about a family tree. Use ’s (e.g. “Rosa is', '{"instruction": "Write in English. The AI tutor checks your writing.", "task": "Write 4 sentences about a family tree. Use ’s (e.g. “Rosa is Luis’s mother”).", "variations": ["Luis’s family: Rosa (mother), Jorge (father), Ana and Pablo (sister and brother).", "Your own family.", "Maya’s family: Kim (sister) and Dean (brother)."], "required": ["possessive ’s (e.g. Luis’s mother)", "at least four family members"], "target": "possessive ’s with names", "min_words": 20, "answer_data": {"kind": "writing_task", "model": "Rosa is Luis’s mother. Jorge is Luis’s father. Ana is Luis’s sister. Pablo is Ana’s brother."}, "pack_id": "r4-m2l4-6"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 4
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l4-6');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'ai_roleplay', 'Talk with Emma', '{"instruction": "Help Emma give the things back to the right people.", "question": "Conversation with Emma", "answer_data": {"kind": "ai_roleplay", "persona": "Emma", "script": [{"role": "tutor", "text": "Hi {preferred_name}! I have some things here. Is this phone yours?"}, {"role": "expect", "kind": "possession", "accept": ["yes it’s mine", "no it’s not mine", "it’s hers"]}, {"role": "tutor", "text": "And these keys? Are they Luis’s keys?"}, {"role": "expect", "kind": "possessive_s", "accept": ["they are luis’s", "yes they are his"]}]}, "pack_id": "r4-m2l4-7"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 2 and l.position = 4
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m2l4-7');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'model_dialogue', 'Scene — Planning Ana’s visit', '{"instruction": "Listen and read the scene from the story.", "question": "Scene — Planning Ana’s visit", "transcript": "Sofía: Ana is in Curaçao on Friday. What time?\nLuis: At five… in the afternoon.\nLuis: What time is it now?\nSofía: Is ten o’clock.\nMaya: “IT is ten o’clock.” It’s ten o’clock.", "answer_data": {"kind": "model_dialogue"}, "pack_id": "r4-m3l1-1"}'::jsonb, true, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 1
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l1-1');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'multiple_choice', 'What time is it? (10:00)', '{"instruction": "Choose the correct answer.", "question": "What time is it? (10:00)", "options": ["Is ten o’clock.", "It is ten o’clock.", "Ten o’clock is."], "correct_answer": "It is ten o’clock.", "explanation": "Always use “It is” for the time.", "explanation_es": "Usa siempre “It is” para la hora (no “Is ten”).", "feedback_retry": "Don’t forget “It”.", "feedback_correct": "Correct!", "pack_id": "r4-m3l1-2"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 1
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l1-2');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'multiple_choice', 'I have class ___ Monday.', '{"instruction": "Choose the correct answer.", "question": "I have class ___ Monday.", "options": ["at", "on", "in"], "correct_answer": "on", "explanation": "Days use “on”: on Monday.", "explanation_es": "Los días usan “on”: on Monday.", "feedback_retry": "Days of the week → on.", "feedback_correct": "Correct!", "pack_id": "r4-m3l1-3"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 1
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l1-3');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'fill_in', 'Ana arrives ______ Friday ______ five o’clock ______ the afternoon.', '{"instruction": "Complete the sentences.", "question": "Ana arrives ______ Friday ______ five o’clock ______ the afternoon.", "word_bank": ["at", "on", "in"], "answer_data": {"kind": "fill_in", "blanks": 3, "answers": ["on", "at", "in"]}, "explanation": "on + day, at + time, in + part of the day.", "explanation_es": "on + día, at + hora, in + parte del día.", "feedback_retry": "Day → on. Clock time → at. Morning/afternoon → in.", "feedback_correct": "Correct!", "pack_id": "r4-m3l1-4"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 1
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l1-4');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'sort_groups', 'at, on or in?', '{"instruction": "Put each item in the correct group.", "question": "at, on or in?", "answer_data": {"kind": "sort_groups", "groups": ["at", "on", "in"], "items": [{"word": "five o’clock", "group": "at"}, {"word": "Monday", "group": "on"}, {"word": "the morning", "group": "in"}, {"word": "Friday", "group": "on"}, {"word": "9:30", "group": "at"}, {"word": "the evening", "group": "in"}]}, "feedback_retry": "Clock times → at. Days → on. Parts of the day → in.", "feedback_correct": "Correct!", "pack_id": "r4-m3l1-5"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 1
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l1-5');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'writing_task', 'Writing: Write your plan for the week (3–4 sentences) with days and t', '{"instruction": "Write in English. The AI tutor checks your writing.", "task": "Write your plan for the week (3–4 sentences) with days and times.", "variations": ["Tell Sofía your plan for Monday, Wednesday and Saturday.", "Invite a friend: the day, the time and the place.", "Write your class times for this week."], "required": ["days of the week", "at + time", "on + day"], "target": "on + day, at + time, in + part of the day; “It is” for the time", "min_words": 15, "answer_data": {"kind": "writing_task", "model": "On Monday I have class at nine o’clock. On Saturday, in the morning, I go to the beach."}, "pack_id": "r4-m3l1-6"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 1
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l1-6');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'ai_roleplay', 'Talk with Sofía', '{"instruction": "Plan the week with Sofía.", "question": "Conversation with Sofía", "answer_data": {"kind": "ai_roleplay", "persona": "Sofía", "script": [{"role": "tutor", "text": "Hi {preferred_name}! What time is it now?"}, {"role": "expect", "kind": "time", "accept": ["it is", "it’s"]}, {"role": "tutor", "text": "Great. When is your English class?"}, {"role": "expect", "kind": "day_time", "accept": ["on monday", "at nine", "in the morning"]}]}, "pack_id": "r4-m3l1-7"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 1
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l1-7');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'model_dialogue', 'Scene — Two mornings', '{"instruction": "Listen and read the scene from the story.", "question": "Scene — Two mornings", "transcript": "Sofía: Every day, I wake up at six o’clock.\nSofía: I take a shower. I get dressed. I eat breakfast at six thirty.\nLuis: Every day, I am waking up at eight fifty!\nMaya: “I wake up.” Every day, I wake up.", "answer_data": {"kind": "model_dialogue"}, "pack_id": "r4-m3l2-1"}'::jsonb, true, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 2
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l2-1');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'multiple_choice', 'Every day, I ___ at 6:30.', '{"instruction": "Choose the correct answer.", "question": "Every day, I ___ at 6:30.", "options": ["wake up", "am waking up", "wakes up"], "correct_answer": "wake up", "explanation": "Habits use the present simple: I wake up.", "explanation_es": "Los hábitos usan presente simple: I wake up (no “I am waking up”).", "feedback_retry": "Every day → present simple.", "feedback_correct": "Correct!", "pack_id": "r4-m3l2-2"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 2
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l2-2');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'fill_in', 'I ______ up at seven. I ______ a shower.', '{"instruction": "Complete the sentences.", "question": "I ______ up at seven. I ______ a shower.\nI ______ breakfast. I ______ coffee.", "word_bank": ["wake", "take", "eat", "drink"], "answer_data": {"kind": "fill_in", "blanks": 4, "answers": ["wake", "take", "eat", "drink"]}, "explanation": "wake up, take a shower, eat breakfast, drink coffee.", "explanation_es": "wake up, take a shower, eat breakfast, drink coffee.", "feedback_retry": "Which verb goes with “a shower”?", "feedback_correct": "Correct!", "pack_id": "r4-m3l2-3"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 2
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l2-3');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'sequence_order', 'Put the morning in order.', '{"instruction": "Put the lines in a natural order.", "question": "Put the morning in order.", "answer_data": {"kind": "sequence_order", "items": [{"id": "A", "text": "I wake up."}, {"id": "B", "text": "I take a shower."}, {"id": "C", "text": "I get dressed."}, {"id": "D", "text": "I eat breakfast."}, {"id": "E", "text": "I go to class."}], "correctOrder": ["A", "B", "C", "D", "E"]}, "feedback_retry": "What do you do first?", "feedback_correct": "Correct!", "pack_id": "r4-m3l2-4"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 2
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l2-4');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'sentence_order', 'Build: I go to class at nine', '{"instruction": "Tap the words in order.", "question": "Make a sentence.", "answer_data": {"kind": "sentence_order", "tokens": ["I", "go", "to", "class", "at", "nine"], "accept": ["I go to class at nine"]}, "feedback_retry": "Start with “I go”.", "feedback_correct": "Correct!", "pack_id": "r4-m3l2-5"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 2
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l2-5');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'writing_task', 'Writing: Describe your morning routine (4–5 sentences).', '{"instruction": "Write in English. The AI tutor checks your writing.", "task": "Describe your morning routine (4–5 sentences).", "variations": ["Your normal weekday morning.", "Your Saturday morning.", "Write as Sofía: wake up 6:00, shower, breakfast 6:30, class 8:30 (use “I”)."], "required": ["at least four daily verbs", "times with “at”"], "target": "present simple with “I” for habits (not “I am …ing”)", "min_words": 20, "answer_data": {"kind": "writing_task", "model": "I wake up at six thirty. I take a shower and I get dressed. I eat breakfast at seven. I go to work at eight."}, "pack_id": "r4-m3l2-6"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 2
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l2-6');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'ai_roleplay', 'Talk with Luis', '{"instruction": "Compare mornings with Luis.", "question": "Conversation with Luis", "answer_data": {"kind": "ai_roleplay", "persona": "Luis", "script": [{"role": "tutor", "text": "I’m always late! What time do you wake up, {preferred_name}?"}, {"role": "expect", "kind": "routine_time", "accept": ["i wake up at"]}, {"role": "tutor", "text": "Wow. And then? What do you do in the morning?"}, {"role": "expect", "kind": "routine", "accept": ["i take a shower", "i eat breakfast", "i drink coffee"]}]}, "pack_id": "r4-m3l2-7"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 2
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l2-7');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'model_dialogue', 'Scene — Ana’s routine', '{"instruction": "Listen and read the scene from the story.", "question": "Scene — Ana’s routine", "transcript": "Luis: Ana is a nurse. She work in a hospital.\nSofía: “She works.” Works.\nLuis: She works in a hospital. She wakes up at five o’clock. She plays volleyball. She watches TV every night.", "answer_data": {"kind": "model_dialogue"}, "pack_id": "r4-m3l3-1"}'::jsonb, true, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 3
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l3-1');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'multiple_choice', 'She ___ in a hospital.', '{"instruction": "Choose the correct answer.", "question": "She ___ in a hospital.", "options": ["work", "works", "working"], "correct_answer": "works", "explanation": "He / she / it + verb + s: she works.", "explanation_es": "He / she / it + verbo + s: she works.", "feedback_retry": "She → add -s.", "feedback_correct": "Correct!", "pack_id": "r4-m3l3-2"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 3
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l3-2');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'multiple_choice', 'Which sentence is correct?', '{"instruction": "Choose the correct answer.", "question": "Which sentence is correct?", "options": ["They works in Colombia.", "They work in Colombia."], "correct_answer": "They work in Colombia.", "explanation": "Only he / she / it add -s. They work.", "explanation_es": "Solo he / she / it añaden -s. They work.", "feedback_retry": "“They” is not he, she or it.", "feedback_correct": "Correct!", "pack_id": "r4-m3l3-3"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 3
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l3-3');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'fill_in', 'Ana ______ (wake) up at five. She ______ (watch) TV.', '{"instruction": "Complete the sentences.", "question": "Ana ______ (wake) up at five. She ______ (watch) TV.\nNate ______ (play) the guitar.", "word_bank": [], "answer_data": {"kind": "fill_in", "blanks": 3, "answers": ["wakes", "watches", "plays"]}, "explanation": "wakes, watches (-es after -ch), plays.", "explanation_es": "wakes, watches (-es después de -ch), plays.", "feedback_retry": "Watch ends in -ch → -es.", "feedback_correct": "Correct!", "pack_id": "r4-m3l3-4"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 3
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l3-4');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'sort_groups', 'How do you say the -s?', '{"instruction": "Put each item in the correct group.", "question": "How do you say the -s?", "answer_data": {"kind": "sort_groups", "groups": ["/s/", "/z/", "/ɪz/"], "items": [{"word": "works", "group": "/s/"}, {"word": "plays", "group": "/z/"}, {"word": "watches", "group": "/ɪz/"}, {"word": "drinks", "group": "/s/"}, {"word": "goes", "group": "/z/"}, {"word": "washes", "group": "/ɪz/"}]}, "feedback_retry": "After -ch and -sh you hear an extra syllable: /ɪz/.", "feedback_correct": "Correct!", "pack_id": "r4-m3l3-5"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 3
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l3-5');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'writing_task', 'Writing: Describe another person’s day (4–5 sentences). Use he or she', '{"instruction": "Write in English. The AI tutor checks your writing.", "task": "Describe another person’s day (4–5 sentences). Use he or she.", "variations": ["Ana: a nurse, wakes up at 5, works in a hospital, plays volleyball.", "A person in your family.", "Nate: works at reception, plays the guitar, watches football."], "required": ["he or she + verb with -s", "at least four verbs"], "target": "third person singular -s (works, plays, watches)", "min_words": 20, "answer_data": {"kind": "writing_task", "model": "My father is a teacher. He wakes up at six. He drinks coffee and he goes to school at seven."}, "pack_id": "r4-m3l3-6"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 3
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l3-6');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'ai_roleplay', 'Talk with Maya', '{"instruction": "Tell Maya about someone in your family.", "question": "Conversation with Maya", "answer_data": {"kind": "ai_roleplay", "persona": "Maya", "script": [{"role": "tutor", "text": "Tell me about a person in your family. What is his or her job?"}, {"role": "expect", "kind": "third_person", "accept": ["she works", "he works", "she is a"]}, {"role": "tutor", "text": "Nice! And what does he or she do in the evening?"}, {"role": "expect", "kind": "third_person_s", "accept": ["he watches", "she plays", "she reads"]}]}, "pack_id": "r4-m3l3-7"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 3
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l3-7');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'model_dialogue', 'Scene — Ana’s week', '{"instruction": "Listen and read the scene from the story.", "question": "Scene — Ana’s week", "transcript": "Luis: I always am late.\nSofía: “I am always late.” After “am”.\nLuis: I am always late. But Ana is never late.\nNate: We usually eat at the snack truck on Saturday.\nMaya: I always take photos!", "answer_data": {"kind": "model_dialogue"}, "pack_id": "r4-m3l4-1"}'::jsonb, true, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 4
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l4-1');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'multiple_choice', 'Choose the correct sentence.', '{"instruction": "Choose the correct answer.", "question": "Choose the correct sentence.", "options": ["I always am late.", "I am always late.", "Always I am late."], "correct_answer": "I am always late.", "explanation": "With “be”, the frequency word goes after: I am always late.", "explanation_es": "Con “be”, el adverbio va después: I am always late.", "feedback_retry": "Look at the verb “am”.", "feedback_correct": "Correct!", "pack_id": "r4-m3l4-2"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 4
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l4-2');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'multiple_choice', 'Maya ___ takes photos. (100%)', '{"instruction": "Choose the correct answer.", "question": "Maya ___ takes photos. (100%)", "options": ["always", "never", "sometimes"], "correct_answer": "always", "explanation": "100% = always, 0% = never.", "explanation_es": "100% = always, 0% = never.", "feedback_retry": "100% of the time.", "feedback_correct": "Correct!", "pack_id": "r4-m3l4-3"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 4
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l4-3');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'fill_in', 'Maya ______ takes photos. (100%)', '{"instruction": "Complete the sentences.", "question": "Maya ______ takes photos. (100%)\nLuis is ______ late. (100%) Ana is ______ late. (0%)", "word_bank": ["always", "usually", "sometimes", "never"], "answer_data": {"kind": "fill_in", "blanks": 3, "answers": ["always", "always", "never"]}, "explanation": "always = 100%, never = 0%.", "explanation_es": "always = 100%, never = 0%.", "feedback_retry": "0% = never.", "feedback_correct": "Correct!", "pack_id": "r4-m3l4-4"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 4
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l4-4');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'sentence_order', 'Build: We usually eat at the snack truck', '{"instruction": "Tap the words in order.", "question": "Make a sentence.", "answer_data": {"kind": "sentence_order", "tokens": ["We", "usually", "eat", "at", "the", "snack", "truck"], "accept": ["We usually eat at the snack truck"]}, "feedback_retry": "The frequency word goes before the main verb.", "feedback_correct": "Correct!", "pack_id": "r4-m3l4-5"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 4
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l4-5');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'writing_task', 'Writing: Write about your week (4 sentences). Use always, usually, so', '{"instruction": "Write in English. The AI tutor checks your writing.", "task": "Write about your week (4 sentences). Use always, usually, sometimes and never.", "variations": ["Your weekday habits.", "Your weekend habits.", "The habits of a friend (use he or she)."], "required": ["at least three of: always, usually, sometimes, never"], "target": "frequency adverbs before the main verb and after “be”", "min_words": 20, "answer_data": {"kind": "writing_task", "model": "I always drink coffee in the morning. I usually go to class at nine. I sometimes eat at the snack truck. I am never late."}, "pack_id": "r4-m3l4-6"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 4
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l4-6');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'ai_roleplay', 'Talk with Nate', '{"instruction": "Talk with Nate about your weekly habits.", "question": "Conversation with Nate", "answer_data": {"kind": "ai_roleplay", "persona": "Nate", "script": [{"role": "tutor", "text": "Hi {preferred_name}! Are you usually early or late?"}, {"role": "expect", "kind": "frequency_be", "accept": ["i am usually", "i am always", "i am never"]}, {"role": "tutor", "text": "And on Saturday? What do you usually do?"}, {"role": "expect", "kind": "frequency_verb", "accept": ["i usually", "i always", "i sometimes"]}]}, "pack_id": "r4-m3l4-7"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 3 and l.position = 4
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m3l4-7');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'model_dialogue', 'Scene — Finding the hotel', '{"instruction": "Listen and read the scene from the story.", "question": "Scene — Finding the hotel", "transcript": "Ana: The hotel is here?\nNate: “IS the hotel here?” No. Go straight. Then turn left.\nAna: Is there a library? I want a book.\nSofía: A library is not a “librería”. A bookshop sells books.", "answer_data": {"kind": "model_dialogue"}, "pack_id": "r4-m4l1-1"}'::jsonb, true, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 1
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l1-1');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'multiple_choice', 'Choose the correct question.', '{"instruction": "Choose the correct answer.", "question": "Choose the correct question.", "options": ["The bank is near here?", "Is the bank near here?", "Bank near here?"], "correct_answer": "Is the bank near here?", "explanation": "English questions start with the verb: Is the bank…?", "explanation_es": "Las preguntas en inglés empiezan con el verbo: Is the bank…?", "feedback_retry": "Start with “Is”.", "feedback_correct": "Correct!", "pack_id": "r4-m4l1-2"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 1
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l1-2');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'multiple_choice', 'Where do you buy books?', '{"instruction": "Choose the correct answer.", "question": "Where do you buy books?", "options": ["at a library", "at a bookshop"], "correct_answer": "at a bookshop", "explanation": "You buy books at a bookshop. At a library you read or borrow books.", "explanation_es": "Compras libros en una “bookshop”. “Library” = biblioteca.", "feedback_retry": "“Library” is a false friend.", "feedback_correct": "Correct!", "pack_id": "r4-m4l1-3"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 1
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l1-3');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'fill_in', '______ is the bank? — It’s on Main Street.', '{"instruction": "Complete the sentences.", "question": "______ is the bank? — It’s on Main Street.\n______ there a hospital near here? — Yes, there is.", "word_bank": ["Where", "Is", "What"], "answer_data": {"kind": "fill_in", "blanks": 2, "answers": ["Where", "Is"]}, "explanation": "Where = place. Is there…? = does it exist here?", "explanation_es": "Where = lugar. Is there…? = ¿hay…?", "feedback_retry": "The answer is a place → Where.", "feedback_correct": "Correct!", "pack_id": "r4-m4l1-4"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 1
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l1-4');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'sequence_order', 'Order the conversation.', '{"instruction": "Put the lines in a natural order.", "question": "Order the conversation.", "answer_data": {"kind": "sequence_order", "items": [{"id": "A", "text": "Excuse me, where is the bank?"}, {"id": "B", "text": "Go straight, then turn left."}, {"id": "C", "text": "Thank you!"}, {"id": "D", "text": "You’re welcome."}], "correctOrder": ["A", "B", "C", "D"]}, "feedback_retry": "Start with the question.", "feedback_correct": "Correct!", "pack_id": "r4-m4l1-5"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 1
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l1-5');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'writing_task', 'Writing: Write directions (3–4 sentences) from Nassau Academy to a pl', '{"instruction": "Write in English. The AI tutor checks your writing.", "task": "Write directions (3–4 sentences) from Nassau Academy to a place.", "variations": ["To the bank: go straight, then turn left.", "To the hotel: turn right, then go straight.", "To the library: go straight, turn right, then turn left."], "required": ["turn left / turn right", "go straight"], "target": "directions (go straight, turn left/right) and “Where is…?”", "min_words": 12, "answer_data": {"kind": "writing_task", "model": "Go straight. Then turn left. The bank is on the right."}, "pack_id": "r4-m4l1-6"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 1
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l1-6');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'ai_roleplay', 'Talk with Ana', '{"instruction": "Help Ana find places in town.", "question": "Conversation with Ana", "answer_data": {"kind": "ai_roleplay", "persona": "Ana", "script": [{"role": "tutor", "text": "Excuse me! I’m new here. Where is the bank?"}, {"role": "expect", "kind": "directions", "accept": ["go straight", "turn left", "turn right"]}, {"role": "tutor", "text": "Thank you! Is there a restaurant near here?"}, {"role": "expect", "kind": "there_is", "accept": ["yes there is", "there is a restaurant"]}]}, "pack_id": "r4-m4l1-7"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 1
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l1-7');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'model_dialogue', 'Scene — Where are you?', '{"instruction": "Listen and read the scene from the story.", "question": "Scene — Where are you?", "transcript": "Maya: I’m on Handelskade, next to the yellow building.\nSofía: I’m at the bus stop, between the bank and the library.\nLuis: I’m in the bridge!\nNate: In the bridge? In the water?\nSofía: “ON the bridge” — on top. Or “AT the bridge” — a point to meet.", "answer_data": {"kind": "model_dialogue"}, "pack_id": "r4-m4l2-1"}'::jsonb, true, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 2
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l2-1');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'multiple_choice', 'I live ___ Willemstad.', '{"instruction": "Choose the correct answer.", "question": "I live ___ Willemstad.", "options": ["in", "on", "at"], "correct_answer": "in", "explanation": "Cities and areas → in.", "explanation_es": "Ciudades y zonas → in.", "feedback_retry": "A city → in.", "feedback_correct": "Correct!", "pack_id": "r4-m4l2-2"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 2
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l2-2');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'multiple_choice', 'Meet me ___ the bus stop.', '{"instruction": "Choose the correct answer.", "question": "Meet me ___ the bus stop.", "options": ["in", "on", "at"], "correct_answer": "at", "explanation": "A meeting point → at.", "explanation_es": "Un punto de encuentro → at.", "feedback_retry": "A specific point → at.", "feedback_correct": "Correct!", "pack_id": "r4-m4l2-3"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 2
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l2-3');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'fill_in', 'The café is ______ Handelskade (a street).', '{"instruction": "Complete the sentences.", "question": "The café is ______ Handelskade (a street).\nLuis is ______ the bridge (a meeting point). Sofía lives ______ Otrobanda.", "word_bank": ["in", "on", "at"], "answer_data": {"kind": "fill_in", "blanks": 3, "answers": ["on", "at", "in"]}, "explanation": "Street → on. Meeting point → at. Area → in.", "explanation_es": "Calle → on. Punto de encuentro → at. Barrio → in.", "feedback_retry": "Street → on.", "feedback_correct": "Correct!", "pack_id": "r4-m4l2-4"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 2
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l2-4');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'sort_groups', 'in, on or at?', '{"instruction": "Put each item in the correct group.", "question": "in, on or at?", "answer_data": {"kind": "sort_groups", "groups": ["in", "on", "at"], "items": [{"word": "Curaçao", "group": "in"}, {"word": "the kitchen", "group": "in"}, {"word": "Main Street", "group": "on"}, {"word": "the table", "group": "on"}, {"word": "the bus stop", "group": "at"}, {"word": "the door", "group": "at"}]}, "feedback_retry": "Inside a space or city → in. Surface or street → on. A point → at.", "feedback_correct": "Correct!", "pack_id": "r4-m4l2-5"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 2
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l2-5');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'writing_task', 'Writing: Send a text message to a friend: where are you now? (2–3 sen', '{"instruction": "Write in English. The AI tutor checks your writing.", "task": "Send a text message to a friend: where are you now? (2–3 sentences)", "variations": ["You are on Handelskade, next to a yellow building.", "You are at the bus stop, between the bank and the library.", "You are in a café in Punda."], "required": ["in, on or at", "next to or between"], "target": "in / on / at, next to, between", "min_words": 12, "answer_data": {"kind": "writing_task", "model": "Hi! I’m at the bus stop, next to the bank. Where are you?"}, "pack_id": "r4-m4l2-6"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 2
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l2-6');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'ai_roleplay', 'Talk with Maya', '{"instruction": "Find Maya in town by phone.", "question": "Conversation with Maya", "answer_data": {"kind": "ai_roleplay", "persona": "Maya", "script": [{"role": "tutor", "text": "Hi {preferred_name}! Where are you now? I can’t see you!"}, {"role": "expect", "kind": "location", "accept": ["i am at", "i’m on", "i am in"]}, {"role": "tutor", "text": "OK! And where do you live?"}, {"role": "expect", "kind": "live_in", "accept": ["i live in"]}]}, "pack_id": "r4-m4l2-7"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 2
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l2-7');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'model_dialogue', 'Scene — The floating market', '{"instruction": "Listen and read the scene from the story.", "question": "Scene — The floating market", "transcript": "Ana: Look! There is bananas!\nMaya: “There ARE bananas.” Two, three, many: there are.\nSofía: Are there any mangoes?\nSeller: Yes, there are some mangoes.\nLuis: Is there any water?\nSeller: Sorry, there isn’t any water.", "answer_data": {"kind": "model_dialogue"}, "pack_id": "r4-m4l3-1"}'::jsonb, true, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 3
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l3-1');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'multiple_choice', 'There ___ two banks on this street.', '{"instruction": "Choose the correct answer.", "question": "There ___ two banks on this street.", "options": ["is", "are"], "correct_answer": "are", "explanation": "Plural → there are.", "explanation_es": "Plural → there are (el “hay” del español no cambia).", "feedback_retry": "Two banks = plural.", "feedback_correct": "Correct!", "pack_id": "r4-m4l3-2"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 3
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l3-2');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'multiple_choice', 'Is there ___ water?', '{"instruction": "Choose the correct answer.", "question": "Is there ___ water?", "options": ["a", "any", "some"], "correct_answer": "any", "explanation": "Questions with water (no plural) use “any”.", "explanation_es": "En preguntas usamos “any”: Is there any water?", "feedback_retry": "Question → any.", "feedback_correct": "Correct!", "pack_id": "r4-m4l3-3"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 3
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l3-3');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'fill_in', 'There ______ a market. There ______ some boats.', '{"instruction": "Complete the sentences.", "question": "There ______ a market. There ______ some boats.\nThere ______ an egg sandwich.", "word_bank": ["is", "are"], "answer_data": {"kind": "fill_in", "blanks": 3, "answers": ["is", "are", "is"]}, "explanation": "One thing → there is. Many → there are.", "explanation_es": "Una cosa → there is. Varias → there are.", "feedback_retry": "Boats = plural.", "feedback_correct": "Correct!", "pack_id": "r4-m4l3-4"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 3
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l3-4');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'sentence_order', 'Build: There are some mangoes on the boat', '{"instruction": "Tap the words in order.", "question": "Make a sentence.", "answer_data": {"kind": "sentence_order", "tokens": ["There", "are", "some", "mangoes", "on", "the", "boat"], "accept": ["There are some mangoes on the boat"]}, "feedback_retry": "Start with “There are”.", "feedback_correct": "Correct!", "pack_id": "r4-m4l3-5"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 3
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l3-5');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'writing_task', 'Writing: Describe your street or neighbourhood (4 sentences). Use the', '{"instruction": "Write in English. The AI tutor checks your writing.", "task": "Describe your street or neighbourhood (4 sentences). Use there is and there are.", "variations": ["Your street.", "The floating market in Willemstad: fruit, boats and people.", "Your school or workplace."], "required": ["there is", "there are", "some or any"], "target": "there is + singular, there are + plural, some / any", "min_words": 20, "answer_data": {"kind": "writing_task", "model": "There is a small supermarket on my street. There are two restaurants. There are some trees. There isn’t a bank."}, "pack_id": "r4-m4l3-6"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 3
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l3-6');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'ai_roleplay', 'Talk with the fruit seller', '{"instruction": "Buy fruit at the floating market.", "question": "Conversation with the fruit seller", "answer_data": {"kind": "ai_roleplay", "persona": "the fruit seller", "script": [{"role": "tutor", "text": "Good morning! Welcome to the market. Look, there are mangoes and bananas today!"}, {"role": "expect", "kind": "there_are", "accept": ["are there any", "is there any", "there are"]}, {"role": "tutor", "text": "And in your town, is there a market?"}, {"role": "expect", "kind": "there_is", "accept": ["yes there is", "no there isn’t", "there is"]}]}, "pack_id": "r4-m4l3-7"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 3
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l3-7');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'model_dialogue', 'Scene — The beach party', '{"instruction": "Listen and read the scene from the story.", "question": "Scene — The beach party", "transcript": "Emma: Hi! I’m Emma. What’s your name?\nAna: Hello! My name is Ana. I’m from Colombia. I’m twenty-six.\nLuis: Ana is my sister. She is tall. She has short brown hair.\nSofía: She works in a hospital. She always wakes up at five o’clock!\nNate: Is there an English class for you? Yes! On Monday, at nine o’clock.", "answer_data": {"kind": "model_dialogue"}, "pack_id": "r4-m4l4-1"}'::jsonb, true, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 4
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l4-1');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'multiple_choice', 'I ___ twenty-six years old.', '{"instruction": "Choose the correct answer.", "question": "I ___ twenty-six years old.", "options": ["have", "am", "has"], "correct_answer": "am", "explanation": "Age uses “to be”: I am 26.", "explanation_es": "La edad usa “to be”: I am 26 (no “I have 26 years”).", "feedback_retry": "Age → am.", "feedback_correct": "Correct!", "pack_id": "r4-m4l4-2"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 4
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l4-2');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'multiple_choice', 'Ana ___ in a hospital.', '{"instruction": "Choose the correct answer.", "question": "Ana ___ in a hospital.", "options": ["work", "works", "is work"], "correct_answer": "works", "explanation": "She + verb + s.", "explanation_es": "She + verbo + s.", "feedback_retry": "She → -s.", "feedback_correct": "Correct!", "pack_id": "r4-m4l4-3"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 4
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l4-3');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'fill_in', 'My name ______ Ana. I’m ______ Colombia.', '{"instruction": "Complete the sentences.", "question": "My name ______ Ana. I’m ______ Colombia.\n______ brother is Luis.", "word_bank": ["is", "from", "My", "Her"], "answer_data": {"kind": "fill_in", "blanks": 3, "answers": ["is", "from", "My"]}, "explanation": "My name is…, I’m from + country, my brother.", "explanation_es": "My name is…, I’m from + país, my brother.", "feedback_retry": "Country → from.", "feedback_correct": "Correct!", "pack_id": "r4-m4l4-4"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 4
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l4-4');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'writing_task', 'Writing: Introduce yourself (6–8 sentences): name, country, family, r', '{"instruction": "Write in English. The AI tutor checks your writing.", "task": "Introduce yourself (6–8 sentences): name, country, family, routine and your town.", "variations": ["Write it for a new classmate.", "Write it for a pen-friend in Aruba.", "Write it for the Nassau Academy welcome page."], "required": ["name and country", "one family member (with his or her)", "your daily routine with times", "one sentence with there is / there are"], "target": "all of A1.1", "min_words": 40, "answer_data": {"kind": "writing_task", "model": "Hello! My name is Ana. I’m from Colombia. I’m 26. My brother is Luis. His friends are nice. I wake up at five and I work in a hospital. There is a beautiful beach near my house."}, "pack_id": "r4-m4l4-5"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 4
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l4-5');

insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, 'ai_roleplay', 'Talk with Emma', '{"instruction": "Meet Emma at the beach party and talk about yourself.", "question": "Conversation with Emma", "answer_data": {"kind": "ai_roleplay", "persona": "Emma", "script": [{"role": "tutor", "text": "Hi! Welcome to the party! I’m Emma. What’s your name and where are you from?"}, {"role": "expect", "kind": "introduce", "accept": ["my name is", "i’m from"]}, {"role": "tutor", "text": "Nice! Tell me about your family."}, {"role": "expect", "kind": "family", "accept": ["my mother", "my brother", "my sister"]}, {"role": "tutor", "text": "And what do you usually do on the weekend?"}, {"role": "expect", "kind": "routine", "accept": ["i usually", "i always", "i sometimes"]}]}, "pack_id": "r4-m4l4-6"}'::jsonb, false, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = 4 and l.position = 4
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = 'r4-m4l4-6');
