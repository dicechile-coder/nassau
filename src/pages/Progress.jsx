import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadCourse } from '../lib/course.js'
import { myProgress, myLessonProgress } from '../lib/progressApi.js'
import { Loading } from '../components/Guards.jsx'
import StreakBar from '../components/StreakBar.jsx'

export default function Progress() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([myProgress(), loadCourse(), myLessonProgress()])
      .then(([p, course, lp]) => setData({ p, course, lp }))
      .catch(e => setError(e.message))
  }, [])

  if (error) return <main className="page"><p className="error">{error}</p></main>
  if (!data) return <Loading />
  const { p, course, lp } = data
  const passed = course?.lessons.filter(l => lp[l.id]?.passed).length ?? 0

  return (
    <main className="page">
      <p className="small"><Link to="/learn">← Learning hub</Link></p>
      <h1 className="h2">My progress</h1>
      <StreakBar p={p} />

      <div className="grid stats-grid">
        <Stat label="Total XP" value={p.xp} />
        <Stat label="XP this week" value={p.xp_week} />
        <Stat label="Current streak" value={`${p.streak} ${p.streak === 1 ? 'day' : 'days'}`} />
        <Stat label="Best streak" value={`${p.streak_best} ${p.streak_best === 1 ? 'day' : 'days'}`} />
        <Stat label="Lessons passed" value={`${passed} / ${course?.total ?? 0}`} />
      </div>

      <section className="card">
        <h2 className="h3">Last 4 weeks</h2>
        <Calendar days={p.days} today={p.today} freezeDay={p.freeze_day} />
        <p className="small muted">A green square is a day you practised. Missed one day? Your weekly streak freeze (🧊) keeps your streak alive — once per week.</p>
      </section>

      <section className="card">
        <h2 className="h3">How to earn XP</h2>
        <ul className="small xp-rules">
          <li>Correct answer: <strong>10 XP</strong> (5 XP on your second try)</li>
          <li>Finish an AI conversation: <strong>10 XP</strong></li>
          <li>Pass a lesson: <strong>50 XP</strong> · perfect score: <strong>+20 XP</strong></li>
          <li>XP is given once per exercise — practising again keeps your streak but gives no extra XP.</li>
        </ul>
      </section>

      {course?.modules.map(m => (
        <section key={m.id} className="module">
          <h2 className="h3">Module {m.position} · {m.title}</h2>
          <table className="table">
            <thead><tr><th>Lesson</th><th>Best score</th><th>Attempts</th><th>Passed on</th></tr></thead>
            <tbody>
              {m.lessons.map(l => {
                const r = lp[l.id]
                return (
                  <tr key={l.id}>
                    <td>{l.position}. {l.title}</td>
                    <td>{r?.best_score != null ? `${r.best_score}%` : '—'}</td>
                    <td>{r?.attempts ?? 0}</td>
                    <td>{r?.passed && r.completed_at ? new Date(r.completed_at).toLocaleDateString() : l.state === 'locked' ? 'Locked' : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      ))}
    </main>
  )
}

function Stat({ label, value }) {
  return <div className="card stat"><div className="muted small">{label}</div><div className="stat-value">{value}</div></div>
}

// 28 days, oldest first, in rows of 7
function Calendar({ days, today, freezeDay }) {
  const byDay = Object.fromEntries((days ?? []).map(d => [d.day, d]))
  const end = new Date(`${today}T12:00:00`)
  const cells = []
  for (let i = 27; i >= 0; i--) {
    const d = new Date(end); d.setDate(end.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const a = byDay[key]
    const cls = a ? 'on' : key === freezeDay ? 'freeze' : ''
    const label = `${d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}: ${a ? `${a.xp} XP, ${a.steps} exercises` : key === freezeDay ? 'streak freeze used' : 'no practice'}`
    cells.push(<span key={key} className={`cal-day ${cls} ${key === today ? 'today' : ''}`} title={label} aria-label={label}>{key === freezeDay && !a ? '🧊' : ''}</span>)
  }
  return <div className="calendar">{cells}</div>
}
