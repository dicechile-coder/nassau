import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { loadCourse, listCourses, currentCourseCode, setCurrentCourse, languageOf } from '../lib/course.js'
import { Loading } from '../components/Guards.jsx'
import StreakBar from '../components/StreakBar.jsx'
import { myProgress, syncTimezone } from '../lib/progressApi.js'

const stateLabel = { done: 'Done', open: 'Open', locked: 'Locked' }

export default function Hub() {
  const { profile, isStaff } = useAuth()
  const [course, setCourse] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [prog, setProg] = useState(null)
  const [courses, setCourses] = useState([])
  const [code, setCode] = useState(currentCourseCode())

  useEffect(() => {
    listCourses().then(setCourses).catch(() => {})
    myProgress().then(setProg).catch(() => {})
  }, [])
  useEffect(() => {
    setLoading(true); setError('')
    loadCourse(code).then(c => {
      if (!c && code !== 'en-a1-1') { setCode('en-a1-1'); setCurrentCourse('en-a1-1'); return }
      setCourse(c)
    }).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [code])
  const pick = (c) => { setCurrentCourse(c); setCode(c) }
  useEffect(() => { if (profile) syncTimezone(profile) }, [profile?.id])

  if (loading) return <Loading />
  if (error) return <main className="page"><p className="error">Could not load the course: {error}</p></main>
  if (!course) return <main className="page"><p>The course is not available yet.</p></main>

  const pct = course.total ? Math.round((course.done / course.total) * 100) : 0
  return (
    <main className="page">
      {courses.length > 1 && (
        <div className="tabs course-tabs" role="tablist" aria-label="Your courses">
          {courses.map(c => (
            <button key={c.code} role="tab" aria-selected={c.code === course.code} className={`tab course-tab tab-${languageOf(c.code)} ${c.code === course.code ? 'active' : ''}`} onClick={() => pick(c.code)}>
              {c.title}{c.status !== 'published' ? ' (draft)' : ''}
            </button>
          ))}
        </div>
      )}
      <section className="card hub-top">
        <p className="eyebrow">{course.title}</p>
        <h1 className="h2">Welcome{profile?.preferred_name ? `, ${profile.preferred_name}` : ''}!</h1>
        <StreakBar p={prog} />
        <div className="progress" aria-label={`${pct}% complete`}><div style={{ width: `${pct}%` }} /></div>
        <p className="muted small">{course.done} of {course.total} lessons completed · {pct}%</p>
        {course.next && (
          <Link className="btn btn-primary" to={`/learn/lesson/${course.next.id}`}>
            {course.done === 0 ? 'Start' : 'Continue'}: {course.next.title}
          </Link>
        )}
        <Link className="small" to="/learn/progress">See my progress →</Link>
        {isStaff && <p className="small muted">You are staff: open any lesson in preview from the Admin area.</p>}
      </section>

      {course.modules.map(m => (
        <section key={m.id} className="module">
          <h2 className="h3">Module {m.position} · {m.title}</h2>
          {m.description && <p className="muted small">{m.description}</p>}
          <ol className="lessons">
            {m.lessons.map(l => {
              const inner = (
                <>
                  <span className={`badge badge-${l.state}`}>{stateLabel[l.state]}</span>
                  <span className="lesson-title">Lesson {l.position} · {l.title}{l.is_checkpoint ? ' (checkpoint)' : ''}</span>
                  {l.bestScore != null && <span className="muted small">{l.bestScore}%</span>}
                </>
              )
              return (
                <li key={l.id} className={`lesson lesson-${l.state}`}>
                  {l.state === 'locked'
                    ? <div className="lesson-row" title="Pass the previous lesson to unlock">{inner}</div>
                    : <Link className="lesson-row" to={`/learn/lesson/${l.id}`}>{inner}</Link>}
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </main>
  )
}
