# Generates SQL for new A1.1 exercises (Modules 2–4). All inserted as drafts for review.
import json

def mc(q, options, answer, expl, expl_es, retry, instruction='Choose the correct answer.'):
    return ('multiple_choice', q, {'instruction': instruction, 'question': q, 'options': options, 'correct_answer': answer,
            'explanation': expl, 'explanation_es': expl_es, 'feedback_retry': retry, 'feedback_correct': 'Correct!'})

def fill(q, answers, bank, expl, expl_es, retry, instruction='Complete the sentences.'):
    return ('fill_in', q.split('\n')[0][:80], {'instruction': instruction, 'question': q, 'word_bank': bank,
            'answer_data': {'kind': 'fill_in', 'blanks': len(answers), 'answers': answers},
            'explanation': expl, 'explanation_es': expl_es, 'feedback_retry': retry, 'feedback_correct': 'Correct!'})

def order(tokens, accept, retry, instruction='Tap the words in order.'):
    return ('sentence_order', 'Build: ' + ' '.join(tokens), {'instruction': instruction, 'question': 'Make a sentence.',
            'answer_data': {'kind': 'sentence_order', 'tokens': tokens, 'accept': accept},
            'feedback_retry': retry, 'feedback_correct': 'Correct!'})

def sort(title, groups, items, retry, instruction='Put each item in the correct group.'):
    return ('sort_groups', title, {'instruction': instruction, 'question': title,
            'answer_data': {'kind': 'sort_groups', 'groups': groups, 'items': [{'word': w, 'group': g} for w, g in items]},
            'feedback_retry': retry, 'feedback_correct': 'Correct!'})

def seq(title, lines, retry, instruction='Put the lines in a natural order.'):
    items = [{'id': chr(65 + i), 'text': t} for i, t in enumerate(lines)]
    return ('sequence_order', title, {'instruction': instruction, 'question': title,
            'answer_data': {'kind': 'sequence_order', 'items': items, 'correctOrder': [i['id'] for i in items]},
            'feedback_retry': retry, 'feedback_correct': 'Correct!'})

def dialogue(title, lines, instruction='Listen and read the scene from the story.'):
    return ('model_dialogue', title, {'instruction': instruction, 'question': title, 'transcript': '\n'.join(lines),
            'answer_data': {'kind': 'model_dialogue'}}, True)

def writing(task, variations, required, target, min_words, model):
    return ('writing_task', 'Writing: ' + task[:60], {'instruction': 'Write in English. The AI tutor checks your writing.',
            'task': task, 'variations': variations, 'required': required, 'target': target, 'min_words': min_words,
            'answer_data': {'kind': 'writing_task', 'model': model}})

def roleplay(persona, lines, instruction):
    script = []
    for kind, text_or_accept in lines:
        if kind == 'tutor':
            script.append({'role': 'tutor', 'text': text_or_accept})
        else:
            script.append({'role': 'expect', 'kind': kind, 'accept': text_or_accept})
    return ('ai_roleplay', f'Talk with {persona}', {'instruction': instruction, 'question': f'Conversation with {persona}',
            'answer_data': {'kind': 'ai_roleplay', 'persona': persona, 'script': script}})

PACK = {
 # ---------------- Module 2 ----------------
 (2, 1): [
  dialogue('Scene — Maya’s family photos', ['Maya: Look, my photos. This is my family.', 'Maya: This is my mother, and this is my father. My parents.',
      'Sofía: Parents… like “parientes”?', 'Maya: No. Parents: mother and father.', 'Luis: My sister? Her name is Ana. My parents? Their names are Rosa and Jorge.']),
  mc('Luis has a sister. ___ name is Ana.', ['His', 'Her', 'Their', 'Your'], 'Her',
     'Ana is a woman, so we say “her name”.', 'Ana es mujer, por eso decimos “her name”.', 'Is Ana a man or a woman?'),
  mc('Luis’s mother and father are his ___.', ['parents', 'relatives', 'cousins'], 'parents',
     '“Parents” = mother and father. It is not “parientes” (relatives).', '“Parents” = madre y padre. No es “parientes”.', '“Parents” is a false friend.'),
  fill('This is Maya. ______ brother is Dean.\nLuis and Ana are from Colombia. ______ parents are Rosa and Jorge.', ['Her', 'Their'], ['His', 'Her', 'Their'],
     'Maya is a woman → her. Luis and Ana are two people → their.', 'Maya es mujer → her. Luis y Ana son dos personas → their.', 'One woman → her. Two people → their.'),
  order(['His', 'name', 'is', 'Pablo'], ['His name is Pablo'], 'Start with “His”.'),
  writing('Write 3–4 sentences about a family. Use my, his, her or their.',
     ['Write about your own family: three people.', 'Write about a friend’s family: his or her mother, father and one brother or sister.', 'Write about Maya’s family: her mother, her father, her sister Kim and her brother Dean.'],
     ['family words (mother, father, sister, brother, parents)', 'at least two of: my, his, her, their'], 'possessive adjectives my / his / her / their and family words', 15,
     'This is my family. My mother is Rosa. Her sister is Carmen. My brother is Pablo. His wife is Lucy.'),
  roleplay('Maya', [('tutor', 'Hi {preferred_name}! Look, this is my family. Who is in your family?'), ('family_members', ['my mother', 'my father', 'my sister', 'my brother']),
      ('tutor', 'Nice! What is your mother’s name?'), ('possessive', ['her name is', 'my mother’s name is'])],
     'Talk with Maya about your family.'),
 ],
 (2, 2): [
  dialogue('Scene — The lost-and-found box', ['Mr. Jan: Your bag? What colour is it?', 'Luis: It’s blue.', 'Mr. Jan: These bags are blue.',
      'Luis: Blues bags…', 'Sofía: “Blue bags.” Blue — no S.', 'Luis: This is a pen. These are pens. This is a box. These are boxes.']),
  mc('Choose the correct phrase.', ['two blues bags', 'two blue bags', 'two blue bag'], 'two blue bags',
     'Adjectives never take -s in English: “blue bags”. Only the noun is plural.', 'Los adjetivos nunca llevan -s: “blue bags”. Solo el sustantivo es plural.', 'Which word gets the -s: the colour or the thing?'),
  mc('The keys are far from you. ___ are my keys.', ['This', 'These', 'Those', 'That'], 'Those',
     'Plural and far → those. Plural and near → these.', 'Plural y lejos → those. Plural y cerca → these.', 'Keys = plural. Far = that / those.'),
  fill('one box → two ______\none watch → two ______\none pen → two ______', ['boxes', 'watches', 'pens'], [],
     'Words ending in -x, -ch, -sh, -s add -es: boxes, watches. Most words add -s: pens.', 'Palabras que terminan en -x, -ch, -sh, -s añaden -es. La mayoría añade -s.', 'Box and watch add -es.'),
  sort('Singular or plural?', ['Singular', 'Plural'], [('box', 'Singular'), ('pens', 'Plural'), ('watches', 'Plural'), ('key', 'Singular'), ('glasses', 'Plural'), ('phone', 'Singular')],
     'Plural words usually end in -s or -es.'),
  writing('You lost your bag. Write a short lost-and-found notice (3–4 sentences).',
     ['You lost a blue bag. Inside: two pens, a phone and your keys.', 'You lost a red backpack. Inside: three books and a black watch.', 'You lost a green box. Inside: glasses and two notebooks.'],
     ['the colour of the bag or box', 'what is inside (plural words)'], 'plurals with -s / -es and colours before nouns (no -s on colours)', 15,
     'I lost my blue bag. It has two pens, a phone and my keys. Please call Nassau Academy.'),
  roleplay('Mr. Jan', [('tutor', 'Hello! Is this your bag? What colour is your bag?'), ('colour', ['it’s blue', 'it is red', 'my bag is black']),
      ('tutor', 'OK. And what is in your bag?'), ('plural_items', ['two pens', 'my keys', 'three books'])],
     'Find your lost bag at Mr. Jan’s shop.'),
 ],
 (2, 3): [
  dialogue('Scene — The café', ['Luis: A woman has my bag. A blue bag.', 'Waiter: She is young. She is short. She is long black hair.',
      'Sofía: “She HAS long black hair.”', 'Waiter: Yes! She has long black hair.', 'Maya: That man is old. He has glasses. Not him.']),
  mc('Choose the correct sentence.', ['She is long hair.', 'She has long hair.', 'She have long hair.'], 'She has long hair.',
     'Hair, eyes and glasses use “have / has”: She has long hair.', 'Pelo, ojos y lentes usan “have / has”: She has long hair.', 'Hair → has.'),
  mc('He ___ tall and young.', ['is', 'has', 'are'], 'is',
     'Tall, short, young and old use “to be”: He is tall.', 'Tall, short, young y old usan “to be”: He is tall.', 'Tall and young → is.'),
  fill('Emma ______ short. She ______ long black hair.\nNate ______ tall. He ______ short brown hair.', ['is', 'has', 'is', 'has'], ['is', 'has'],
     'Traits (tall, short) → is. Hair → has.', 'Rasgos (tall, short) → is. Pelo → has.', 'Height → is. Hair → has.'),
  order(['She', 'has', 'long', 'black', 'hair'], ['She has long black hair'], 'Size (long) comes before colour (black).'),
  writing('Describe a person so a friend can find them (3–4 sentences).',
     ['Describe a tall, old man with glasses.', 'Describe a young woman with short red hair.', 'Describe a person in your family.'],
     ['is + tall / short / young / old', 'has + hair (and its colour)'], '“is” for traits and “has” for hair, eyes and glasses; adjectives before the noun', 15,
     'My sister is young and short. She has long brown hair and brown eyes.'),
  roleplay('Nate', [('tutor', 'I’m at the café. I’m looking for your friend. Is your friend tall or short?'), ('trait', ['he is tall', 'she is short']),
      ('tutor', 'And the hair? What colour is it?'), ('feature', ['she has black hair', 'he has short brown hair'])],
     'Help Nate find your friend at the café.'),
 ],
 (2, 4): [
  dialogue('Scene — Whose bag is it?', ['Emma: Is this bag yours?', 'Luis: Yes! It’s mine! Thank you!', 'Sofía: Is this phone yours, Luis?',
      'Luis: No, that phone is Maya’s. It’s hers.', 'Luis: This is the mother of Luis…', 'Sofía: “Luis’s mother.”']),
  mc('Choose the correct sentence.', ['This is the car of Maria.', 'This is Maria’s car.', 'This is Maria car.'], 'This is Maria’s car.',
     'English uses ’s for people: Maria’s car.', 'El inglés usa ’s con personas: Maria’s car (no “the car of Maria”).', 'Use ’s after the name.'),
  mc('“Is this phone yours?” — “No, it’s ___. It’s Maya’s phone.”', ['hers', 'his', 'mine', 'her'], 'hers',
     'Maya’s phone = her phone = hers.', 'El teléfono de Maya = hers.', 'Maya is a woman: her → hers.'),
  fill('Rosa is ______ mother. (Luis)\nThis is ______ bag. (Emma)', ['Luis’s', 'Emma’s'], [],
     'Name + ’s: Luis’s mother, Emma’s bag.', 'Nombre + ’s: Luis’s mother, Emma’s bag.', 'Add ’s to the name.'),
  seq('Order the conversation.', ['Is this bag yours?', 'Yes, it’s mine! Thank you!', 'You’re welcome. Your badge says “LUES”!'], 'Start with the question.'),
  writing('Write 4 sentences about a family tree. Use ’s (e.g. “Rosa is Luis’s mother”).',
     ['Luis’s family: Rosa (mother), Jorge (father), Ana and Pablo (sister and brother).', 'Your own family.', 'Maya’s family: Kim (sister) and Dean (brother).'],
     ['possessive ’s (e.g. Luis’s mother)', 'at least four family members'], 'possessive ’s with names', 20,
     'Rosa is Luis’s mother. Jorge is Luis’s father. Ana is Luis’s sister. Pablo is Ana’s brother.'),
  roleplay('Emma', [('tutor', 'Hi {preferred_name}! I have some things here. Is this phone yours?'), ('possession', ['yes it’s mine', 'no it’s not mine', 'it’s hers']),
      ('tutor', 'And these keys? Are they Luis’s keys?'), ('possessive_s', ['they are luis’s', 'yes they are his'])],
     'Help Emma give the things back to the right people.'),
 ],
 # ---------------- Module 3 ----------------
 (3, 1): [
  dialogue('Scene — Planning Ana’s visit', ['Sofía: Ana is in Curaçao on Friday. What time?', 'Luis: At five… in the afternoon.',
      'Luis: What time is it now?', 'Sofía: Is ten o’clock.', 'Maya: “IT is ten o’clock.” It’s ten o’clock.']),
  mc('What time is it? (10:00)', ['Is ten o’clock.', 'It is ten o’clock.', 'Ten o’clock is.'], 'It is ten o’clock.',
     'Always use “It is” for the time.', 'Usa siempre “It is” para la hora (no “Is ten”).', 'Don’t forget “It”.'),
  mc('I have class ___ Monday.', ['at', 'on', 'in'], 'on',
     'Days use “on”: on Monday.', 'Los días usan “on”: on Monday.', 'Days of the week → on.'),
  fill('Ana arrives ______ Friday ______ five o’clock ______ the afternoon.', ['on', 'at', 'in'], ['at', 'on', 'in'],
     'on + day, at + time, in + part of the day.', 'on + día, at + hora, in + parte del día.', 'Day → on. Clock time → at. Morning/afternoon → in.'),
  sort('at, on or in?', ['at', 'on', 'in'], [('five o’clock', 'at'), ('Monday', 'on'), ('the morning', 'in'), ('Friday', 'on'), ('9:30', 'at'), ('the evening', 'in')],
     'Clock times → at. Days → on. Parts of the day → in.'),
  writing('Write your plan for the week (3–4 sentences) with days and times.',
     ['Tell Sofía your plan for Monday, Wednesday and Saturday.', 'Invite a friend: the day, the time and the place.', 'Write your class times for this week.'],
     ['days of the week', 'at + time', 'on + day'], 'on + day, at + time, in + part of the day; “It is” for the time', 15,
     'On Monday I have class at nine o’clock. On Saturday, in the morning, I go to the beach.'),
  roleplay('Sofía', [('tutor', 'Hi {preferred_name}! What time is it now?'), ('time', ['it is', 'it’s']),
      ('tutor', 'Great. When is your English class?'), ('day_time', ['on monday', 'at nine', 'in the morning'])],
     'Plan the week with Sofía.'),
 ],
 (3, 2): [
  dialogue('Scene — Two mornings', ['Sofía: Every day, I wake up at six o’clock.', 'Sofía: I take a shower. I get dressed. I eat breakfast at six thirty.',
      'Luis: Every day, I am waking up at eight fifty!', 'Maya: “I wake up.” Every day, I wake up.']),
  mc('Every day, I ___ at 6:30.', ['wake up', 'am waking up', 'wakes up'], 'wake up',
     'Habits use the present simple: I wake up.', 'Los hábitos usan presente simple: I wake up (no “I am waking up”).', 'Every day → present simple.'),
  fill('I ______ up at seven. I ______ a shower.\nI ______ breakfast. I ______ coffee.', ['wake', 'take', 'eat', 'drink'], ['wake', 'take', 'eat', 'drink'],
     'wake up, take a shower, eat breakfast, drink coffee.', 'wake up, take a shower, eat breakfast, drink coffee.', 'Which verb goes with “a shower”?'),
  seq('Put the morning in order.', ['I wake up.', 'I take a shower.', 'I get dressed.', 'I eat breakfast.', 'I go to class.'], 'What do you do first?'),
  order(['I', 'go', 'to', 'class', 'at', 'nine'], ['I go to class at nine'], 'Start with “I go”.'),
  writing('Describe your morning routine (4–5 sentences).',
     ['Your normal weekday morning.', 'Your Saturday morning.', 'Write as Sofía: wake up 6:00, shower, breakfast 6:30, class 8:30 (use “I”).'],
     ['at least four daily verbs', 'times with “at”'], 'present simple with “I” for habits (not “I am …ing”)', 20,
     'I wake up at six thirty. I take a shower and I get dressed. I eat breakfast at seven. I go to work at eight.'),
  roleplay('Luis', [('tutor', 'I’m always late! What time do you wake up, {preferred_name}?'), ('routine_time', ['i wake up at']),
      ('tutor', 'Wow. And then? What do you do in the morning?'), ('routine', ['i take a shower', 'i eat breakfast', 'i drink coffee'])],
     'Compare mornings with Luis.'),
 ],
 (3, 3): [
  dialogue('Scene — Ana’s routine', ['Luis: Ana is a nurse. She work in a hospital.', 'Sofía: “She works.” Works.',
      'Luis: She works in a hospital. She wakes up at five o’clock. She plays volleyball. She watches TV every night.']),
  mc('She ___ in a hospital.', ['work', 'works', 'working'], 'works',
     'He / she / it + verb + s: she works.', 'He / she / it + verbo + s: she works.', 'She → add -s.'),
  mc('Which sentence is correct?', ['They works in Colombia.', 'They work in Colombia.'], 'They work in Colombia.',
     'Only he / she / it add -s. They work.', 'Solo he / she / it añaden -s. They work.', '“They” is not he, she or it.'),
  fill('Ana ______ (wake) up at five. She ______ (watch) TV.\nNate ______ (play) the guitar.', ['wakes', 'watches', 'plays'], [],
     'wakes, watches (-es after -ch), plays.', 'wakes, watches (-es después de -ch), plays.', 'Watch ends in -ch → -es.'),
  sort('How do you say the -s?', ['/s/', '/z/', '/ɪz/'], [('works', '/s/'), ('plays', '/z/'), ('watches', '/ɪz/'), ('drinks', '/s/'), ('goes', '/z/'), ('washes', '/ɪz/')],
     'After -ch and -sh you hear an extra syllable: /ɪz/.'),
  writing('Describe another person’s day (4–5 sentences). Use he or she.',
     ['Ana: a nurse, wakes up at 5, works in a hospital, plays volleyball.', 'A person in your family.', 'Nate: works at reception, plays the guitar, watches football.'],
     ['he or she + verb with -s', 'at least four verbs'], 'third person singular -s (works, plays, watches)', 20,
     'My father is a teacher. He wakes up at six. He drinks coffee and he goes to school at seven.'),
  roleplay('Maya', [('tutor', 'Tell me about a person in your family. What is his or her job?'), ('third_person', ['she works', 'he works', 'she is a']),
      ('tutor', 'Nice! And what does he or she do in the evening?'), ('third_person_s', ['he watches', 'she plays', 'she reads'])],
     'Tell Maya about someone in your family.'),
 ],
 (3, 4): [
  dialogue('Scene — Ana’s week', ['Luis: I always am late.', 'Sofía: “I am always late.” After “am”.', 'Luis: I am always late. But Ana is never late.',
      'Nate: We usually eat at the snack truck on Saturday.', 'Maya: I always take photos!']),
  mc('Choose the correct sentence.', ['I always am late.', 'I am always late.', 'Always I am late.'], 'I am always late.',
     'With “be”, the frequency word goes after: I am always late.', 'Con “be”, el adverbio va después: I am always late.', 'Look at the verb “am”.'),
  mc('Maya ___ takes photos. (100%)', ['always', 'never', 'sometimes'], 'always',
     '100% = always, 0% = never.', '100% = always, 0% = never.', '100% of the time.'),
  fill('Maya ______ takes photos. (100%)\nLuis is ______ late. (100%) Ana is ______ late. (0%)', ['always', 'always', 'never'], ['always', 'usually', 'sometimes', 'never'],
     'always = 100%, never = 0%.', 'always = 100%, never = 0%.', '0% = never.'),
  order(['We', 'usually', 'eat', 'at', 'the', 'snack', 'truck'], ['We usually eat at the snack truck'], 'The frequency word goes before the main verb.'),
  writing('Write about your week (4 sentences). Use always, usually, sometimes and never.',
     ['Your weekday habits.', 'Your weekend habits.', 'The habits of a friend (use he or she).'],
     ['at least three of: always, usually, sometimes, never'], 'frequency adverbs before the main verb and after “be”', 20,
     'I always drink coffee in the morning. I usually go to class at nine. I sometimes eat at the snack truck. I am never late.'),
  roleplay('Nate', [('tutor', 'Hi {preferred_name}! Are you usually early or late?'), ('frequency_be', ['i am usually', 'i am always', 'i am never']),
      ('tutor', 'And on Saturday? What do you usually do?'), ('frequency_verb', ['i usually', 'i always', 'i sometimes'])],
     'Talk with Nate about your weekly habits.'),
 ],
 # ---------------- Module 4 ----------------
 (4, 1): [
  dialogue('Scene — Finding the hotel', ['Ana: The hotel is here?', 'Nate: “IS the hotel here?” No. Go straight. Then turn left.',
      'Ana: Is there a library? I want a book.', 'Sofía: A library is not a “librería”. A bookshop sells books.']),
  mc('Choose the correct question.', ['The bank is near here?', 'Is the bank near here?', 'Bank near here?'], 'Is the bank near here?',
     'English questions start with the verb: Is the bank…?', 'Las preguntas en inglés empiezan con el verbo: Is the bank…?', 'Start with “Is”.'),
  mc('Where do you buy books?', ['at a library', 'at a bookshop'], 'at a bookshop',
     'You buy books at a bookshop. At a library you read or borrow books.', 'Compras libros en una “bookshop”. “Library” = biblioteca.', '“Library” is a false friend.'),
  fill('______ is the bank? — It’s on Main Street.\n______ there a hospital near here? — Yes, there is.', ['Where', 'Is'], ['Where', 'Is', 'What'],
     'Where = place. Is there…? = does it exist here?', 'Where = lugar. Is there…? = ¿hay…?', 'The answer is a place → Where.'),
  seq('Order the conversation.', ['Excuse me, where is the bank?', 'Go straight, then turn left.', 'Thank you!', 'You’re welcome.'], 'Start with the question.'),
  writing('Write directions (3–4 sentences) from Nassau Academy to a place.',
     ['To the bank: go straight, then turn left.', 'To the hotel: turn right, then go straight.', 'To the library: go straight, turn right, then turn left.'],
     ['turn left / turn right', 'go straight'], 'directions (go straight, turn left/right) and “Where is…?”', 12,
     'Go straight. Then turn left. The bank is on the right.'),
  roleplay('Ana', [('tutor', 'Excuse me! I’m new here. Where is the bank?'), ('directions', ['go straight', 'turn left', 'turn right']),
      ('tutor', 'Thank you! Is there a restaurant near here?'), ('there_is', ['yes there is', 'there is a restaurant'])],
     'Help Ana find places in town.'),
 ],
 (4, 2): [
  dialogue('Scene — Where are you?', ['Maya: I’m on Handelskade, next to the yellow building.', 'Sofía: I’m at the bus stop, between the bank and the library.',
      'Luis: I’m in the bridge!', 'Nate: In the bridge? In the water?', 'Sofía: “ON the bridge” — on top. Or “AT the bridge” — a point to meet.']),
  mc('I live ___ Willemstad.', ['in', 'on', 'at'], 'in', 'Cities and areas → in.', 'Ciudades y zonas → in.', 'A city → in.'),
  mc('Meet me ___ the bus stop.', ['in', 'on', 'at'], 'at', 'A meeting point → at.', 'Un punto de encuentro → at.', 'A specific point → at.'),
  fill('The café is ______ Handelskade (a street).\nLuis is ______ the bridge (a meeting point). Sofía lives ______ Otrobanda.', ['on', 'at', 'in'], ['in', 'on', 'at'],
     'Street → on. Meeting point → at. Area → in.', 'Calle → on. Punto de encuentro → at. Barrio → in.', 'Street → on.'),
  sort('in, on or at?', ['in', 'on', 'at'], [('Curaçao', 'in'), ('the kitchen', 'in'), ('Main Street', 'on'), ('the table', 'on'), ('the bus stop', 'at'), ('the door', 'at')],
     'Inside a space or city → in. Surface or street → on. A point → at.'),
  writing('Send a text message to a friend: where are you now? (2–3 sentences)',
     ['You are on Handelskade, next to a yellow building.', 'You are at the bus stop, between the bank and the library.', 'You are in a café in Punda.'],
     ['in, on or at', 'next to or between'], 'in / on / at, next to, between', 12,
     'Hi! I’m at the bus stop, next to the bank. Where are you?'),
  roleplay('Maya', [('tutor', 'Hi {preferred_name}! Where are you now? I can’t see you!'), ('location', ['i am at', 'i’m on', 'i am in']),
      ('tutor', 'OK! And where do you live?'), ('live_in', ['i live in'])],
     'Find Maya in town by phone.'),
 ],
 (4, 3): [
  dialogue('Scene — The floating market', ['Ana: Look! There is bananas!', 'Maya: “There ARE bananas.” Two, three, many: there are.',
      'Sofía: Are there any mangoes?', 'Seller: Yes, there are some mangoes.', 'Luis: Is there any water?', 'Seller: Sorry, there isn’t any water.']),
  mc('There ___ two banks on this street.', ['is', 'are'], 'are', 'Plural → there are.', 'Plural → there are (el “hay” del español no cambia).', 'Two banks = plural.'),
  mc('Is there ___ water?', ['a', 'any', 'some'], 'any', 'Questions with water (no plural) use “any”.', 'En preguntas usamos “any”: Is there any water?', 'Question → any.'),
  fill('There ______ a market. There ______ some boats.\nThere ______ an egg sandwich.', ['is', 'are', 'is'], ['is', 'are'],
     'One thing → there is. Many → there are.', 'Una cosa → there is. Varias → there are.', 'Boats = plural.'),
  order(['There', 'are', 'some', 'mangoes', 'on', 'the', 'boat'], ['There are some mangoes on the boat'], 'Start with “There are”.'),
  writing('Describe your street or neighbourhood (4 sentences). Use there is and there are.',
     ['Your street.', 'The floating market in Willemstad: fruit, boats and people.', 'Your school or workplace.'],
     ['there is', 'there are', 'some or any'], 'there is + singular, there are + plural, some / any', 20,
     'There is a small supermarket on my street. There are two restaurants. There are some trees. There isn’t a bank.'),
  roleplay('the fruit seller', [('tutor', 'Good morning! Welcome to the market. Look, there are mangoes and bananas today!'), ('there_are', ['are there any', 'is there any', 'there are']),
      ('tutor', 'And in your town, is there a market?'), ('there_is', ['yes there is', 'no there isn’t', 'there is'])],
     'Buy fruit at the floating market.'),
 ],
 (4, 4): [
  dialogue('Scene — The beach party', ['Emma: Hi! I’m Emma. What’s your name?', 'Ana: Hello! My name is Ana. I’m from Colombia. I’m twenty-six.',
      'Luis: Ana is my sister. She is tall. She has short brown hair.', 'Sofía: She works in a hospital. She always wakes up at five o’clock!', 'Nate: Is there an English class for you? Yes! On Monday, at nine o’clock.']),
  mc('I ___ twenty-six years old.', ['have', 'am', 'has'], 'am', 'Age uses “to be”: I am 26.', 'La edad usa “to be”: I am 26 (no “I have 26 years”).', 'Age → am.'),
  mc('Ana ___ in a hospital.', ['work', 'works', 'is work'], 'works', 'She + verb + s.', 'She + verbo + s.', 'She → -s.'),
  fill('My name ______ Ana. I’m ______ Colombia.\n______ brother is Luis.', ['is', 'from', 'My'], ['is', 'from', 'My', 'Her'],
     'My name is…, I’m from + country, my brother.', 'My name is…, I’m from + país, my brother.', 'Country → from.'),
  writing('Introduce yourself (6–8 sentences): name, country, family, routine and your town.',
     ['Write it for a new classmate.', 'Write it for a pen-friend in Aruba.', 'Write it for the Nassau Academy welcome page.'],
     ['name and country', 'one family member (with his or her)', 'your daily routine with times', 'one sentence with there is / there are'], 'all of A1.1', 40,
     'Hello! My name is Ana. I’m from Colombia. I’m 26. My brother is Luis. His friends are nice. I wake up at five and I work in a hospital. There is a beautiful beach near my house.'),
  roleplay('Emma', [('tutor', 'Hi! Welcome to the party! I’m Emma. What’s your name and where are you from?'), ('introduce', ['my name is', 'i’m from']),
      ('tutor', 'Nice! Tell me about your family.'), ('family', ['my mother', 'my brother', 'my sister']),
      ('tutor', 'And what do you usually do on the weekend?'), ('routine', ['i usually', 'i always', 'i sometimes'])],
     'Meet Emma at the beach party and talk about yourself.'),
 ],
}

def sql_str(s):
    return "'" + s.replace("'", "''") + "'"

out = ["-- A1.1 content pack for Modules 2–4 (drafts). Safe to run twice: existing items are skipped.\n"]
for (m, l), items in PACK.items():
    rows = []
    for n, item in enumerate(items, start=1):
        typ, title, content = item[0], item[1], item[2]
        needs_audio = len(item) > 3 and item[3]
        content = dict(content)
        content['pack_id'] = f'r4-m{m}l{l}-{n}'
        rows.append((n, typ, title, content, needs_audio))
    for n, typ, title, content, needs_audio in rows:
        out.append(f"""insert into public.steps (lesson_id, position, type, title, content, needs_audio, status)
select l.id, (select coalesce(max(position), 0) from public.steps where lesson_id = l.id) + 1, {sql_str(typ)}, {sql_str(title)}, {sql_str(json.dumps(content, ensure_ascii=False))}::jsonb, {str(needs_audio).lower()}, 'draft'
from public.lessons l join public.modules mo on mo.id = l.module_id join public.courses c on c.id = mo.course_id
where c.code = 'en-a1-1' and mo.position = {m} and l.position = {l}
  and not exists (select 1 from public.steps s where s.content->>'pack_id' = {sql_str(content['pack_id'])});
""")
open('/home/claude/r1/supabase/content/pack_m2_m4.sql', 'w').write('\n'.join(out))
print(sum(len(v) for v in PACK.values()), 'exercises')
