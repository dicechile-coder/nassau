import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import ContentEditor from '../components/admin/ContentEditor.jsx'
import { adminStudents, adminStudentDetail, adminSetAi } from '../lib/progressApi.js'
import { loadCourse } from '../lib/course.js'

const TABS = ['Overview', 'Content', 'Students', 'AI settings']

export default function Admin() {
  const [tab, setTab] = useState('Overview')
  return (
    <main className="page wide">
      <h1 className="h2">Admin</h1>
      <div className="tabs" role="tablist">
        {TABS.map(t => (
          <button key={t} role="tab" aria-selected={tab === t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'Overview' && <Overview />}
      {tab === 'Content' && <ContentEditor />}
      {tab === 'Students' && <Students />}
      {tab === 'AI settings' && <AiSettings />}
    </main>
  )
}

function Overview() {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    (async () => {
      const [lessons, students, ai, steps] = await Promise.all([
        supabase.from('lessons').select('id, status, needs_video, video_url'),
        supabase.from('profiles').select('id, role'),
        supabase.from('app_settings').select('value').eq('key', 'ai').maybeSingle(),
        supabase.from('steps').select('id, status, needs_audio, audio:content->>audio_url'),
      ])
      const st = steps.data ?? []
      const ls = lessons.data ?? []
      setStats({
        lessons: ls.length,
        published: ls.filter(l => l.status === 'published').length,
        missingVideo: ls.filter(l => l.needs_video && !l.video_url).length,
        exercises: st.length,
        drafts: st.filter(x => x.status !== 'published').length,
        missingAudio: st.filter(x => x.needs_audio && !x.audio).length,
        students: (students.data ?? []).filter(p => p.role === 'student').length,
        ai: ai.data?.value,
      })
    })()
  }, [])
  if (!stats) return <p className="muted">Loading…</p>
  const t = stats.ai?.last_test
  return (
    <div className="grid">
      <Stat label="Lessons" value={stats.lessons} />
      <Stat label="Published" value={stats.published} />
      <Stat label="Exercises" value={stats.exercises} />
      <Stat label="Draft exercises" value={stats.drafts} />
      <Stat label="Missing video" value={stats.missingVideo} />
      <Stat label="Missing audio" value={stats.missingAudio} />
      <Stat label="Students" value={stats.students} />
      <Stat label="AI model" value={stats.ai?.model ?? '—'} small />
      <Stat label="AI connection" value={t ? (t.ok ? 'OK' : 'Failed') : 'Not tested'} small />
    </div>
  )
}

function Stat({ label, value, small }) {
  return <div className="card stat"><div className="muted small">{label}</div><div className={small ? 'stat-small' : 'stat-value'}>{value}</div></div>
}

function Students() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(null)
  const [q, setQ] = useState('')
  const load = () => adminStudents().then(setRows).catch(e => setError(e.message))
  useEffect(() => { load() }, [])
  if (error) return <p className="error">{error}</p>
  if (!rows) return <p className="muted">Loading…</p>
  if (open) return <StudentDetail student={rows.find(r => r.id === open)} onBack={() => { setOpen(null); load() }} />
  const list = rows.filter(r => !q || `${r.full_name} ${r.email}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="stack">
      <input className="search" placeholder="Search name or email" value={q} onChange={e => setQ(e.target.value)} />
      <table className="table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>XP</th><th>Streak</th><th>Lessons passed</th><th>Last active</th><th>AI today</th><th></th></tr></thead>
        <tbody>
          {list.map(r => (
            <tr key={r.id}>
              <td>{r.full_name || r.preferred_name || '—'}</td>
              <td className="small">{r.email}</td>
              <td>{r.role}</td>
              <td>{r.xp}</td>
              <td>{r.streak > 0 ? `🔥 ${r.streak}` : '—'}</td>
              <td>{r.lessons_passed}</td>
              <td>{r.last_active ?? '—'}</td>
              <td>{r.ai_today}{r.ai_unlimited ? ' (unlimited)' : r.ai_bonus ? ` (+${r.ai_bonus})` : ''}</td>
              <td><button className="btn btn-ghost btn-sm" onClick={() => setOpen(r.id)}>Open</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="small muted">{list.length} of {rows.length} accounts</p>
    </div>
  )
}

function StudentDetail({ student: s, onBack }) {
  const { isAdmin } = useAuth()
  const [d, setD] = useState(null)
  const [course, setCourse] = useState(null)
  const [bonus, setBonus] = useState(s.ai_bonus ?? 0)
  const [unlimited, setUnlimited] = useState(!!s.ai_unlimited)
  const [msg, setMsg] = useState('')
  useEffect(() => {
    adminStudentDetail(s.id).then(setD).catch(e => setMsg(e.message))
    loadCourse().then(setCourse).catch(() => {})
  }, [s.id])

  const save = async () => {
    setMsg('')
    try { await adminSetAi(s.id, Number(bonus) || 0, unlimited); setMsg('Saved.') } catch (e) { setMsg(e.message) }
  }

  return (
    <div className="stack">
      <p className="small"><button className="linkish" onClick={onBack}>← All students</button></p>
      <h2 className="h3">{s.full_name || s.preferred_name || s.email}</h2>
      <p className="small muted">{s.email} · {s.role} · {s.country || 'no country'} · joined {new Date(s.created_at).toLocaleDateString()}</p>
      <div className="grid">
        <Stat label="XP" value={s.xp} />
        <Stat label="Streak" value={s.streak} />
        <Stat label="Lessons passed" value={s.lessons_passed} />
        <Stat label="Last active" value={s.last_active ?? '—'} small />
      </div>

      <section className="card form">
        <h3 className="h3">AI allowance</h3>
        <label>Extra AI messages per day (on top of the normal limit)
          <input type="number" min="0" value={bonus} disabled={!isAdmin} onChange={e => setBonus(e.target.value)} />
        </label>
        <label className="check"><input type="checkbox" checked={unlimited} disabled={!isAdmin} onChange={e => setUnlimited(e.target.checked)} />
          <span>Unlimited AI for this student</span></label>
        {isAdmin && <div className="row"><button className="btn btn-primary" onClick={save}>Save allowance</button>
          {msg && <span className={msg === 'Saved.' ? 'success' : 'error'}>{msg}</span>}</div>}
        {d && <p className="small muted">AI use, last days: {d.usage.length ? d.usage.map(u => `${u.day} ${u.kind} ${u.count}`).join(' · ') : 'none'}</p>}
      </section>

      <section className="card">
        <h3 className="h3">Lessons</h3>
        {!d || !course ? <p className="muted">Loading…</p> : (
          <table className="table">
            <thead><tr><th>Lesson</th><th>Best</th><th>Attempts</th><th>Passed</th></tr></thead>
            <tbody>
              {course.modules.flatMap(m => m.lessons.map(l => {
                const r = d.progress[l.id]
                return (
                  <tr key={l.id}>
                    <td>M{m.position} L{l.position} · {l.title}</td>
                    <td>{r?.best_score != null ? `${r.best_score}%` : '—'}</td>
                    <td>{r?.attempts ?? 0}</td>
                    <td>{r?.passed ? '✔' : '—'}</td>
                  </tr>
                )
              }))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h3 className="h3">Recent AI activity</h3>
        {!d ? <p className="muted">Loading…</p> : d.logs.length === 0 ? <p className="muted small">No AI use yet.</p> : (
          <ul className="ai-log">
            {d.logs.map(l => (
              <li key={l.id}>
                <span className="small muted">{new Date(l.created_at).toLocaleString()} · {l.kind === 'mark' ? 'Writing marked' : 'Role-play'}</span>
                {l.kind === 'mark'
                  ? <p className="small">“{l.input?.text}” → {l.output?.scores ? `${Object.values(l.output.scores).reduce((a, b) => a + (Number(b) || 0), 0)}/8` : l.output?.reason ?? ''}</p>
                  : <p className="small">Last message: “{(l.input?.messages ?? []).filter(m => m.role === 'user').slice(-1)[0]?.content ?? ''}” → {l.output?.reply ?? ''}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function AiSettings() {
  const { isAdmin } = useAuth()
  const [settings, setSettings] = useState(null)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState('')

  const load = () => supabase.from('app_settings').select('value').eq('key', 'ai').maybeSingle()
    .then(({ data }) => setSettings(data?.value ?? {}))
  useEffect(() => { load() }, [])

  if (!settings) return <p className="muted">Loading…</p>
  const set = (k, v) => setSettings(s => ({ ...s, [k]: v }))

  const save = async () => {
    setSaving(true); setMessage('')
    const { error } = await supabase.from('app_settings')
      .update({ value: settings, updated_at: new Date().toISOString() }).eq('key', 'ai')
    setSaving(false)
    setMessage(error ? `Could not save: ${error.message}` : 'Saved.')
  }

  const test = async () => {
    setTesting(true); setMessage('')
    const { data, error } = await supabase.functions.invoke('ai-test', { body: {} })
    setTesting(false)
    if (error) setMessage(`Test could not run: ${error.message}. Is the ai-test function deployed?`)
    await load()
    if (data) setMessage(data.ok ? 'Connection OK.' : `Connection failed: ${data.message}`)
  }

  const t = settings.last_test
  return (
    <div className="card form">
      <label>Provider
        <select value={settings.provider ?? 'openrouter'} disabled onChange={() => {}}>
          <option value="openrouter">OpenRouter</option>
        </select>
      </label>
      <label>Model
        <input value={settings.model ?? ''} disabled={!isAdmin} onChange={e => set('model', e.target.value)} placeholder="google/gemini-2.5-flash" />
        <span className="hint">Use the exact model name from openrouter.ai/models. Save before testing.</span>
      </label>
      <label>Tutor messages per student per day
        <input type="number" min="0" value={settings.daily_tutor_limit ?? 20} disabled={!isAdmin} onChange={e => set('daily_tutor_limit', Number(e.target.value))} />
      </label>
      <label>AI marking checks per student per day
        <input type="number" min="0" value={settings.daily_marking_limit ?? 30} disabled={!isAdmin} onChange={e => set('daily_marking_limit', Number(e.target.value))} />
      </label>
      <div className="row">
        {isAdmin && <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>}
        {isAdmin && <button className="btn btn-ghost" onClick={test} disabled={testing}>{testing ? 'Testing…' : 'Test connection'}</button>}
      </div>
      {message && <p className={message.startsWith('Connection OK') || message === 'Saved.' ? 'success' : 'error'}>{message}</p>}
      <p className="small muted">
        Last test: {t ? `${t.ok ? 'OK' : 'Failed'} · ${t.model} · ${new Date(t.at).toLocaleString()} · ${t.message}` : 'never'}
      </p>
      <p className="small muted">The API key is stored as a secret in Supabase and is never shown here.</p>
    </div>
  )
}
