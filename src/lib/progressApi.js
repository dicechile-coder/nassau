import { supabase } from './supabase.js'

export async function myProgress() {
  const { data, error } = await supabase.rpc('my_progress')
  if (error) throw error
  return data
}

// Streak days follow the student's own clock: store the browser's time zone once.
export async function syncTimezone(profile) {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (profile?.id && tz && profile.timezone !== tz) {
      await supabase.from('profiles').update({ timezone: tz }).eq('id', profile.id)
    }
  } catch { /* not important enough to bother the student */ }
}

export async function myLessonProgress() {
  const { data, error } = await supabase.from('lesson_progress').select('lesson_id, best_score, passed, attempts, completed_at')
  if (error) throw error
  return Object.fromEntries((data ?? []).map(r => [r.lesson_id, r]))
}

// ---------- admin ----------
export async function adminStudents() {
  const { data, error } = await supabase.rpc('admin_students')
  if (error) throw error
  return data ?? []
}

export async function adminStudentDetail(userId) {
  const [progress, logs, usage] = await Promise.all([
    supabase.from('lesson_progress').select('lesson_id, best_score, passed, attempts, completed_at').eq('user_id', userId),
    supabase.from('ai_logs').select('id, kind, created_at, input, output, step_id').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
    supabase.from('ai_usage').select('day, kind, count').eq('user_id', userId).order('day', { ascending: false }).limit(14),
  ])
  for (const r of [progress, logs, usage]) if (r.error) throw r.error
  return {
    progress: Object.fromEntries((progress.data ?? []).map(r => [r.lesson_id, r])),
    logs: logs.data ?? [],
    usage: usage.data ?? [],
  }
}

export async function adminSetAi(userId, bonus, unlimited) {
  const { error } = await supabase.from('profiles').update({ ai_bonus: bonus, ai_unlimited: unlimited }).eq('id', userId)
  if (error) throw error
}
