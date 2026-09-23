import { supabase } from './supabase.js'

export async function getLessonSteps(lessonId) {
  const { data, error } = await supabase.rpc('get_lesson_steps', { p_lesson: lessonId })
  if (error) throw error
  return data ?? []
}

export async function checkStep(stepId, answer, preview = false) {
  const { data, error } = await supabase.rpc('check_step', { p_step: stepId, p_answer: answer, p_preview: preview })
  if (error) throw error
  return data
}

export async function completeLesson(lessonId, preview = false) {
  const { data, error } = await supabase.rpc('complete_lesson', { p_lesson: lessonId, p_preview: preview })
  if (error) throw error
  return data
}
