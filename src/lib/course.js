import { supabase, COURSE_CODE } from './supabase.js'

// ---- Which course is the student working on? (remembered per browser) ----
const KEY = 'nassau.course'
export function currentCourseCode() {
  try { return localStorage.getItem(KEY) || COURSE_CODE } catch { return COURSE_CODE }
}
export function setCurrentCourse(code) {
  try { localStorage.setItem(KEY, code) } catch { /* private mode: fine */ }
}

// Courses this user can see: published ones (staff also see drafts), in order.
export async function listCourses() {
  const { data, error } = await supabase.from('courses')
    .select('id, code, title, level, language, status, position').order('position')
  if (error) throw error
  return data ?? []
}

// The course a lesson belongs to (for direct links to a lesson).
export async function courseCodeForLesson(lessonId) {
  const { data } = await supabase.from('lessons')
    .select('module:modules(course:courses(code))').eq('id', lessonId).maybeSingle()
  return data?.module?.course?.code ?? null
}

// Loads the course with modules and lessons in order, plus each lesson's status
// from the database's single unlock rule (public.lesson_status).
export async function loadCourse(code = currentCourseCode()) {
  const { data: course, error } = await supabase
    .from('courses')
    .select('id, code, title, level, description, language, voice_set, status, modules(id, position, title, description, lessons(id, position, title, objective, summary, content, content_es, tip, tip_es, vocab, minutes, pass_mark, is_checkpoint, video_url, status))')
    .eq('code', code)
    .maybeSingle()
  if (error) throw error
  if (!course) return null

  const { data: statuses, error: statusError } = await supabase.rpc('lesson_status', { p_course_code: code })
  if (statusError) throw statusError
  const statusById = Object.fromEntries((statuses ?? []).map(s => [s.lesson_id, s]))

  const modules = [...(course.modules ?? [])]
    .sort((a, b) => a.position - b.position)
    .map(m => ({
      ...m,
      lessons: [...(m.lessons ?? [])]
        .filter(l => l.status === 'published')
        .sort((a, b) => a.position - b.position)
        .map(l => ({
          ...l,
          state: statusById[l.id]?.status ?? 'locked',
          bestScore: statusById[l.id]?.best_score ?? null,
        })),
    }))

  const lessons = modules.flatMap(m => m.lessons)
  const done = lessons.filter(l => l.state === 'done').length
  const next = lessons.find(l => l.state === 'open') ?? null
  return { ...course, modules, lessons, done, total: lessons.length, next }
}
