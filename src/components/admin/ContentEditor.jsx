import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../lib/auth.jsx'
import {
  loadAdminCourse, loadSteps, saveLesson, saveModule, deleteStep, moveStep, addStep, NEW_STEP_TYPES,
} from '../../lib/adminApi.js'
import { videoEmbedUrl } from '../Media.jsx'
import StepEditor from './StepEditor.jsx'
import { listCourses } from '../../lib/course.js'

export default function ContentEditor() {
  const { isAdmin } = useAuth()
  const [course, setCourse] = useState(null)
  const [lessonId, setLessonId] = useState(null)
  const [error, setError] = useState('')
  const [courses, setCourses] = useState([])
  const [code, setCode] = useState('en-a1-1')

  useEffect(() => { listCourses().then(setCourses).catch(() => {}) }, [])
  const reload = useCallback(() => loadAdminCourse(code).then(c => {
    setCourse(c)
    setLessonId(id => (id && c?.modules?.some(m => m.lessons.some(l => l.id === id))) ? id : (c?.modules?.[0]?.lessons?.[0]?.id ?? null))
  }).catch(e => setError(e.message)), [code])
  useEffect(() => { reload() }, [reload])

  if (error) return <p className="error">{error}</p>
  if (!course) return <p className="muted">Loading…</p>
  const lesson = course.modules.flatMap(m => m.lessons.map(l => ({ ...l, module: m }))).find(l => l.id === lessonId)

  return (
    <div className="cms">
      <aside className="cms-nav card">
        {courses.length > 1 && (
          <label className="small strong">Course
            <select value={code} onChange={e => setCode(e.target.value)}>
              {courses.map(c => <option key={c.code} value={c.code}>{c.title}{c.status !== 'published' ? ' (draft)' : ''}</option>)}
            </select>
          </label>
        )}
        {course.modules.map(m => (
          <div key={m.id} className="cms-module">
            <p className="small strong">Module {m.position} · {m.title}</p>
            <ul>
              {m.lessons.map(l => (
                <li key={l.id}>
                  <button className={`cms-link ${l.id === lessonId ? 'active' : ''}`} onClick={() => setLessonId(l.id)}>
                    {l.position}. {l.title}{l.status !== 'published' ? ' (draft)' : ''}
                    {l.needs_video && !l.video_url ? <span className="dot" title="Video missing" /> : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>
      <section className="cms-main">
        {!isAdmin && <p className="notice">Read-only view (checker account).</p>}
        {lesson && <LessonPanel key={lesson.id} lesson={lesson} readOnly={!isAdmin} onSaved={reload} />}
      </section>
    </div>
  )
}

function LessonPanel({ lesson, readOnly, onSaved }) {
  const [f, setF] = useState(() => pick(lesson))
  const [mod, setMod] = useState({ title: lesson.module.title, description: lesson.module.description ?? '' })
  const [msg, setMsg] = useState('')
  const [steps, setSteps] = useState(null)
  const [editing, setEditing] = useState(null)
  const [newType, setNewType] = useState(NEW_STEP_TYPES[0].type)
  const [busy, setBusy] = useState(false)

  const refreshSteps = useCallback(() => loadSteps(lesson.id).then(setSteps), [lesson.id])
  useEffect(() => { refreshSteps() }, [refreshSteps])

  const set = (k, v) => setF(x => ({ ...x, [k]: v }))
  const save = async () => {
    setMsg('')
    try {
      await saveLesson(lesson.id, { ...f, minutes: f.minutes ? Number(f.minutes) : null, pass_mark: Number(f.pass_mark) || 70, video_url: f.video_url?.trim() || null })
      if (mod.title !== lesson.module.title || mod.description !== (lesson.module.description ?? '')) await saveModule(lesson.module.id, mod)
      setMsg('Saved.'); onSaved?.()
    } catch (e) { setMsg(e.message) }
  }
  const run = async (fn) => { setBusy(true); try { await fn(); await refreshSteps() } catch (e) { alertMsg(e) } finally { setBusy(false) } }
  const alertMsg = (e) => setMsg(e.message)

  const add = () => run(async () => {
    const t = NEW_STEP_TYPES.find(x => x.type === newType)
    const id = await addStep(lesson.id, t.type, `New: ${t.label}`, t.content)
    setEditing(id)
  })
  const remove = (s) => {
    if (!window.confirm(`Delete exercise ${s.position} “${s.title}”? This cannot be undone.`)) return
    run(() => deleteStep(s.id))
  }

  const videoOk = !f.video_url || videoEmbedUrl(f.video_url) || /\.(mp4|webm)(\?|$)/i.test(f.video_url)

  return (
    <div className="stack">
      <div className="card form">
        <div className="row spread">
          <h2 className="h3">Lesson {lesson.position} · {lesson.title}</h2>
          <Link className="btn btn-ghost btn-sm" to={`/learn/lesson/${lesson.id}?preview=1`}>Preview as student</Link>
        </div>
        <fieldset className="fieldset" disabled={readOnly}>
          <legend>Module {lesson.module.position}</legend>
          <label>Module title<input value={mod.title} onChange={e => setMod(m => ({ ...m, title: e.target.value }))} /></label>
          <label>Module description<textarea rows={2} value={mod.description} onChange={e => setMod(m => ({ ...m, description: e.target.value }))} /></label>
        </fieldset>
        <fieldset className="fieldset" disabled={readOnly}>
          <legend>Lesson</legend>
          <div className="grid-2">
            <label>Title<input value={f.title} onChange={e => set('title', e.target.value)} /></label>
            <label>Status
              <select value={f.status} onChange={e => set('status', e.target.value)}>
                <option value="published">Published</option><option value="draft">Draft (hidden)</option>
              </select>
            </label>
          </div>
          <label>Goal (“By the end of this lesson, you can…”)<input value={f.objective} onChange={e => set('objective', e.target.value)} /></label>
          <label>Text (English)<textarea rows={3} value={f.content} onChange={e => set('content', e.target.value)} /></label>
          <label>Text (Spanish)<textarea rows={3} value={f.content_es} onChange={e => set('content_es', e.target.value)} /></label>
          <label>Spanish-speaker tip<textarea rows={2} value={f.tip} onChange={e => set('tip', e.target.value)} /></label>
          <div className="grid-2">
            <label>Minutes<input type="number" min="0" value={f.minutes} onChange={e => set('minutes', e.target.value)} /></label>
            <label>Pass mark %<input type="number" min="0" max="100" value={f.pass_mark} onChange={e => set('pass_mark', e.target.value)} /></label>
          </div>
          <label>Story video link (Bunny Stream, YouTube, Vimeo or .mp4)
            <input value={f.video_url} placeholder="https://iframe.mediadelivery.net/embed/…" onChange={e => set('video_url', e.target.value)} />
            {!videoOk && <span className="error small">This link is not a Bunny Stream, YouTube, Vimeo or .mp4 link.</span>}
          </label>
          <label className="check"><input type="checkbox" checked={f.needs_video} onChange={e => set('needs_video', e.target.checked)} />
            <span>This lesson needs a video (shows as missing until a link is added)</span></label>
        </fieldset>
        {!readOnly && (
          <div className="row">
            <button className="btn btn-primary" onClick={save}>Save lesson</button>
            {msg && <span className={msg === 'Saved.' ? 'success' : 'error'}>{msg}</span>}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="h3">Exercises ({steps?.length ?? '…'})</h3>
        {!steps ? <p className="muted">Loading…</p> : (
          <ol className="step-list">
            {steps.map((s, i) => (
              <li key={s.id} className={`step-item ${s.status !== 'published' ? 'is-draft' : ''}`}>
                <div className="step-row">
                  <span className="step-pos">{s.position}</span>
                  <span className="step-main">
                    <span className="step-title">{s.title || '(no title)'}</span>
                    <span className="small muted">
                      {s.type}{s.status !== 'published' ? ' · draft' : ''}
                      {s.needs_audio ? (s.content?.audio_url ? ' · 🔊 audio' : ' · 🔇 audio missing') : ''}
                    </span>
                  </span>
                  {!readOnly && (
                    <span className="step-actions">
                      <button className="btn btn-ghost btn-sm" aria-label="Move up" disabled={busy || i === 0} onClick={() => run(() => moveStep(s.id, -1))}>↑</button>
                      <button className="btn btn-ghost btn-sm" aria-label="Move down" disabled={busy || i === steps.length - 1} onClick={() => run(() => moveStep(s.id, 1))}>↓</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditing(editing === s.id ? null : s.id)}>{editing === s.id ? 'Close' : 'Edit'}</button>
                      <button className="btn btn-ghost btn-sm danger" disabled={busy} onClick={() => remove(s)}>Delete</button>
                    </span>
                  )}
                </div>
                {editing === s.id && (
                  <StepEditor step={s} onSaved={refreshSteps} onCancel={() => setEditing(null)} />
                )}
              </li>
            ))}
          </ol>
        )}
        {!readOnly && (
          <div className="row add-row">
            <select value={newType} onChange={e => setNewType(e.target.value)}>
              {NEW_STEP_TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
            </select>
            <button className="btn btn-primary" disabled={busy} onClick={add}>Add exercise</button>
            <span className="hint">New exercises start as Draft; publish them when ready.</span>
          </div>
        )}
      </div>
    </div>
  )
}

function pick(l) {
  return {
    title: l.title ?? '', status: l.status ?? 'draft', objective: l.objective ?? '', content: l.content ?? '',
    content_es: l.content_es ?? '', tip: l.tip ?? '', minutes: l.minutes ?? '', pass_mark: l.pass_mark ?? 70,
    video_url: l.video_url ?? '', needs_video: l.needs_video ?? true,
  }
}
