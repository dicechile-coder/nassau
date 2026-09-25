import { supabase } from './supabase.js'

export async function loadAdminCourse(code = 'en-a1-1') {
  const { data, error } = await supabase
    .from('courses')
    .select('id, code, title, language, voice_set, modules(id, position, title, description, lessons(*))')
    .eq('code', code)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  data.modules = [...(data.modules ?? [])].sort((a, b) => a.position - b.position)
    .map(m => ({ ...m, lessons: [...(m.lessons ?? [])].sort((a, b) => a.position - b.position) }))
  return data
}

export async function loadSteps(lessonId) {
  const { data, error } = await supabase.from('steps').select('*').eq('lesson_id', lessonId).order('position')
  if (error) throw error
  return data ?? []
}

export async function saveLesson(id, fields) {
  const { error } = await supabase.from('lessons').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function saveModule(id, fields) {
  const { error } = await supabase.from('modules').update(fields).eq('id', id)
  if (error) throw error
}

export async function saveStep(id, fields) {
  const { error } = await supabase.from('steps').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function deleteStep(id) {
  const { error } = await supabase.from('steps').delete().eq('id', id)
  if (error) throw error
}

export async function moveStep(id, direction) {
  const { error } = await supabase.rpc('move_step', { p_step: id, p_direction: direction })
  if (error) throw error
}

export async function addStep(lessonId, type, title, content) {
  const { data, error } = await supabase.rpc('add_step', { p_lesson: lessonId, p_type: type, p_title: title, p_content: content })
  if (error) throw error
  return data
}

// Templates for new exercises
export const NEW_STEP_TYPES = [
  { type: 'multiple_choice', label: 'Multiple choice', content: { instruction: 'Choose the correct answer.', question: '', options: ['', '', ''], correct_answer: '' } },
  { type: 'fill_in', label: 'Fill in the blanks', content: { instruction: 'Complete the sentence.', question: 'I ______ from Colombia.', answer_data: { kind: 'fill_in', blanks: 1, answers: ['am'] } } },
  { type: 'sentence_order', label: 'Put words in order', content: { instruction: 'Tap the words in order.', question: '', answer_data: { kind: 'sentence_order', tokens: ['My', 'name', 'is', 'Ana'], accept: ['My name is Ana'] } } },
  { type: 'sort_groups', label: 'Sort into groups', content: { instruction: 'Put each word in the correct group.', question: '', answer_data: { kind: 'sort_groups', groups: ['Group A', 'Group B'], items: [{ word: 'word 1', group: 'Group A' }, { word: 'word 2', group: 'Group B' }] } } },
  { type: 'sequence_order', label: 'Put lines in order', content: { instruction: 'Put the conversation in a natural order.', question: '', answer_data: { kind: 'sequence_order', items: [{ id: 'A', text: 'First line' }, { id: 'B', text: 'Second line' }], correctOrder: ['A', 'B'] } } },
  { type: 'model_dialogue', label: 'Dialogue / text to read or hear', content: { instruction: 'Listen and read.', transcript: 'Maya: Hello!\nLuis: Hi!', answer_data: { kind: 'model_dialogue' } } },
  { type: 'personalized_input', label: 'Personal answer (name, country)', content: { instruction: 'Type your answer.', question: '', answer_data: { kind: 'personalized_input', store: '' } } },
  { type: 'writing_task', label: 'Writing task (AI-marked, scored)', content: { instruction: 'Write a short message.', task: 'Write 3–4 sentences.', variations: ['Situation 1', 'Situation 2', 'Situation 3'], required: [], target: '', min_words: 15, answer_data: { kind: 'writing_task', model: '' } } },
  { type: 'exit_ticket', label: 'Open writing (AI feedback, not scored)', content: { instruction: 'Write your answer.', question: '', answer_data: { kind: 'exit_ticket', model: '' } } },
  { type: 'h5p', label: 'H5P activity (embed)', content: { instruction: 'Do the activity below, then continue.', question: '', h5p_url: '', height: 500 } },
  { type: 'ai_roleplay', label: 'AI role-play', content: { instruction: 'Talk with the tutor.', question: '', answer_data: { kind: 'ai_roleplay', persona: 'Nate', script: [{ role: 'tutor', text: 'Hello!' }] } } },
]

export const TYPE_GROUPS = {
  choice: ['multiple_choice', 'listening_choose', 'scenario_choice', 'dialogue_completion', 'edit_choice', 'dialogue_diagnosis', 'meaning_context', 'false_friends_quiz', 'error_detect', 'nationality_confirm'],
  order: ['sentence_order', 'reorder_question'],
  reorder: ['sentence_reorder'],
  fill: ['fill_in'],
  sort: ['sort_groups'],
  sequence: ['sequence_order'],
  personal: ['personalized_input', 'spelling_guided'],
  open: ['exit_ticket'],
  ai: ['ai_roleplay', 'ai_conversation', 'speak_or_type', 'final_mission'],
  info: ['model_dialogue'],
  h5p: ['h5p'],
  writing: ['writing_task'],
}

export function typeGroup(type) {
  return Object.entries(TYPE_GROUPS).find(([, list]) => list.includes(type))?.[0] ?? 'other'
}

// Accepts an H5P / iframe embed code or a plain link and returns the https link to show.
export function extractEmbedUrl(input) {
  const text = (input || '').trim()
  const m = text.match(/src\s*=\s*["']([^"']+)["']/i)
  const url = m ? m[1] : text
  try {
    const u = new URL(url)
    return u.protocol === 'https:' ? u.toString() : ''
  } catch { return '' }
}
