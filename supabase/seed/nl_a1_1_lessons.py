# Builds Dutch A1.1 lesson content (lessons + steps) as SQL for Supabase.
import json

def opts(*o): return [f"{'ABCD'[i]}. {t}" for i, t in enumerate(o)]
def bi(es, en): return f"{es} · {en}"

def MD(title, transcript, speakers):
    return dict(type='model_dialogue', title=title, needs_audio=True, content=dict(
        question=title, instruction=bi('Escucha y lee el diálogo.', 'Listen and read the dialogue.'),
        transcript=transcript, answer_data=dict(kind='model_dialogue', slow=True, speakers=speakers),
        audio_needed=True, retry_allowed=True, accessibility_alt='Read the transcript if audio is not available.'))

def LC(transcript, q_es, q_en, options, correct, ok, no, es=None):
    o = opts(*options)
    return dict(type='listening_choose', title='Audio: “' + transcript.split('\n')[0][:60] + '”', needs_audio=True, content=dict(
        question='Audio', instruction=bi(q_es, q_en), transcript=transcript, options=o, correct_answer=o[correct],
        feedback_correct=ok, feedback_retry=no, feedback_incorrect=no, explanation_es=es, audio_needed=True, retry_allowed=True))

def MC(typ, q_es, q_en, options, correct, ok, no, expl=None, es=None, question=None):
    o = opts(*options)
    c = dict(instruction=bi(q_es, q_en), options=o, correct_answer=o[correct], feedback_correct=ok,
             feedback_retry=no, feedback_incorrect=no, retry_allowed=True)
    if question: c['question'] = question
    if expl: c['explanation'] = expl
    if es: c['explanation_es'] = es
    return dict(type=typ, title=question or q_en, needs_audio=False, content=c)

def ORD(q_es, q_en, tokens, accept, hint, es=None):
    c = dict(question=q_en, instruction=bi(q_es, q_en) + ' — ' + bi('Toca las palabras en orden.', 'Tap the words in order.'),
             answer_data=dict(kind='sentence_order', tokens=tokens, accept=accept),
             feedback_correct='“' + accept[0] + '”', feedback_retry=hint, feedback_incorrect=hint, retry_allowed=True)
    if es: c['explanation_es'] = es
    return dict(type='sentence_order', title=q_en, needs_audio=False, content=c)

def FILL(q_es, q_en, question, answers, hint, es=None):
    c = dict(question=question, instruction=bi(q_es, q_en), answer_data=dict(kind='fill_in', blanks=len(answers), answers=answers),
             feedback_correct='Correct: ' + ', '.join(answers) + '.', feedback_retry=hint, feedback_incorrect='Answer: ' + ', '.join(answers) + '. ' + hint, retry_allowed=True)
    if es: c['explanation_es'] = es
    return dict(type='fill_in', title=question, needs_audio=False, content=c)

def RP(persona, i_es, i_en, script, fallback):
    return dict(type='ai_roleplay', title=f'Role-play with {persona}', needs_audio=False, content=dict(
        question=f'Role-play with {persona}', instruction=bi(i_es, i_en),
        answer_data=dict(kind='ai_roleplay', persona=persona, script=script, fallback=fallback, correctionRule='single_issue'),
        feedback_correct='Goed zo! Well done.', feedback_retry='Try a short answer in Dutch.', retry_allowed=True))

def T(text): return dict(role='tutor', text=text)
def X(kind, *accept): return dict(role='expect', kind=kind, accept=list(accept))

def EXIT(model, i_es, i_en, done):
    return dict(type='exit_ticket', title='Real-life win', needs_audio=False, content=dict(
        question='Real-life win', instruction=bi(i_es, i_en) + f' “{model}”',
        answer_data=dict(kind='exit_ticket', model=model, speakOrType=True),
        feedback_correct=done, feedback_retry='Replay the model, then try once more.', retry_allowed=True))

L = []  # (module, position, meta, steps)

# ---------------- Module 1 · Kennismaken ----------------
L.append((1, 1, dict(
  objective="After this lesson, you can greet someone in Dutch, say your name, and choose between jij and u.",
  summary="hallo, goedemorgen, ik ben…, ik heet…, hoe heet je? / hoe heet u?, dank je wel",
  content="At Nassau Academy, Megan meets Jan at reception, and meneer De Vries starts the first Dutch class. You learn to greet, say your name, and when to say jij or u.",
  content_es="En Nassau Academy, Megan conoce a Jan en la recepción y el profesor De Vries empieza la primera clase de neerlandés. Aprendes a saludar, decir tu nombre y cuándo usar jij o u.",
  tip="Always say “ik”: Dutch never drops the subject. “Ik ben Rafael”, not “Ben Rafael”. Use u for teachers, older people and strangers.",
  tip_es="Siempre di “ik” (yo): en neerlandés el sujeto nunca se omite. “Ik ben Rafael”, no “Ben Rafael”. Usa u (usted) con profesores, personas mayores y desconocidos.",
  vocab=[("hallo / hoi","hello / hi","hola"),("goedemorgen","good morning","buenos días"),("welkom","welcome","bienvenido/a"),("ik ben…","I am…","soy…"),("ik heet…","my name is…","me llamo…"),("Hoe heet je?","What's your name? (informal)","¿Cómo te llamas?"),("Hoe heet u?","What's your name? (formal)","¿Cómo se llama usted?"),("meneer","sir / Mr.","señor"),("dank je wel","thank you","gracias"),("sorry","sorry","perdón"),("allemaal","everybody","todos")]),
 [MD('Model dialogue — Hallo, ik ben…', "Jan: Hoi! Welkom bij Nassau Academy. Ik ben Jan.\nMegan: Hoi Jan! Ik ben Megan.\nPeter de Vries: Goedemorgen allemaal! Ik ben meneer De Vries. Hoe heet u?\nValentina: Ik heet Valentina.", ["Jan","Megan","Peter de Vries","Valentina"]),
  LC("Goedemorgen allemaal! Ik ben meneer De Vries.", "Escucha. ¿Quién habla?", "Listen. Who is speaking?", ["A student","The teacher","Jan at reception"], 1, "Yes: meneer De Vries is the teacher.", "Listen for “meneer De Vries”."),
  MC('error_detect', "¿Qué frase es correcta?", "Which sentence is correct?", ["Ben Rafael.","Ik ben Rafael.","Rafael ben."], 1, "Right: Dutch always needs “ik”.", "In Dutch, the subject is never left out.", "Say “ik ben”, not only “ben”.", "En neerlandés no se omite el sujeto: “ik ben”, no solo “ben” (como en español “soy”)."),
  MC('scenario_choice', "Hablas con tu profesor. ¿Qué preguntas?", "You are talking to your teacher. What do you ask?", ["Hoe heet je?","Hoe heet u?","Wie ben jij?"], 1, "Yes: u for a teacher.", "For a teacher, older person or stranger, use u.", None, "Con un profesor, una persona mayor o un desconocido se usa u (usted)."),
  ORD("Forma la frase.", "Build the sentence.", ["Ik","heet","Sofía"], ["Ik heet Sofía"], "Start with “Ik”."),
  FILL("Completa con la palabra correcta.", "Complete with the right word.", "Hallo! ______ ben Megan.\nGoedemorgen, meneer De Vries. Hoe heet ______?", ["Ik","u"], "Ik = I; u = you (formal).", "Ik = yo; u = usted."),
  MC('dialogue_completion', "Jan dice: “Hoi! Ik ben Jan.” ¿Qué respondes?", "Jan says: “Hoi! Ik ben Jan.” What do you answer?", ["Hoi Jan! Ik ben Carla.","Goedemorgen, meneer.","Dank je wel."], 0, "Nice: you greet and say your name.", "Greet Jan and say your name."),
  RP("Jan", "Preséntate a Jan en la recepción.", "Introduce yourself to Jan at reception.", [T("Hoi! Welkom bij Nassau Academy. Ik ben Jan. Hoe heet jij?"), X("name", "Ik ben …", "Ik heet …"), T("Leuk, {preferred_name}! De Nederlandse les is daar."), X("polite_close", "Dank je wel!", "Dank je!")], "Say: “Ik ben …” Try once."),
  EXIT("Hallo! Ik ben {preferred_name}. Hoe heet u?", "Dilo en voz alta o escríbelo:", "Say it out loud or type it:", "You can greet and introduce yourself in Dutch. Lesson 2 is open!"),
 ]))

L.append((1, 2, dict(
  objective="After this lesson, you can say where you come from and which languages you speak, and ask the same.",
  summary="Waar kom je vandaan? Ik kom uit…, Ik spreek…, een beetje, Kom jij uit…?",
  content="During the break, the class talks about their countries and languages. Sofía shows Megan how a Dutch question starts with the verb.",
  content_es="En el descanso, la clase habla de sus países e idiomas. Sofía le muestra a Megan que una pregunta en neerlandés empieza con el verbo.",
  tip="A yes/no question starts with the verb: “Kom jij uit Chili?” Just raising your voice (“Jij komt uit Chili?”) is not enough in Dutch.",
  tip_es="Una pregunta de sí/no empieza con el verbo: “Kom jij uit Chili?” En neerlandés no basta con la entonación (“Jij komt uit Chili?”).",
  vocab=[("Waar kom je vandaan?","Where are you from?","¿De dónde eres?"),("Ik kom uit…","I'm from…","Soy de…"),("spreken","to speak","hablar"),("Ik spreek…","I speak…","Hablo…"),("een beetje","a little","un poco"),("ja / nee","yes / no","sí / no"),("goed zo!","well done!","¡muy bien!"),("Brazilië","Brazil","Brasil"),("Chili","Chile","Chile"),("de Verenigde Staten","the United States","Estados Unidos"),("Nederland","the Netherlands","Países Bajos"),("Spaans","Spanish","español"),("Portugees","Portuguese","portugués"),("Engels","English","inglés"),("Nederlands","Dutch","neerlandés"),("Papiaments","Papiamentu","papiamento")]),
 [MD('Model dialogue — Waar kom je vandaan?', "Sofía: Waar kom jij vandaan, Rafael?\nRafael: Ik kom uit Brazilië. En jij?\nSofía: Ik kom uit Venezuela.\nValentina: Ik kom uit Chili. Ik spreek Spaans. Spreek jij Spaans?\nMegan: Een beetje! Ik spreek Engels.", ["Sofía","Rafael","Valentina","Megan"]),
  LC("Ik kom uit Brazilië. Ik spreek Portugees.", "Escucha. ¿De dónde es Rafael?", "Listen. Where is Rafael from?", ["Chile","Brazil","Venezuela"], 1, "Yes: “Ik kom uit Brazilië.”", "Listen for “Brazilië”."),
  MC('error_detect', "¿Qué pregunta es correcta en neerlandés?", "Which question is correct Dutch?", ["Jij komt uit Chili?","Kom jij uit Chili?","Uit Chili jij komt?"], 1, "Right: the verb comes first in a question.", "A yes/no question starts with the verb.", "Question = verb + jij + the rest.", "Pregunta = verbo + jij + el resto: “Kom jij uit Chili?”"),
  MC('multiple_choice', "¿Cómo se dice “Hablo un poco de español”?", "How do you say “I speak a little Spanish”?", ["Ik spreek een beetje Spaans.","Ik kom uit Spaans.","Ik ben een beetje Spaans."], 0, "Yes: spreken = to speak.", "Use “spreken” for languages."),
  ORD("Forma la pregunta.", "Build the question.", ["Spreek","jij","Engels","?"], ["Spreek jij Engels?"], "Start with the verb: Spreek…", "Empieza con el verbo."),
  FILL("Completa.", "Complete the sentences.", "Ik ______ uit Venezuela.\nIk ______ Spaans en een beetje Nederlands.", ["kom","spreek"], "komen uit = to come from; spreken = to speak."),
  MC('dialogue_completion', "Valentina pregunta: “Waar kom jij vandaan?” ¿Qué respondes?", "Valentina asks: “Waar kom jij vandaan?” What do you answer?", ["Ik kom uit Colombia.","Ik spreek Colombia.","Kom ik uit Colombia?"], 0, "Perfect.", "Answer with “Ik kom uit…”."),
  RP("Sofía", "Habla con Sofía sobre tu país y tus idiomas.", "Talk with Sofía about your country and languages.", [T("Hoi {preferred_name}! Waar kom jij vandaan?"), X("country", "Ik kom uit …"), T("Leuk! Welke talen spreek jij?"), X("languages", "Ik spreek Spaans", "Ik spreek Spaans en een beetje Nederlands"), T("Goed zo! Spreek jij ook Engels?"), X("yes_no", "Ja, een beetje", "Nee")], "Say: “Ik kom uit …”"),
  EXIT("Ik kom uit {country}. Ik spreek Spaans en een beetje Nederlands.", "Dilo o escríbelo:", "Say or type:", "You can talk about where you come from. Lesson 3 is open!"),
 ]))

L.append((1, 3, dict(
  objective="After this lesson, you can spell your name with the Dutch alphabet and give your phone number.",
  summary="Hoe spel je dat? voornaam, achternaam, telefoonnummer, het alfabet, 0–20",
  content="Jan registers Valentina for the course. Spelling “Rojas” shows the big trap: the Dutch J sounds like the Spanish Y, and the Dutch G sounds like the Spanish J.",
  content_es="Jan inscribe a Valentina en el curso. Al deletrear “Rojas” aparece la gran trampa: la J neerlandesa suena como la Y española, y la G neerlandesa suena como la J española.",
  tip="J is “jee” (like the y in “yes”). G is “gee”, a sound from the throat, close to the Spanish j. IJ is one letter: “ij”.",
  tip_es="La J se dice “jee” (suena como la y). La G se dice “gee” y suena parecida a la jota española. IJ es una sola letra.",
  vocab=[("de voornaam","first name","el nombre"),("de achternaam","surname","el apellido"),("Hoe spel je dat?","How do you spell that?","¿Cómo se escribe?"),("het alfabet","the alphabet","el alfabeto"),("het telefoonnummer","phone number","el número de teléfono"),("Wat is…?","What is…?","¿Cuál es…?"),("mijn naam is…","my name is…","mi nombre es…"),("goedemiddag","good afternoon","buenas tardes"),("nul, één, twee, drie","0, 1, 2, 3","cero, uno, dos, tres"),("vier, vijf, zes, zeven","4, 5, 6, 7","cuatro, cinco, seis, siete"),("acht, negen, tien","8, 9, 10","ocho, nueve, diez"),("elf, twaalf… twintig","11, 12… 20","once, doce… veinte")]),
 [MD('Model dialogue — Hoe spel je dat?', "Jan: Goedemiddag! Wat is je voornaam?\nValentina: Valentina.\nJan: En je achternaam?\nValentina: Rojas.\nJan: Hoe spel je dat?\nValentina: R – O – J – A – S.\nJan: Dank je. En wat is je telefoonnummer?\nValentina: Negen – vijf – één – twee – drie – vier – zeven – acht.", ["Jan","Valentina"]),
  LC("Negen – vijf – één – twee – drie – vier – zeven – acht.", "Escucha. ¿Qué número es?", "Listen. Which number is it?", ["9512 3478","9512 4378","9152 3478"], 0, "Yes: 9512 3478.", "Listen again, number by number."),
  MC('multiple_choice', "¿Cómo se dice la letra J en neerlandés?", "How do you say the letter J in Dutch?", ["jota","jee","gee"], 1, "Yes: J = jee.", "J is “jee”; G is “gee”.", None, "J = “jee” (como la y). G = “gee” (como la jota española)."),
  MC('error_detect', "Valentina deletrea su apellido. ¿Qué es correcto?", "Valentina spells her surname. Which is correct?", ["R – O – jota – A – S","R – O – jee – A – S","R – O – gee – A – S"], 1, "Right: in Dutch the J is “jee”.", "Careful: “gee” is the letter G.", None, "Cuidado: “gee” es la G. La J es “jee”."),
  ORD("Forma la pregunta.", "Build the question.", ["Hoe","spel","je","dat","?"], ["Hoe spel je dat?"], "Start with “Hoe”."),
  FILL("Escribe el número en neerlandés.", "Write the number in Dutch.", "3 = ______\n8 = ______\n10 = ______", ["drie","acht","tien"], "drie, acht, tien."),
  MC('dialogue_completion', "Jan pregunta: “Wat is je achternaam?” ¿Qué dices?", "Jan asks: “Wat is je achternaam?” What do you say?", ["Mijn achternaam is García.","Ik heet 12.","Goedemiddag!"], 0, "Yes: achternaam = surname.", "Achternaam means surname."),
  dict(type='spelling_guided', title='Spell your first name', needs_audio=False, content=dict(question='Spell your first name', instruction=bi('Deletrea tu nombre, letra por letra.', 'Spell your first name, letter by letter.'), answer_data=dict(kind='spelling_guided', store='name_spelling'), feedback_correct='Goed zo! {badge_name}', feedback_retry='Use letters with a dash: A-N-A.', feedback_incorrect='Use letters with a dash: A-N-A.', retry_allowed=True)),
  RP("Jan", "Jan te inscribe en el curso. Responde sus preguntas.", "Jan registers you for the course. Answer his questions.", [T("Goedemiddag! Wat is je voornaam?"), X("name", "{preferred_name}", "Mijn voornaam is …"), T("Hoe spel je dat?"), X("spelling", "letters with dashes"), T("Dank je. En wat is je telefoonnummer?"), X("number", "negen, vijf, …")], "Spell with letters: A – N – A."),
  EXIT("Mijn naam is {preferred_name}: {name_spelling}.", "Dilo o escríbelo:", "Say or type:", "You can spell your name in Dutch. Lesson 4 is open!"),
 ]))

L.append((1, 4, dict(
  objective="After this lesson, you can introduce someone else and talk about ages.",
  summary="Wie is dat? Dat is…, hij/zij, Hoe oud ben je? Ik ben … jaar, Hoe oud bent u?",
  content="In class, the students introduce each other. Rafael says “Ik heb 27 jaar”, and meneer De Vries shows how Dutch says age. Checkpoint for Module 1.",
  content_es="En clase, los estudiantes se presentan unos a otros. Rafael dice “Ik heb 27 jaar” y el profesor muestra cómo se dice la edad en neerlandés. Evaluación del Módulo 1.",
  tip="Age uses “zijn” (to be), not “hebben”: “Ik ben 27 jaar.” In Spanish you say “tengo 27 años”, in Dutch “I am 27 years”.",
  tip_es="La edad va con “zijn” (ser), no con “hebben” (tener): “Ik ben 27 jaar”, no “Ik heb 27 jaar”.",
  vocab=[("Wie is dat?","Who is that?","¿Quién es?"),("Dat is…","That is…","Ese/esa es…"),("hij","he","él"),("zij / ze","she","ella"),("Hoe oud ben je?","How old are you?","¿Cuántos años tienes?"),("Hoe oud bent u?","How old are you? (formal)","¿Cuántos años tiene usted?"),("Ik ben … jaar.","I am … years old.","Tengo … años."),("het jaar","year","el año"),("geheim","secret","secreto"),("twintig, dertig, veertig","20, 30, 40","veinte, treinta, cuarenta"),("vijftig, zestig, zeventig","50, 60, 70","cincuenta, sesenta, setenta"),("tachtig, negentig, honderd","80, 90, 100","ochenta, noventa, cien"),("zevenentwintig","27 (seven-and-twenty)","veintisiete")]),
 [MD('Model dialogue — Wie is dat?', "Peter de Vries: Sofía, wie is dat?\nSofía: Dat is Rafael. Hij komt uit Brazilië.\nPeter de Vries: En hoe oud is hij?\nRafael: Ik ben zevenentwintig jaar.\nMegan: Dat is Valentina. Zij komt uit Chili.\nMegan: En hoe oud bent u, meneer De Vries?\nPeter de Vries: Dat is geheim!", ["Peter de Vries","Sofía","Rafael","Megan"]),
  LC("Dat is Valentina. Zij komt uit Chili. Zij is tweeëndertig.", "Escucha. ¿Cuántos años tiene Valentina?", "Listen. How old is Valentina?", ["23","32","30"], 1, "Yes: tweeëndertig = 32 (two-and-thirty).", "Dutch says the ones first: twee-en-dertig = 32."),
  MC('error_detect', "¿Qué frase es correcta?", "Which sentence is correct?", ["Ik heb 27 jaar.","Ik ben 27 jaar.","Ik 27 jaar."], 1, "Right: age uses “zijn”.", "In Dutch you ARE an age.", None, "En neerlandés la edad va con “zijn”: Ik ben 27 jaar."),
  MC('multiple_choice', "¿Cómo preguntas la edad a tu profesor?", "How do you ask your teacher's age?", ["Hoe oud ben jij?","Hoe oud bent u?","Hoe oud is jij?"], 1, "Yes: u + bent.", "With u, the verb is “bent”: Hoe oud bent u?"),
  ORD("Presenta a Rafael.", "Introduce Rafael.", ["Dat","is","Rafael",".","Hij","komt","uit","Brazilië","."], ["Dat is Rafael. Hij komt uit Brazilië."], "Dat is… Hij komt uit…"),
  FILL("Completa con hij o zij.", "Complete with hij (he) or zij (she).", "Dat is Megan. ______ komt uit de Verenigde Staten.\nDat is Rafael. ______ is zevenentwintig.", ["zij","hij"], "zij = she, hij = he."),
  MC('multiple_choice', "¿Qué número es “vierenveertig”?", "What number is “vierenveertig”?", ["14","44","40"], 1, "Yes: vier-en-veertig = 44.", "Ones first, then tens: vier-en-veertig."),
  MC('multiple_choice', "Repaso: ¿Qué pregunta es correcta?", "Review: which question is correct?", ["Waar jij komt vandaan?","Waar kom jij vandaan?","Jij komt waar vandaan?"], 1, "Right: question word + verb + jij.", "After “waar”, the verb comes next."),
  RP("Peter de Vries", "El profesor De Vries te pregunta por un compañero. Presenta a Sofía (Venezuela, 25 años).", "Meneer De Vries asks about a classmate. Introduce Sofía (Venezuela, 25).", [T("Goedemorgen, {preferred_name}. Wie is dat?"), X("introduce", "Dat is Sofía."), T("Waar komt zij vandaan?"), X("country", "Zij komt uit Venezuela."), T("En hoe oud is zij?"), X("age", "Zij is vijfentwintig jaar.")], "Say: “Dat is Sofía. Zij komt uit Venezuela.”"),
  EXIT("Ik ben {preferred_name}. Ik kom uit {country}. Ik ben … jaar.", "Preséntate completo:", "Introduce yourself completely:", "Module 1 done! You can introduce yourself and others in Dutch."),
 ]))

# ---------------- Module 2 · Familie en spullen ----------------
L.append((2, 1, dict(
  objective="After this lesson, you can talk about your family.",
  summary="mijn moeder, mijn vader, mijn broer, mijn zus, ik heb, jij hebt, hij/zij heeft",
  content="Sofía shows photos of her family, who are coming to Curaçao. Rafael says “zij heb een baby”, and learns the forms of hebben.",
  content_es="Sofía muestra fotos de su familia, que viene a Curaçao. Rafael dice “zij heb een baby” y aprende las formas de hebben.",
  tip="hebben: ik heb, jij hebt, hij/zij heeft, wij/jullie/zij hebben. “Hij heeft” — never “hij heb”.",
  tip_es="hebben (tener): ik heb, jij hebt, hij/zij heeft. Se dice “hij heeft”, nunca “hij heb”.",
  vocab=[("de familie","family","la familia"),("de moeder","mother","la madre"),("de vader","father","el padre"),("de ouders","parents","los padres"),("de broer","brother","el hermano"),("de zus","sister","la hermana"),("het kind (de kinderen)","child (children)","el niño / hijo (los niños)"),("de baby","baby","el bebé"),("de oom","uncle","el tío"),("de tante","aunt","la tía"),("de vriend / de vriendin","friend / girlfriend","el amigo / la amiga, novia"),("kijk!","look!","¡mira!"),("leuk","nice, fun","bonito, divertido"),("volgende week","next week","la próxima semana"),("Gefeliciteerd!","Congratulations!","¡Felicidades!")]),
 [MD('Model dialogue — Mijn familie', "Sofía: Kijk! Dat is mijn moeder, en dat is mijn vader.\nValentina: Leuk! Heb jij ook een zus?\nSofía: Nee. Ik heb een broer, Diego.\nRafael: Ik heb twee zussen. En mijn zus heeft een baby!\nValentina: Gefeliciteerd, oom Rafael!", ["Sofía","Valentina","Rafael"]),
  LC("Dat is mijn broer, Diego. Hij is negentien.", "Escucha. ¿Quién es Diego?", "Listen. Who is Diego?", ["Sofía's father","Sofía's brother","Sofía's uncle"], 1, "Yes: broer = brother.", "Listen for “broer”."),
  MC('error_detect', "¿Qué frase es correcta?", "Which sentence is correct?", ["Zij heb een baby.","Zij heeft een baby.","Zij hebt een baby."], 1, "Right: hij/zij heeft.", "hij/zij → heeft.", None, "Con hij/zij (él/ella) se dice “heeft”."),
  FILL("Completa con la forma de hebben.", "Complete with the right form of hebben.", "Ik ______ een broer.\nJij ______ twee zussen.\nHij ______ een baby.", ["heb","hebt","heeft"], "ik heb, jij hebt, hij heeft."),
  MC('multiple_choice', "¿Qué es “de ouders”?", "What is “de ouders”?", ["the parents","the grandparents","the children"], 0, "Yes: ouders = parents.", "Ouders = moeder + vader."),
  ORD("Forma la frase.", "Build the sentence.", ["Dat","is","mijn","moeder"], ["Dat is mijn moeder"], "Dat is mijn…"),
  MC('dialogue_completion', "Valentina pregunta: “Heb jij ook een zus?” Tienes una hermana.", "Valentina asks: “Heb jij ook een zus?” You have one sister.", ["Ja, ik heb een zus.","Ja, ik heeft een zus.","Ja, ik ben een zus."], 0, "Perfect: ik heb.", "With ik, use “heb”."),
  RP("Valentina", "Valentina te pregunta por tu familia.", "Valentina asks about your family.", [T("Hoi {preferred_name}! Heb jij broers of zussen?"), X("family", "Ik heb een broer", "Ik heb twee zussen"), T("Leuk! En waar wonen je ouders?"), X("place", "Mijn ouders wonen in …")], "Say: “Ik heb een broer.”"),
  EXIT("Ik heb … Mijn moeder heet …", "Habla de tu familia:", "Talk about your family:", "You can talk about your family in Dutch. Lesson 6 is open!"),
 ]))

L.append((2, 2, dict(
  objective="After this lesson, you can name everyday objects and colours, and use de/het with dit, dat, deze and die.",
  summary="Wat is dat? de pen, het boek, deze/die (de-words), dit/dat (het-words), colours",
  content="Meneer De Vries points at objects in the classroom. Megan says “die boek”, and learns that every noun is a de-word or a het-word.",
  content_es="El profesor De Vries señala objetos en la clase. Megan dice “die boek” y aprende que cada sustantivo es una palabra de o het.",
  tip="Learn every noun with its article: de pen, het boek. de-words take deze/die; het-words take dit/dat. About 2 in 3 nouns are de-words.",
  tip_es="Aprende cada sustantivo con su artículo: de pen, het boek. Con palabras de: deze/die; con palabras het: dit/dat. El género del español no ayuda.",
  vocab=[("het ding","thing","la cosa"),("de klas","classroom, class","la clase"),("de pen","pen","el bolígrafo"),("de tafel","table","la mesa"),("de stoel","chair","la silla"),("het boek","book","el libro"),("het raam","window","la ventana"),("de deur","door","la puerta"),("de tas","bag","la bolsa, el bolso"),("de kleur","colour","el color"),("rood, blauw, geel","red, blue, yellow","rojo, azul, amarillo"),("groen, wit, zwart","green, white, black","verde, blanco, negro"),("oranje","orange","naranja"),("dit / dat","this / that (het)","este / ese (het)"),("deze / die","this / that (de)","este / ese (de)")]),
 [MD('Model dialogue — Wat is dat?', "Peter de Vries: Valentina, wat is dat?\nValentina: Dat is een pen.\nPeter de Vries: Goed: de pen. Megan, wat is dit?\nMegan: Die boek?\nPeter de Vries: Het boek. Dus: dit boek, dat boek.\nMegan: Het boek is blauw. En de pen is rood!", ["Peter de Vries","Valentina","Megan"]),
  LC("Het boek is blauw. En de pen is rood.", "Escucha. ¿De qué color es el libro?", "Listen. What colour is the book?", ["red","blue","yellow"], 1, "Yes: blauw = blue.", "Listen for “blauw”."),
  MC('error_detect', "¿Qué es correcto?", "Which is correct?", ["die boek","dat boek","de boek"], 1, "Right: boek is a het-word → dat boek.", "boek is a het-word.", None, "“Boek” es palabra het: het boek, dit boek, dat boek."),
  dict(type='sort_groups', title='de or het?', needs_audio=False, content=dict(question='de or het?', instruction=bi('Clasifica: ¿de o het?', 'Sort: de or het?'), answer_data=dict(kind='sort_groups', groups=['de','het'], items=[dict(word='pen',group='de'),dict(word='boek',group='het'),dict(word='tafel',group='de'),dict(word='raam',group='het'),dict(word='deur',group='de'),dict(word='huis',group='het')]), feedback_correct='Goed zo!', feedback_retry='Check the word list of this lesson.', feedback_incorrect='de: pen, tafel, deur · het: boek, raam, huis.', retry_allowed=True)),
  MC('multiple_choice', "“De tafel” → ¿cuál es correcto?", "“De tafel” → which is correct?", ["deze tafel","dit tafel","dat tafel"], 0, "Yes: de-word → deze/die.", "tafel is a de-word → deze or die."),
  FILL("Escribe el color.", "Write the colour in Dutch.", "The pen is red: De pen is ______.\nThe chair is green: De stoel is ______.", ["rood","groen"], "rood = red, groen = green."),
  ORD("Forma la frase.", "Build the sentence.", ["Het","boek","is","blauw"], ["Het boek is blauw"], "Het boek is…"),
  RP("Peter de Vries", "El profesor te pregunta por cosas de la clase. Responde con de o het.", "The teacher asks about things in the classroom. Answer with de or het.", [T("Goedemorgen, {preferred_name}. Wat is dit? Het is een tafel."), X("article", "Dat is de tafel", "Dat is een tafel"), T("Goed. En welke kleur heeft jouw tas?"), X("colour", "Mijn tas is zwart")], "Say: “Dat is de tafel.”"),
  EXIT("Dit is mijn tas. Mijn tas is …", "Describe algo que tienes:", "Describe something you have:", "You can name things and colours. Lesson 7 is open!"),
 ]))

L.append((2, 3, dict(
  objective="After this lesson, you can describe what someone looks like.",
  summary="Hoe ziet ze eruit? klein, groot, lang haar, een bril, een gele jas / een geel T-shirt",
  content="Sofía's mother arrives at the airport, and Jan must find her. Sofía describes her. “Een gele T-shirt” becomes “een geel T-shirt”.",
  content_es="La madre de Sofía llega al aeropuerto y Jan tiene que encontrarla. Sofía la describe. “Een gele T-shirt” se convierte en “een geel T-shirt”.",
  tip="Adjective before a noun gets -e (de gele jas, een gele jas), except after “een” with a het-word: een geel T-shirt. After the noun: no -e (het T-shirt is geel).",
  tip_es="El adjetivo antes del sustantivo lleva -e (een gele jas), excepto después de “een” con palabra het: een geel T-shirt. Además, en neerlandés el adjetivo va ANTES del sustantivo.",
  vocab=[("Hoe ziet hij/zij eruit?","What does he/she look like?","¿Cómo es él/ella?"),("groot","big, tall","grande, alto"),("klein","small, short","pequeño, bajo"),("lang","long, tall","largo, alto"),("kort","short","corto"),("jong / oud","young / old","joven / viejo"),("het haar","hair","el pelo"),("de ogen","eyes","los ojos"),("de bril","glasses","las gafas"),("dragen","to wear","llevar puesto"),("de jas","coat, jacket","la chaqueta"),("het T-shirt","T-shirt","la camiseta"),("mevrouw","madam, Mrs.","señora"),("het vliegveld","airport","el aeropuerto"),("geen probleem","no problem","no hay problema")]),
 [MD('Model dialogue — Hoe ziet ze eruit?', "Sofía: Jan, mijn moeder is op het vliegveld.\nJan: Geen probleem. Hoe ziet ze eruit?\nSofía: Ze is klein, en ze heeft lang zwart haar.\nJan: Draagt ze een bril?\nSofía: Ja. En ze draagt een geel T-shirt.\nJan: Goedemiddag, mevrouw. Bent u de moeder van Sofía?", ["Sofía","Jan"]),
  LC("Ze is klein, en ze heeft lang zwart haar.", "Escucha. ¿Cómo es la madre de Sofía?", "Listen. What does Sofía's mother look like?", ["tall, short hair","short, long black hair","short, blond hair"], 1, "Yes: klein, lang zwart haar.", "klein = short; lang haar = long hair."),
  MC('error_detect', "¿Qué es correcto?", "Which is correct?", ["een gele T-shirt","een geel T-shirt","een T-shirt geel"], 1, "Right: een + het-word → no -e.", "T-shirt is a het-word.", None, "Het T-shirt → een geel T-shirt (sin -e). Y el adjetivo va antes del sustantivo."),
  MC('multiple_choice', "¿Qué es correcto?", "Which is correct?", ["de auto rode","de rode auto","de rood auto"], 1, "Yes: adjective before the noun, with -e.", "In Dutch the adjective comes before the noun.", None, "En neerlandés el adjetivo va antes: de rode auto (el coche rojo)."),
  FILL("Completa: ¿con -e o sin -e?", "Complete: with -e or without?", "Ze draagt een ______ jas. (geel)\nHij heeft een ______ huis. (groot)", ["gele","groot"], "de jas → een gele jas; het huis → een groot huis."),
  ORD("Describe a la mujer.", "Describe the woman.", ["Ze","heeft","lang","zwart","haar"], ["Ze heeft lang zwart haar"], "Ze heeft…"),
  MC('scenario_choice', "Hablas con una señora mayor que no conoces. ¿Qué dices?", "You speak to an older woman you don't know. What do you say?", ["Ben jij de moeder van Sofía?","Bent u de moeder van Sofía?","Is jij de moeder van Sofía?"], 1, "Yes: u for an older stranger.", "Use u with older people and strangers."),
  RP("Jan", "Jan va a buscar a tu amigo al aeropuerto. Describe a tu amigo.", "Jan picks up your friend at the airport. Describe your friend.", [T("Hoi {preferred_name}! Ik ben op het vliegveld. Hoe ziet je vriend eruit?"), X("describe", "Hij is groot", "Hij heeft kort zwart haar"), T("Draagt hij een bril?"), X("yes_no", "Ja, hij draagt een bril", "Nee"), T("En wat draagt hij?"), X("clothes", "Hij draagt een blauw T-shirt")], "Say: “Hij is groot. Hij heeft kort haar.”"),
  EXIT("Ik ben … Ik heb … haar.", "Descríbete:", "Describe yourself:", "You can describe people. Lesson 8 is open!"),
 ]))

L.append((2, 4, dict(
  objective="After this lesson, you can say who something belongs to and make plurals.",
  summary="Is die tas van jou? van mij / van jou, de tas → tassen, het boek → boeken, de auto → auto's",
  content="Megan has lost her bag, and Jan has three bags behind the desk. Rafael finds his, with “twee boek” inside. Checkpoint for Module 2.",
  content_es="Megan perdió su bolso y Jan tiene tres bolsos en la recepción. Rafael encuentra el suyo, con “twee boek” dentro. Evaluación del Módulo 2.",
  tip="Plural: usually -en (boek → boeken, tas → tassen), sometimes -s (auto → auto's, tafel → tafels). The article is always “de” in the plural.",
  tip_es="Plural: normalmente -en (boek → boeken), a veces -s (auto → auto's). En plural el artículo siempre es “de”. Y el número no basta: “twee boeken”, no “twee boek”.",
  vocab=[("weg","gone, lost","perdido, desaparecido"),("van mij","mine","mío/mía"),("van jou","yours","tuyo/tuya"),("van hem / van haar","his / hers","de él / de ella"),("Is dat van jou?","Is that yours?","¿Es tuyo?"),("de tas – de tassen","bag – bags","el bolso – los bolsos"),("het boek – de boeken","book – books","el libro – los libros"),("de sleutel – de sleutels","key – keys","la llave – las llaves"),("de fiets – de fietsen","bicycle – bicycles","la bicicleta – las bicicletas"),("de auto – de auto's","car – cars","el coche – los coches"),("er zit … in","there is … inside","hay … dentro"),("de juf","teacher (female, informal)","la maestra")]),
 [MD('Model dialogue — Is die tas van jou?', "Megan: Jan! Mijn tas is weg!\nJan: Kijk, ik heb hier drie tassen. Is deze tas van jou?\nMegan: Nee, die is niet van mij.\nRafael: Hé! Dat is mijn tas! Er zitten twee boeken in.\nJan: En deze blauwe tas, Megan?\nMegan: Ja! Die is van mij!", ["Megan","Jan","Rafael"]),
  LC("Nee, die is niet van mij.", "Escucha. ¿Es el bolso de Megan?", "Listen. Is it Megan's bag?", ["Yes","No"], 1, "Right: “niet van mij” = not mine.", "“niet van mij” means not mine."),
  MC('error_detect', "¿Qué es correcto?", "Which is correct?", ["twee boek","twee boeken","twee boeks"], 1, "Right: boek → boeken.", "After a number, use the plural.", None, "Después de un número va el plural: twee boeken."),
  dict(type='sort_groups', title='-en or -s?', needs_audio=False, content=dict(question='-en or -s?', instruction=bi('¿El plural lleva -en o -s?', 'Does the plural take -en or -s?'), answer_data=dict(kind='sort_groups', groups=['-en','-s'], items=[dict(word='boek',group='-en'),dict(word='auto',group='-s'),dict(word='fiets',group='-en'),dict(word='tafel',group='-s'),dict(word='sleutel',group='-s'),dict(word='pen',group='-en')]), feedback_correct='Goed zo!', feedback_retry='Words ending in -el, -en, -er and most vowels take -s.', feedback_incorrect='-en: boeken, fietsen, pennen · -s: auto’s, tafels, sleutels.', retry_allowed=True)),
  FILL("Completa.", "Complete.", "Is deze tas van ______? (you)\nNee, die is niet van ______. (me)", ["jou","mij"], "van jou = yours, van mij = mine."),
  ORD("Forma la pregunta.", "Build the question.", ["Is","die","tas","van","jou","?"], ["Is die tas van jou?"], "Start with “Is”."),
  MC('multiple_choice', "Repaso: ¿qué es correcto?", "Review: which is correct?", ["Zij heb een zus.","Zij heeft een zus.","Zij hebben een zus."], 1, "Right: zij heeft.", "hij/zij → heeft."),
  MC('multiple_choice', "Repaso: ¿qué es correcto?", "Review: which is correct?", ["een groot huis","een grote huis","een huis groot"], 0, "Right: een + het-word → no -e.", "het huis → een groot huis."),
  RP("Jan", "Perdiste tus llaves. Jan tiene varias cosas en la recepción.", "You lost your keys. Jan has some things at reception.", [T("Hoi {preferred_name}! Wat is er?"), X("lost", "Mijn sleutels zijn weg"), T("Kijk, ik heb hier twee sleutels. Zijn deze sleutels van jou?"), X("yes_no", "Ja, die zijn van mij", "Nee, die zijn niet van mij")], "Say: “Mijn sleutels zijn weg.”"),
  EXIT("Mijn tas is … Er zitten twee … in.", "Describe tu bolso:", "Describe your bag:", "Module 2 done! You can talk about family, things and who they belong to."),
 ]))

# ---------------- Module 3 · Dag en tijd ----------------
L.append((3, 1, dict(
  objective="After this lesson, you can tell the time and make an appointment.",
  summary="Hoe laat is het? drie uur, kwart over drie, half drie (= 2:30!), kwart voor vier, Zullen we…?",
  content="Valentina and Megan agree to have coffee “om half drie”. Megan arrives at 3:30 — because in Dutch, half drie is 2:30.",
  content_es="Valentina y Megan quedan para tomar café “om half drie”. Megan llega a las 3:30, porque en neerlandés half drie son las 2:30.",
  tip="“Half drie” = half an hour BEFORE three = 2:30. Think: halfway to three. English “half three” means 3:30!",
  tip_es="“Half drie” = media hora ANTES de las tres = 2:30. Piensa: a medio camino hacia las tres.",
  vocab=[("Hoe laat is het?","What time is it?","¿Qué hora es?"),("Hoe laat?","At what time?","¿A qué hora?"),("het uur","hour, o'clock","la hora"),("drie uur","three o'clock","las tres"),("kwart over drie","quarter past three","las tres y cuarto"),("half drie","half past two (2:30)","las dos y media"),("kwart voor drie","quarter to three","las tres menos cuarto"),("de minuut","minute","el minuto"),("straks","later, soon","luego"),("op tijd","on time","a tiempo"),("te laat","late","tarde"),("de koffie","coffee","el café"),("betalen","to pay","pagar"),("Zullen we…?","Shall we…?","¿Vamos a…?"),("Tot straks!","See you later!","¡Hasta luego!")]),
 [MD('Model dialogue — Hoe laat is het?', "Valentina: Megan, zullen we straks koffie drinken?\nMegan: Ja, leuk! Hoe laat?\nValentina: Om half drie, in het café.\nValentina: Het is al kwart over drie… Waar is Megan?\nMegan: Hoi! Ik ben op tijd!\nValentina: Op tijd? Half drie is twee uur dertig!", ["Valentina","Megan"]),
  LC("Om half drie, in het café.", "Escucha. ¿A qué hora quedan?", "Listen. What time do they meet?", ["2:30","3:30","3:00"], 0, "Yes: half drie = 2:30.", "Half drie is half an hour before three.", "Half drie = las dos y media."),
  MC('error_detect', "¿Qué hora es “half vier”?", "What time is “half vier”?", ["4:30","3:30","4:15"], 1, "Right: half vier = 3:30.", "Half vier = half an hour before four.", None, "Half vier = media hora antes de las cuatro = 3:30."),
  dict(type='sequence_order', title='Put the times in order', needs_audio=False, content=dict(question='Put the times in order', instruction=bi('Ordena de temprano a tarde.', 'Put in order from early to late.'), answer_data=dict(kind='sequence_order', items=['drie uur','kwart over drie','half vier','kwart voor vier'], correctOrder=['drie uur','kwart over drie','half vier','kwart voor vier']), feedback_correct='Goed zo! 3:00, 3:15, 3:30, 3:45.', feedback_retry='Remember: half vier = 3:30.', feedback_incorrect='3:00 drie uur · 3:15 kwart over drie · 3:30 half vier · 3:45 kwart voor vier.', retry_allowed=True)),
  FILL("Escribe la hora en neerlandés.", "Write the time in Dutch.", "2:30 = half ______\n4:15 = kwart over ______", ["drie","vier"], "2:30 = half drie; 4:15 = kwart over vier."),
  ORD("Propón un café.", "Suggest a coffee.", ["Zullen","we","koffie","drinken","?"], ["Zullen we koffie drinken?"], "Start with “Zullen we”."),
  MC('dialogue_completion', "Megan pregunta: “Hoe laat?” Quieres quedar a las 5:30.", "Megan asks: “Hoe laat?” You want to meet at 5:30.", ["Om half vijf.","Om half zes.","Om vijf uur dertig half."], 1, "Yes: 5:30 = half zes.", "5:30 is half an hour before six → half zes."),
  RP("Valentina", "Valentina quiere tomar un café contigo. Acuerden una hora.", "Valentina wants to have coffee with you. Agree on a time.", [T("Hoi {preferred_name}! Zullen we morgen koffie drinken?"), X("yes", "Ja, leuk!"), T("Hoe laat? Om half vier?"), X("time", "Ja, om half vier", "Nee, om vier uur"), T("Prima! Tot morgen!"), X("close", "Tot morgen!")], "Say: “Ja, leuk! Om half vier.”"),
  EXIT("Het is … uur. Om half … drink ik koffie.", "Di qué hora es ahora:", "Say what time it is now:", "You can tell the time in Dutch. Lesson 10 is open!"),
 ]))

L.append((3, 2, dict(
  objective="After this lesson, you can describe your morning, with the verb in second place.",
  summary="’s ochtends, om zes uur drink ik koffie, ontbijten, slapen, werken, gaan naar",
  content="Meneer De Vries asks the class about their mornings. Rafael says “Om zes uur ik drink koffie” and learns the most important Dutch word-order rule.",
  content_es="El profesor pregunta a la clase por sus mañanas. Rafael dice “Om zes uur ik drink koffie” y aprende la regla de orden más importante del neerlandés.",
  tip="The verb is always the second part of the sentence. If you start with a time (om zes uur), the verb comes next, then ik: Om zes uur drink ik koffie.",
  tip_es="El verbo siempre va en segundo lugar. Si empiezas con la hora (om zes uur), después viene el verbo y luego ik: Om zes uur drink ik koffie.",
  vocab=[("de ochtend / ’s ochtends","morning / in the morning","la mañana / por la mañana"),("de middag","afternoon","la tarde"),("de avond","evening","la noche (tarde-noche)"),("vroeg","early","temprano"),("laat","late","tarde"),("slapen","to sleep","dormir"),("ontbijten","to have breakfast","desayunar"),("douchen","to shower","ducharse"),("koffie drinken","to drink coffee","tomar café"),("gaan naar","to go to","ir a"),("werken","to work","trabajar"),("het ziekenhuis","hospital","el hospital"),("het strand","beach","la playa"),("eerst … dan …","first … then …","primero … luego …"),("nog","still","todavía")]),
 [MD('Model dialogue — Mijn ochtend', "Peter de Vries: Wat doe je ’s ochtends? Valentina?\nValentina: Om vijf uur ga ik naar het ziekenhuis. Ik werk vroeg.\nRafael: Om zes uur drink ik koffie.\nMegan: En om zeven uur slaap ik nog!\nSofía: Om acht uur ontbijt ik, en om negen uur ben ik hier.", ["Peter de Vries","Valentina","Rafael","Megan","Sofía"]),
  LC("Om vijf uur ga ik naar het ziekenhuis.", "Escucha. ¿Qué hace Valentina a las cinco?", "Listen. What does Valentina do at five?", ["She sleeps","She goes to the hospital","She drinks coffee"], 1, "Yes: naar het ziekenhuis.", "Listen for “ziekenhuis”."),
  MC('error_detect', "¿Qué frase es correcta?", "Which sentence is correct?", ["Om zes uur ik drink koffie.","Om zes uur drink ik koffie.","Om zes uur koffie ik drink."], 1, "Right: time + verb + ik.", "The verb is always in second place.", None, "El verbo va en segundo lugar: hora + verbo + ik."),
  ORD("Forma la frase.", "Build the sentence.", ["Om","acht","uur","ontbijt","ik"], ["Om acht uur ontbijt ik"], "Time first, then the verb, then ik.", "Hora, verbo, ik."),
  ORD("Forma la frase.", "Build the sentence.", ["’s Ochtends","ga","ik","naar","mijn","werk"], ["’s Ochtends ga ik naar mijn werk"], "’s Ochtends + verb + ik…"),
  FILL("Completa con el orden correcto.", "Complete in the right order.", "Om zeven uur ______ ______ koffie. (drink / ik)", ["drink","ik"], "Verb first, then ik: drink ik."),
  MC('multiple_choice', "¿Qué significa “Ik slaap nog”?", "What does “Ik slaap nog” mean?", ["I'm still sleeping.","I sleep a lot.","I'm going to sleep."], 0, "Yes: nog = still.", "nog = still."),
  RP("Peter de Vries", "El profesor te pregunta por tu mañana. Empieza tus frases con la hora.", "The teacher asks about your morning. Start your sentences with the time.", [T("Goedemorgen, {preferred_name}. Wat doe je ’s ochtends?"), X("routine", "Om zeven uur drink ik koffie"), T("En hoe laat ga je naar je werk of school?"), X("routine", "Om acht uur ga ik naar mijn werk")], "Say: “Om zeven uur drink ik koffie.”"),
  EXIT("Om … uur … ik. Om … uur … ik.", "Describe tu mañana en dos frases:", "Describe your morning in two sentences:", "You can describe your morning. Lesson 11 is open!"),
 ]))

L.append((3, 3, dict(
  objective="After this lesson, you can say what other people do, with the right verb forms.",
  summary="ik werk, jij werkt, hij/zij werkt, werk jij?, Wat doe je?, studeren, de winkel",
  content="Megan chats with Jan at reception about work and study. She says “Werkt jij?” and learns that the -t disappears when jij comes after the verb.",
  content_es="Megan habla con Jan sobre el trabajo y los estudios. Dice “Werkt jij?” y aprende que la -t desaparece cuando jij va después del verbo.",
  tip="ik werk, jij werkt, hij/zij werkt. But in a question: werk jij? (no -t when jij comes after the verb).",
  tip_es="ik werk, jij werkt, hij/zij werkt. Pero en la pregunta: werk jij? (sin -t cuando jij va después del verbo).",
  vocab=[("Wat doe je?","What do you do?","¿A qué te dedicas?"),("werken bij / in / op","to work at / in / on","trabajar en"),("studeren","to study","estudiar"),("maken","to make","hacer"),("de winkel","shop","la tienda"),("het hotel","hotel","el hotel"),("zwemmen","to swim","nadar"),("elke dag","every day","cada día"),("alleen","only, alone","solo"),("ook","also, too","también"),("de baan","job","el trabajo, empleo"),("het werk","work","el trabajo")]),
 [MD('Model dialogue — Hij werkt, zij studeert', "Jan: Megan, wat doe jij hier op Curaçao?\nMegan: Ik werk bij een hotel. En jij, Jan? Werk jij alleen hier?\nJan: Ik werk hier, en ik studeer ook.\nMegan: En Sofía? Wat doet zij?\nJan: Sofía werkt in een winkel. Zij werkt én zij studeert.", ["Jan","Megan"]),
  LC("Sofía werkt in een winkel.", "Escucha. ¿Dónde trabaja Sofía?", "Listen. Where does Sofía work?", ["in a hotel","in a shop","at the beach"], 1, "Yes: winkel = shop.", "Listen for “winkel”."),
  MC('error_detect', "¿Qué pregunta es correcta?", "Which question is correct?", ["Werkt jij hier?","Werk jij hier?","Jij werkt hier?"], 1, "Right: werk jij (no -t).", "When jij comes after the verb, drop the -t.", None, "Cuando jij va detrás del verbo, se quita la -t: werk jij?"),
  FILL("Completa con la forma correcta de werken.", "Complete with the right form of werken.", "Ik ______ in een hotel.\nJij ______ in een winkel.\nHij ______ op het strand.", ["werk","werkt","werkt"], "ik werk, jij werkt, hij werkt."),
  FILL("Completa la pregunta.", "Complete the question.", "______ jij Nederlands? (studeren)", ["Studeer"], "studeer jij? — no -t after inversion."),
  ORD("Forma la frase.", "Build the sentence.", ["Zij","werkt","in","een","winkel"], ["Zij werkt in een winkel"], "Zij werkt…"),
  MC('dialogue_completion', "Jan pregunta: “Wat doe jij?” Trabajas en un hotel.", "Jan asks: “Wat doe jij?” You work at a hotel.", ["Ik werkt bij een hotel.","Ik werk bij een hotel.","Werk ik bij een hotel."], 1, "Perfect: ik werk.", "With ik there is no -t."),
  RP("Jan", "Jan te pregunta a qué te dedicas tú y tu familia.", "Jan asks what you and your family do.", [T("Hoi {preferred_name}! Wat doe jij? Werk jij of studeer jij?"), X("job", "Ik werk bij …", "Ik studeer …"), T("Leuk! En je broer of zus? Wat doet hij of zij?"), X("third_person", "Mijn zus werkt in …", "Mijn broer studeert …")], "Say: “Ik werk bij …”"),
  EXIT("Ik werk / studeer … Mijn … werkt …", "Di qué haces tú y otra persona:", "Say what you and one other person do:", "You can talk about work and study. Lesson 12 is open!"),
 ]))

L.append((3, 4, dict(
  objective="After this lesson, you can say how often you do things, and use “niet” in the right place.",
  summary="altijd, vaak, soms, nooit, niet, de dagen van de week, het weekend",
  content="On Sunday the class is at the beach. Valentina says “Ik niet werk” and learns where “niet” goes. Checkpoint for Module 3.",
  content_es="El domingo la clase está en la playa. Valentina dice “Ik niet werk” y aprende dónde va “niet”. Evaluación del Módulo 3.",
  tip="“Niet” comes after the verb, usually near the end: Ik werk niet. Ik werk vandaag niet. Not before the verb like Spanish “no trabajo”.",
  tip_es="“Niet” va después del verbo, normalmente al final: Ik werk niet. No va antes del verbo como en “no trabajo”.",
  vocab=[("altijd","always","siempre"),("vaak","often","a menudo"),("soms","sometimes","a veces"),("nooit","never","nunca"),("niet","not","no"),("wel","(yes,) do / indeed","sí"),("maandag, dinsdag","Monday, Tuesday","lunes, martes"),("woensdag, donderdag","Wednesday, Thursday","miércoles, jueves"),("vrijdag, zaterdag, zondag","Friday, Saturday, Sunday","viernes, sábado, domingo"),("het weekend","weekend","el fin de semana"),("vandaag","today","hoy"),("morgen","tomorrow","mañana"),("jullie","you (plural)","ustedes")]),
 [MD('Model dialogue — Altijd, soms, nooit', "Rafael: Hé! Jullie zijn op het strand! Werken jullie vandaag niet?\nSofía: Nee, het is zondag! Op zondag werk ik nooit.\nValentina: Ik werk niet op zondag. Maar soms wel!\nMegan: Ik ga altijd naar het strand op zondag.\nRafael: Op zondag zwem ik niet. Op zondag slaap ik!", ["Rafael","Sofía","Valentina","Megan"]),
  LC("Op zondag werk ik nooit.", "Escucha. ¿Trabaja Sofía el domingo?", "Listen. Does Sofía work on Sunday?", ["always","sometimes","never"], 2, "Yes: nooit = never.", "Listen for “nooit”."),
  MC('error_detect', "¿Qué frase es correcta?", "Which sentence is correct?", ["Ik niet werk op zondag.","Ik werk niet op zondag.","Niet ik werk op zondag."], 1, "Right: niet after the verb.", "“Niet” comes after the verb.", None, "“Niet” va después del verbo, no antes como “no” en español."),
  dict(type='sequence_order', title='From always to never', needs_audio=False, content=dict(question='From always to never', instruction=bi('Ordena de “siempre” a “nunca”.', 'Order from “always” to “never”.'), answer_data=dict(kind='sequence_order', items=['altijd','vaak','soms','nooit'], correctOrder=['altijd','vaak','soms','nooit']), feedback_correct='Goed zo!', feedback_retry='altijd = always, nooit = never.', feedback_incorrect='altijd → vaak → soms → nooit.', retry_allowed=True)),
  ORD("Forma la frase.", "Build the sentence.", ["Ik","werk","vandaag","niet"], ["Ik werk vandaag niet"], "Ik werk … niet."),
  FILL("Completa con el día.", "Complete with the day.", "Na zaterdag komt ______.\nNa maandag komt ______.", ["zondag","dinsdag"], "zaterdag → zondag; maandag → dinsdag."),
  MC('multiple_choice', "Repaso: ¿qué frase es correcta?", "Review: which sentence is correct?", ["Op zondag ik slaap.","Op zondag slaap ik.","Slaap op zondag ik."], 1, "Right: verb in second place.", "Time first → then the verb."),
  MC('multiple_choice', "Repaso: ¿cuándo es “kwart voor zeven”?", "Review: when is “kwart voor zeven”?", ["6:45","7:15","6:30"], 0, "Yes: quarter to seven.", "voor = before → 6:45."),
  RP("Sofía", "Sofía te pregunta qué haces el fin de semana.", "Sofía asks what you do at the weekend.", [T("Hoi {preferred_name}! Wat doe jij in het weekend?"), X("frequency", "Op zaterdag ga ik altijd naar …"), T("Werk jij op zondag?"), X("negation", "Nee, ik werk niet op zondag", "Ja, soms")], "Say: “Op zondag werk ik niet.”"),
  EXIT("Op zondag … ik altijd … Ik werk niet op …", "Describe tu fin de semana:", "Describe your weekend:", "Module 3 done! You can talk about time, routines and how often."),
 ]))

# ---------------- Module 4 · In de stad ----------------
L.append((4, 1, dict(
  objective="After this lesson, you can ask for directions politely and understand the answer.",
  summary="Weet u waar … is? Ga rechtdoor, neem de tweede straat links, naast de bank, Graag gedaan",
  content="In Punda, sunburned Megan looks for a pharmacy. She asks an older man “Weet jij…?” and he teaches her to say u.",
  content_es="En Punda, Megan, quemada por el sol, busca una farmacia. Le pregunta a un señor mayor “Weet jij…?” y él le enseña a usar u.",
  tip="Ask strangers with u: “Weet u waar de apotheek is?” Directions use the command form: Ga rechtdoor. Neem de eerste straat rechts.",
  tip_es="A un desconocido pregúntale con u: “Weet u waar de apotheek is?” Las indicaciones usan el imperativo: Ga rechtdoor (siga recto).",
  vocab=[("de apotheek","pharmacy","la farmacia"),("de bank","bank","el banco"),("de straat","street","la calle"),("Weet u waar … is?","Do you know where … is?","¿Sabe dónde está…?"),("zoeken","to look for","buscar"),("Ga rechtdoor.","Go straight on.","Siga recto."),("links / rechts","left / right","izquierda / derecha"),("Neem de eerste / tweede straat.","Take the first / second street.","Tome la primera / segunda calle."),("naast","next to","al lado de"),("Graag gedaan.","You're welcome.","De nada."),("Dank u wel.","Thank you (formal).","Muchas gracias (usted)."),("de zonnebrandcrème","sunscreen","el protector solar"),("de neus","nose","la nariz")]),
 [MD('Model dialogue — Waar is de apotheek?', "Megan: Hoi! Weet jij waar de apotheek is?\nOude man: Goedemiddag, jongedame. Tegen mij zeg je u: weet u waar de apotheek is?\nMegan: Oh, sorry, meneer! Weet u waar de apotheek is?\nOude man: Ja hoor. Ga rechtdoor, en neem de tweede straat links. De apotheek is naast de bank.\nMegan: Dank u wel!\nOude man: Graag gedaan.", ["Megan","Oude man"]),
  LC("Ga rechtdoor, en neem de tweede straat links. De apotheek is naast de bank.", "Escucha. ¿Dónde está la farmacia?", "Listen. Where is the pharmacy?", ["first street right, next to the bank","second street left, next to the bank","second street left, opposite the bank"], 1, "Yes: tweede straat links, naast de bank.", "Listen again: tweede… links… naast…"),
  MC('scenario_choice', "Preguntas a un señor mayor en la calle. ¿Qué dices?", "You ask an older man in the street. What do you say?", ["Weet jij waar de bank is?","Weet u waar de bank is?","Waar is bank, jij?"], 1, "Right: u for an older stranger.", "Use u with strangers and older people."),
  MC('multiple_choice', "“Ga rechtdoor” significa…", "“Ga rechtdoor” means…", ["Turn right.","Go straight on.","Go back."], 1, "Yes: rechtdoor = straight on.", "rechts = right, but rechtdoor = straight on.", None, "Cuidado: rechts = derecha, rechtdoor = recto."),
  ORD("Forma la pregunta.", "Build the question.", ["Weet","u","waar","de","apotheek","is","?"], ["Weet u waar de apotheek is?"], "Weet u waar… is?"),
  FILL("Completa las indicaciones.", "Complete the directions.", "______ rechtdoor.\nNeem de eerste straat ______. (→)", ["Ga","rechts"], "Ga rechtdoor; rechts = right."),
  MC('dialogue_completion', "El señor dice: “Graag gedaan.” ¿Qué significa?", "The man says: “Graag gedaan.” What does it mean?", ["You're welcome.","Good afternoon.","Go left."], 0, "Yes: you're welcome.", "It's the answer to “Dank u wel”."),
  RP("Oude man", "Estás en Punda y buscas el banco. Pregunta a un señor mayor (con u).", "You are in Punda looking for the bank. Ask an older man (use u).", [T("Goedemiddag. Kan ik u helpen?"), X("ask_way", "Weet u waar de bank is?"), T("Ja hoor. Ga rechtdoor, en neem de eerste straat rechts. De bank is naast de apotheek."), X("repeat_thanks", "Dank u wel!")], "Say: “Weet u waar de bank is?”"),
  EXIT("Weet u waar … is? Dank u wel!", "Pregunta por un lugar de tu ciudad:", "Ask for a place in your town:", "You can ask for directions politely. Lesson 14 is open!"),
 ]))

L.append((4, 2, dict(
  objective="After this lesson, you can say where people and things are with in, op, aan and bij.",
  summary="in de bus, op school, op het werk, op het strand, op Curaçao, in Nederland, bij de bushalte, naast",
  content="Two students are missing from class. Megan says her sister is “in school” and learns: op school, op het werk, and op Curaçao but in Nederland.",
  content_es="Faltan dos estudiantes en clase. Megan dice que su hermana está “in school” y aprende: op school, op het werk, y op Curaçao pero in Nederland.",
  tip="Spanish “en” has several Dutch forms: op school, op het werk, op het strand; in de bus, in het ziekenhuis. Islands take op (op Curaçao, op Aruba); countries take in (in Nederland).",
  tip_es="El “en” español tiene varias formas: op school, op het werk, op het strand; in de bus, in het ziekenhuis. Islas con op (op Curaçao); países con in (in Nederland).",
  vocab=[("in","in","en, dentro de"),("op","on, at","en, sobre"),("aan","at, on (a wall, table)","en, junto a"),("bij","at, near, with","en, junto a, en casa de"),("naast","next to","al lado de"),("tegenover","opposite","enfrente de"),("onder","under","debajo de"),("de bus / de bushalte","bus / bus stop","el autobús / la parada"),("de school","school","la escuela"),("het eiland","island","la isla"),("het land","country","el país"),("zitten","to sit","sentarse, estar sentado"),("te laat","late","tarde"),("precies","exactly","exacto")]),
 [MD('Model dialogue — In, op, aan, bij', "Peter de Vries: Waar is Rafael vandaag?\nSofía: Hij is in de bus. Hij is te laat.\nMegan: Mijn ouders zijn in Texas. En mijn zus is op school.\nPeter de Vries: Precies! Op een eiland, in een land: op Curaçao, in Nederland.\nRafael: Sorry! Ik sta al tien minuten bij de bushalte!", ["Peter de Vries","Sofía","Megan","Rafael"]),
  LC("Hij is in de bus. Hij is te laat.", "Escucha. ¿Dónde está Rafael?", "Listen. Where is Rafael?", ["at school","on the bus","at the beach"], 1, "Yes: in de bus.", "Listen for “bus”."),
  MC('error_detect', "¿Qué es correcto?", "Which is correct?", ["Mijn zus is in school.","Mijn zus is op school.","Mijn zus is aan school."], 1, "Right: op school.", "Dutch says “op school”.", None, "Se dice “op school” (en la escuela)."),
  dict(type='sort_groups', title='op or in?', needs_audio=False, content=dict(question='op or in?', instruction=bi('¿op o in?', 'op or in?'), answer_data=dict(kind='sort_groups', groups=['op','in'], items=[dict(word='Curaçao',group='op'),dict(word='Nederland',group='in'),dict(word='school',group='op'),dict(word='de bus',group='in'),dict(word='het strand',group='op'),dict(word='het ziekenhuis',group='in')]), feedback_correct='Goed zo!', feedback_retry='Islands and school/work/beach take op.', feedback_incorrect='op: Curaçao, school, het strand · in: Nederland, de bus, het ziekenhuis.', retry_allowed=True)),
  FILL("Completa con op o in.", "Complete with op or in.", "Ik woon ______ Aruba.\nMijn tante woont ______ Nederland.", ["op","in"], "Island → op; country → in."),
  ORD("Forma la frase.", "Build the sentence.", ["Ik","sta","bij","de","bushalte"], ["Ik sta bij de bushalte"], "Ik sta bij…"),
  MC('multiple_choice', "“Ga zitten, naast Sofía.” ¿Dónde te sientas?", "“Ga zitten, naast Sofía.” Where do you sit?", ["opposite Sofía","next to Sofía","behind Sofía"], 1, "Yes: naast = next to.", "naast = next to."),
  RP("Peter de Vries", "El profesor pregunta dónde están tus compañeros y tu familia.", "The teacher asks where your classmates and family are.", [T("Goedemorgen, {preferred_name}. Waar woon jij?"), X("place", "Ik woon op Curaçao", "Ik woon in …"), T("En waar is je familie nu?"), X("place", "Mijn moeder is op het werk", "Mijn broer is op school")], "Say: “Ik woon op Curaçao.”"),
  EXIT("Ik woon op … Mijn … is op school / op het werk.", "Di dónde vives y dónde está alguien de tu familia:", "Say where you live and where someone in your family is:", "You can say where people are. Lesson 15 is open!"),
 ]))

L.append((4, 3, dict(
  objective="After this lesson, you can describe your neighbourhood with er is and er zijn.",
  summary="Er is een supermarkt. Er zijn twee restaurants. Is er…? geen, de buurt, op de hoek, tegenover",
  content="Sofía visits Valentina's new apartment. Valentina says “Is een supermarkt op de hoek” and learns how Dutch says “hay”.",
  content_es="Sofía visita el nuevo apartamento de Valentina. Valentina dice “Is een supermarkt op de hoek” y aprende cómo se dice “hay” en neerlandés.",
  tip="“Hay” = er is (one) / er zijn (more). Question: Is er…? / Zijn er…? “Not a” = geen: Er is geen strand.",
  tip_es="“Hay” = er is (uno) / er zijn (varios). Pregunta: Is er…? / Zijn er…? “No hay” = er is geen: Er is geen strand.",
  vocab=[("er is","there is","hay (uno)"),("er zijn","there are","hay (varios)"),("Is er…? / Zijn er…?","Is there…? / Are there…?","¿Hay…?"),("geen","no, not a","ningún, no hay"),("de buurt","neighbourhood","el barrio"),("het appartement","apartment","el apartamento"),("het huis","house","la casa"),("de supermarkt","supermarket","el supermercado"),("het restaurant","restaurant","el restaurante"),("op de hoek","on the corner","en la esquina"),("tegenover","opposite","enfrente de"),("mooi","beautiful, nice","bonito"),("leuk","nice, fun","agradable")]),
 [MD('Model dialogue — Er is, er zijn', "Sofía: Wauw, een mooi appartement!\nValentina: Dank je! En de buurt is ook leuk.\nSofía: Is er een supermarkt in de buurt?\nValentina: Ja, er is een supermarkt op de hoek, en er zijn twee restaurants.\nValentina: Maar er is geen strand.\nSofía: Geen strand? Dan komt Rafael nooit hier!", ["Sofía","Valentina"]),
  LC("Er is een supermarkt op de hoek, en er zijn twee restaurants.", "Escucha. ¿Qué hay en el barrio?", "Listen. What is in the neighbourhood?", ["a supermarket and two restaurants","two supermarkets and a restaurant","a beach and a restaurant"], 0, "Yes.", "er is = one; er zijn = more."),
  MC('error_detect', "¿Qué frase es correcta?", "Which sentence is correct?", ["Is een supermarkt op de hoek.","Er is een supermarkt op de hoek.","Hay een supermarkt op de hoek."], 1, "Right: er is.", "“Hay” = er is / er zijn.", None, "“Hay” se dice “er is” (uno) o “er zijn” (varios)."),
  FILL("Completa con is o zijn.", "Complete with is or zijn.", "Er ______ een bank in de buurt.\nEr ______ drie restaurants.", ["is","zijn"], "one → er is; more → er zijn."),
  MC('multiple_choice', "¿Cómo dices “No hay playa”?", "How do you say “There is no beach”?", ["Er is niet strand.","Er is geen strand.","Er geen is strand."], 1, "Yes: geen = no / not a.", "Before a noun, use geen."),
  ORD("Forma la pregunta.", "Build the question.", ["Is","er","een","bushalte","?"], ["Is er een bushalte?"], "Is er…?"),
  MC('multiple_choice', "“Tegenover mijn huis” significa…", "“Tegenover mijn huis” means…", ["next to my house","opposite my house","behind my house"], 1, "Yes: tegenover = opposite.", "tegenover = opposite."),
  RP("Sofía", "Sofía te pregunta por tu barrio.", "Sofía asks about your neighbourhood.", [T("Hoi {preferred_name}! Is jouw buurt leuk?"), X("opinion", "Ja, mijn buurt is leuk"), T("Is er een supermarkt?"), X("er_is", "Ja, er is een supermarkt", "Nee, er is geen supermarkt"), T("En zijn er restaurants?"), X("er_zijn", "Ja, er zijn twee restaurants")], "Say: “Er is een supermarkt.”"),
  EXIT("In mijn buurt is er … Er zijn … Er is geen …", "Describe tu barrio:", "Describe your neighbourhood:", "You can describe your neighbourhood. The final lesson is open!"),
 ]))

L.append((4, 4, dict(
  objective="After this lesson, you can use everything from A1.1 together, and you pass the final test.",
  summary="Review of A1.1: introductions, questions, hebben/zijn, de/het, time, verb second, niet, u, in/op, er is/er zijn",
  content="Jan gives the class a tour of Punda. This time every character gets their old mistake right. Then the final test of A1.1.",
  content_es="Jan hace un recorrido por Punda con la clase. Esta vez cada personaje dice bien lo que antes decía mal. Después, la prueba final de A1.1.",
  tip="The 10 A1.1 traps: say ik · question starts with the verb · J = jee · ik ben 27 jaar · hij heeft · de/het · een geel T-shirt · half drie = 2:30 · verb second · niet after the verb · u to strangers · op school · er is.",
  tip_es="Las trampas de A1.1: di ik · la pregunta empieza con el verbo · J = jee · ik ben 27 jaar · hij heeft · de/het · half drie = 2:30 · el verbo en segundo lugar · niet después del verbo · u con desconocidos · op school · er is.",
  vocab=[("de gids","guide","el guía"),("de brug","bridge","el puente"),("de toerist","tourist","el turista"),("veel","many, a lot","mucho(s)"),("het museum","museum","el museo"),("open / dicht","open / closed","abierto / cerrado"),("vragen aan","to ask (someone)","preguntar a"),("klaar","finished, ready","listo, terminado"),("Gefeliciteerd!","Congratulations!","¡Felicidades!")]),
 [MD('Model dialogue — Eindproject', "Jan: Welkom in Punda! Vandaag ben ik jullie gids.\nRafael: Ik ben Rafael, ik kom uit Brazilië, en ik ben zevenentwintig jaar!\nJan: Kijk, daar is de brug. Er zijn veel toeristen.\nValentina: Zullen we om half vier koffie drinken?\nMegan: Om half vier. Dat is drie uur dertig. Ik weet het nu!\nMegan: Meneer, weet u waar het museum is?\nPeter de Vries: Ga rechtdoor, en dan de eerste straat rechts.\nPeter de Vries: Op zondag is het museum niet open.\nPeter de Vries: Gefeliciteerd! A1.1 is klaar!", ["Jan","Rafael","Valentina","Megan","Peter de Vries"]),
  MC('error_detect', "Final test 1/10 · ¿Correcto?", "Final test 1/10 · Which is correct?", ["Ben Sofía.","Ik ben Sofía."], 1, "Correct.", "Always say ik."),
  MC('error_detect', "Final test 2/10", "Final test 2/10 · Which question is correct?", ["Kom jij uit Chili?","Jij komt uit Chili?"], 0, "Correct.", "The question starts with the verb."),
  MC('error_detect', "Final test 3/10", "Final test 3/10 · Which is correct?", ["Ik heb 30 jaar.","Ik ben 30 jaar."], 1, "Correct.", "Age uses zijn."),
  MC('error_detect', "Final test 4/10", "Final test 4/10 · Which is correct?", ["Zij heeft twee kinderen.","Zij heb twee kinderen."], 0, "Correct.", "hij/zij heeft."),
  MC('error_detect', "Final test 5/10", "Final test 5/10 · Which is correct?", ["dat boek","die boek"], 0, "Correct.", "boek is a het-word → dat boek."),
  MC('multiple_choice', "Final test 6/10 · ¿Qué hora es “half negen”?", "Final test 6/10 · What time is “half negen”?", ["8:30","9:30"], 0, "Correct: 8:30.", "Half negen = half an hour before nine."),
  MC('error_detect', "Final test 7/10", "Final test 7/10 · Which is correct?", ["Om zeven uur ik ontbijt.","Om zeven uur ontbijt ik."], 1, "Correct.", "The verb is in second place."),
  MC('error_detect', "Final test 8/10", "Final test 8/10 · Which is correct?", ["Ik werk niet vandaag.","Ik niet werk vandaag."], 0, "Correct.", "niet comes after the verb."),
  MC('scenario_choice', "Final test 9/10 · A un señor mayor desconocido:", "Final test 9/10 · To an older man you don't know:", ["Weet u waar de bank is?","Weet jij waar de bank is?"], 0, "Correct.", "Use u with strangers."),
  MC('error_detect', "Final test 10/10", "Final test 10/10 · Which is correct?", ["Er is een apotheek op de hoek.","Is een apotheek op de hoek."], 0, "Correct.", "“hay” = er is."),
  RP("Jan", "Tour final con Jan: preséntate, di dónde vives y qué hay en tu barrio.", "Final tour with Jan: introduce yourself, say where you live and what is in your neighbourhood.", [T("Welkom in Punda, {preferred_name}! Wie ben jij?"), X("introduce", "Ik ben …, ik kom uit …, ik ben … jaar"), T("Waar woon jij?"), X("place", "Ik woon op Curaçao"), T("En wat is er in jouw buurt?"), X("er_is", "Er is een supermarkt", "Er zijn twee restaurants")], "Say: “Ik ben … Ik woon op …”"),
  EXIT("Ik ben {preferred_name}. Ik kom uit {country}. Ik woon op … In mijn buurt is er …", "Preséntate con todo lo que sabes:", "Introduce yourself with everything you know:", "Gefeliciteerd! You finished Dutch A1.1."),
 ]))

def lesson_sql(mod, pos, meta, steps):
    sel = f"(select l.id from lessons l join modules m on m.id = l.module_id join courses c on c.id = m.course_id where c.code = 'nl-a1-1' and m.position = {mod} and l.position = {pos})"
    vocab = [dict(nl=a, en=b, es=c) for a, b, c in meta['vocab']]
    rows = []
    for i, s in enumerate(steps, 1):
        c = dict(s['content'])
        if s['type'] == 'sequence_order':
            ad = dict(c['answer_data']); texts = ad['items']
            ad['items'] = [dict(id='ABCDEFG'[k], text=t) for k, t in enumerate(texts)]
            ad['correctOrder'] = ['ABCDEFG'[texts.index(t)] for t in ad['correctOrder']]
            c['answer_data'] = ad
        c.setdefault('required', True); c['published'] = True
        c = {k: v for k, v in c.items() if v is not None}
        rows.append(dict(pos=i, type=s['type'], title=s['title'][:200], content=c, needs_audio=s['needs_audio']))
    q = lambda t: "$q$" + t + "$q$"
    return f"""
update lessons set objective = {q(meta['objective'])}, summary = {q(meta['summary'])}, content = {q(meta['content'])},
  content_es = {q(meta['content_es'])}, tip = {q(meta['tip'])}, tip_es = {q(meta['tip_es'])}, minutes = 25,
  vocab = {q(json.dumps(vocab, ensure_ascii=False))}::jsonb, updated_at = now() where id = {sel};
delete from steps where lesson_id = {sel};
insert into steps (lesson_id, position, type, title, content, points, needs_audio, status)
select {sel}, x.pos, x.type, x.title, x.content, 1, x.needs_audio, 'published'
from jsonb_to_recordset({q(json.dumps(rows, ensure_ascii=False))}::jsonb) as x(pos int, type text, title text, content jsonb, needs_audio boolean);
"""

if __name__ == '__main__':
    import sys
    for mod in (1, 2, 3, 4):
        sql = ''.join(lesson_sql(*l) for l in L if l[0] == mod)
        open(f'/home/claude/nl/module{mod}.sql', 'w').write(sql)
    print(len(L), 'lessons', sum(len(l[3]) for l in L), 'steps')
    for l in L: print(l[0], l[1], len(l[3]), [s['type'] for s in l[3]])

def call_sql(mod, pos, meta, steps):
    vocab = [dict(nl=a, en=b, es=c) for a, b, c in meta['vocab']]
    m = {k: v for k, v in meta.items() if k != 'vocab'}; m['vocab'] = vocab
    rows = []
    for i, s in enumerate(steps, 1):
        c = dict(s['content'])
        if s['type'] == 'sequence_order':
            ad = dict(c['answer_data']); texts = ad['items']
            ad['items'] = [dict(id='ABCDEFG'[k], text=t) for k, t in enumerate(texts)]
            ad['correctOrder'] = ['ABCDEFG'[texts.index(t)] for t in ad['correctOrder']]
            c['answer_data'] = ad
        c.setdefault('required', True); c['published'] = True
        c = {k: v for k, v in c.items() if v is not None}
        rows.append(dict(pos=i, type=s['type'], title=s['title'][:200], content=c, needs_audio=s['needs_audio']))
    j = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    return f"select _seed_lesson('nl-a1-1',{mod},{pos},$q${j(m)}$q$::jsonb,$q${j(rows)}$q$::jsonb);\n"

for mod in (1, 2, 3, 4):
    open(f'/home/claude/nl/call{mod}.sql', 'w').write(''.join(call_sql(*l) for l in L if l[0] == mod))
