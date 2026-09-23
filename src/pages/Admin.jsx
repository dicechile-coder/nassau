import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import { loadCourse } from '../lib/course.js'

const TABS = ['Overview', 'Content', 'Students', 'AI settings']

export default function Admin() {
  const [tab, setTab] = useState('Overview')
  return (
    <main className="page">
      <h1 className="h2">Admin</h1>
      <div className="tabs" role="tablist">
        {TABS.map(t => (
          <button key={t} role="tab" aria-selected={tab === t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'Overview' && <Overview />}
      {tab === 'Content' && <Content />}
      {tab === 'Students' && <Students />}
      {tab === 'AI settings' && <AiSettings />}
    </main>
  )
}

function Overview() {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    (async () => {
      const [lessons, students, ai] = await Promise.all([
        supabase.from('lessons').select('id, status, needs_video, video_url'),
        supabase.from('profiles').select('id, role'),
        supabase.from('app_settings').select('value').eq('key', 'ai').maybeSingle(),
      ])
      const ls = lessons.data ?? []
      setStats({
        lessons: ls.length,
        published: ls.filter(l => l.status === 'published').length,
        missingVideo: ls.filter(l => l.needs_video && !l.video_url).length,
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
      <Stat label="Missing video" value={stats.missingVideo} />
      <Stat label="Students" value={stats.students} />
      <Stat label="AI model" value={stats.ai?.model ?? '—'} small />
      <Stat label="AI connection" value={t ? (t.ok ? 'OK' : 'Failed') : 'Not tested'} small />
    </div>
  )
}

function Stat({ label, value, small }) {
  return <div className="card stat"><div className="muted small">{label}</div><div className={small ? 'stat-small' : 'stat-value'}>{value}</div></div>
}

function Content() {
  const [course, setCourse] = useState(null)
  useEffect(() => { loadCourse().then(setCourse) }, [])
  if (!course) return <p className="muted">Loading…</p>
  return (
    <div>
      <p className="muted small">Editing arrives in Round 3. Use Preview to open any lesson without changing progress.</p>
      {course.modules.map(m => (
        <section key={m.id} className="module">
          <h2 className="h3">Module {m.position} · {m.title}</h2>
          <table className="table">
            <thead><tr><th>#</th><th>Lesson</th><th>Minutes</th><th></th></tr></thead>
            <tbody>
              {m.lessons.map(l => (
                <tr key={l.id}>
                  <td>{l.position}</td>
                  <td>{l.title}{l.is_checkpoint ? ' (checkpoint)' : ''}</td>
                  <td>{l.minutes ?? '—'}</td>
                  <td><Link to={`/learn/lesson/${l.id}?preview=1`}>Preview</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  )
}

function Students() {
  const [rows, setRows] = useState(null)
  useEffect(() => {
    supabase.from('profiles').select('id, full_name, role, country, created_at').order('created_at', { ascending: false })
      .then(({ data }) => setRows(data ?? []))
  }, [])
  if (!rows) return <p className="muted">Loading…</p>
  return (
    <table className="table">
      <thead><tr><th>Name</th><th>Role</th><th>Country</th><th>Joined</th></tr></thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.id}>
            <td>{r.full_name || '—'}</td><td>{r.role}</td><td>{r.country || '—'}</td>
            <td>{new Date(r.created_at).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
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
