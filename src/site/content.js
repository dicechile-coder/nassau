// Content shared by several website pages. Edit texts here.

export const LANGUAGES = {
  dutch: {
    slug: 'dutch', name: 'Dutch', native: 'Nederlands', color: '#3E6A9E', nativeColor: '#3E6A9E',
    intro: 'For daily life, work and study, from your first “hallo” to confident conversation.',
    hero: 'Learn Dutch for daily life in Curaçao, the Netherlands or anywhere: from everyday conversation to NT2 and the Dutch Naturalization exams.',
    rows: [
      ['General Dutch', 'teacher'],
      ['NT2, Dutch as a second language', 'teacher'],
      ['Naturalization exam prep', 'teacher'],
      ['Self-study with Nate', 'next'],
    ],
    tracks: [
      ['General Dutch', 'Everyday conversation, reading and writing for life, work and study, from A1 to C2.'],
      ['NT2 — Dutch as a second language', 'For integration in a Dutch-speaking environment: shops, appointments, official letters and forms, work.'],
      ['Dutch Naturalization exam prep', 'Structured, repeatable practice for every skill tested: speaking, reading, writing and listening.'],
    ],
  },
  english: {
    slug: 'english', name: 'English', native: 'English', color: '#D65E22', nativeColor: '#C4521A', featured: true,
    intro: 'For everyday life, work, study and travel. Real conversation practice, not just grammar drills.',
    hero: 'Build confidence for everyday life, work, study and international communication, with story videos, practice and conversation.',
    rows: [
      ['Self-study with Nate', 'now'],
      ['Group or private classes', 'teacher'],
      ['Business English', 'teacher'],
      ['Free first lesson', 'free'],
    ],
    tracks: [
      ['Self-study with Nate', 'Story episodes, interactive exercises and role-play conversations with your AI tutor. Level A1.1 is available now.'],
      ['Group or private classes', 'Live classes with a teacher, in Curaçao or online, with the online platform between classes.'],
      ['Business English', 'Meetings, emails, presentations and phone calls, tailored to your work.'],
    ],
  },
  spanish: {
    slug: 'spanish', name: 'Spanish', native: 'Español', color: '#6E9A45', nativeColor: '#4E7A2E',
    intro: 'From your first “hola” to confident everyday conversation, for travel, work and family.',
    hero: 'From your first “hola” to confident everyday conversation, with a teacher who makes you speak from day one.',
    rows: [
      ['General Spanish', 'teacher'],
      ['Group or private classes', 'teacher'],
      ['Business Spanish', 'teacher'],
      ['Self-study with Nate', 'later'],
    ],
    tracks: [
      ['General Spanish', 'Everyday conversation, reading and writing, from A1 to C2.'],
      ['Group or private classes', 'Live classes with a teacher, in Curaçao or online, with the online platform between classes.'],
      ['Business Spanish', 'For work with Spanish-speaking colleagues, clients and partners.'],
    ],
  },
}
export const LANGUAGE_ORDER = ['dutch', 'english', 'spanish']

export const STATUS = {
  now: ['Available now', 'st-now'],
  free: ['Try it today', 'st-now'],
  teacher: ['With a teacher', 'st-teacher'],
  next: ['Coming next', 'st-soon'],
  later: ['After Dutch', 'st-soon'],
}

export const CAST = [
  ['luis', 'Luis', 'From Colombia. Always late, learning fast.'],
  ['sofia', 'Sofía', 'From Venezuela. Corrects everyone, kindly.'],
  ['maya', 'Maya', 'From Jamaica. Never without her camera.'],
  ['jan', 'Jan', 'From the Netherlands. Works at reception.'],
  ['emma', 'Emma', 'From Aruba. Finds what others lose.'],
  ['ana', 'Ana', 'Luis’s sister, a nurse. Never late.'],
]

export const A1_MODULES = [
  ['First conversations', ['Greetings and names', 'Countries and nationalities', 'Spelling your name', 'Meeting someone new']],
  ['Family, belongings & descriptions', ['Family members', 'Everyday objects and colours', 'Describing people', 'Whose is it?']],
  ['Daily routine & time', ['Telling the time and days', 'Your morning routine', 'He works, she plays (-s)', 'Always, sometimes, never']],
  ['Around town', ['Places and directions', 'In, on, at', 'There is, there are', 'Final project: meet Ana']],
]

export const FAQ = [
  ['Which languages can I learn?', 'Dutch (including NT2 and Naturalization exam prep), English and Spanish, from A1 to C2 with a teacher. Self-study with Nate starts with English; Dutch comes next, then Spanish.'],
  ['Is the first lesson really free?', 'Yes. Lesson 1 of our English self-study course is free after a quick sign-up. No credit card, no automatic payments. For Dutch and Spanish, the placement talk with a teacher is free.'],
  ['What level do I need?', 'None. Level A1 starts from zero. Not sure where you belong? Book a free placement talk with a teacher.'],
  ['Who is Nate?', 'Nate is the AI tutor inside every self-study lesson. You chat with him in the language you are learning; he corrects you gently and explains in simple words. Today you type; spoken conversations are coming.'],
  ['Can I learn with a real teacher instead?', 'Yes. Group classes, private lessons and exam preparation for Dutch, English and Spanish, in Curaçao or online.'],
]
