import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { supabase } from '../lib/supabase.js'
import { currentCourseCode, languageOf } from '../lib/course.js'

// ---------- Floating Nate: a small help chat (text only) for signed-in students on the learning pages ----------
// Knows the course, the next lesson and the exercise on screen (the lesson page announces it with the
// "nassau:step" event). Answers come from the "nate" edge function; the greeting is free.

// The lesson page tells Nate which exercise is on screen.
export function announceStep(lessonId, stepId) {
  try { window.dispatchEvent(new CustomEvent('nassau:step', { detail: { lessonId, stepId } })) } catch { /* old browser */ }
}

const TEXT = {
  en: { title: 'Nate · your helper', placeholder: 'Ask Nate a question…', send: 'Send', open: 'Chat with Nate', close: 'Close',
        thinking: 'Nate is typing…', error: 'Sorry, something went wrong. Please try again.',
        chips: ['How do I unlock the next lesson?', 'How does the microphone work?'], explain: 'Explain this exercise' },
  nl: { title: 'Nate · tu ayudante', placeholder: 'Pregúntale a Nate… · Ask Nate…', send: 'Enviar', open: 'Hablar con Nate · Chat with Nate', close: 'Cerrar · Close',
        thinking: 'Nate está escribiendo… · typing…', error: 'Algo salió mal. Inténtalo otra vez. · Please try again.',
        chips: ['¿Cómo abro la siguiente lección?', '¿Cómo funciona el micrófono?'], explain: 'Explícame este ejercicio' },
  es: { title: 'Nate · je hulp', placeholder: 'Stel Nate een vraag… · Ask Nate…', send: 'Sturen', open: 'Chat met Nate · Chat with Nate', close: 'Sluiten · Close',
        thinking: 'Nate typt… · typing…', error: 'Er ging iets mis. Probeer het opnieuw. · Please try again.',
        chips: ['Hoe open ik de volgende les?', 'Hoe werkt de microfoon?'], explain: 'Leg deze oefening uit' },
}

async function callNate(body) {
  const { data, error } = await supabase.functions.invoke('nate', { body })
  if (error) {
    let msg = error.message
    try { const j = await error.context?.json?.(); if (j?.error) msg = j.error } catch { /* keep message */ }
    throw new Error(msg)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

const readSeen = () => { try { return sessionStorage.getItem('nassau:nateSeen') === '1' } catch { return false } }
const saveSeen = () => { try { sessionStorage.setItem('nassau:nateSeen', '1') } catch { /* private mode */ } }

export default function NateBubble() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const onLearn = pathname.startsWith('/learn')
  const lessonId = (pathname.match(/^\/learn\/lesson\/([0-9a-f-]{36})/) || [])[1] || null
  const [course, setCourse] = useState(currentCourseCode())
  const [stepId, setStepId] = useState(null)
  const [open, setOpen] = useState(false)
  const [peek, setPeek] = useState(false)          // the small greeting balloon next to the button
  const [messages, setMessages] = useState([])     // { role: 'nate' | 'student', text, action? }
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const chatRef = useRef(null)
  const inputRef = useRef(null)
  const lang = languageOf(course)
  const T = TEXT[lang] || TEXT.en

  // follow the course chosen in the hub, and the exercise on the lesson page
  useEffect(() => {
    const onCourse = (e) => setCourse(e.detail || currentCourseCode())
    const onStep = (e) => setStepId(e.detail?.stepId || null)
    window.addEventListener('nassau:course', onCourse)
    window.addEventListener('nassau:step', onStep)
    return () => { window.removeEventListener('nassau:course', onCourse); window.removeEventListener('nassau:step', onStep) }
  }, [])
  useEffect(() => { if (!lessonId) setStepId(null) }, [lessonId])

  // a new course = a new conversation
  const [greetFor, setGreetFor] = useState('')
  useEffect(() => { setMessages([]); setGreetFor('') }, [course])

  // a fresh greeting whenever the course or the page (hub / lesson) changes, as long as no conversation started
  const context = `${course}|${lessonId || ''}`
  useEffect(() => {
    if (!user || !onLearn) return
    if (messages.some(m => m.role === 'student')) return
    if (greetFor === context) return
    let alive = true
    callNate({ greet: true, course_code: course, lesson_id: lessonId })
      .then(r => {
        if (!alive) return
        setMessages([{ role: 'nate', text: r.reply, action: r.action }])
        setGreetFor(context)
      })
      .catch(() => { /* Nate stays quiet if the greeting fails */ })
    return () => { alive = false }
  }, [user?.id, onLearn, context, greetFor]) // eslint-disable-line react-hooks/exhaustive-deps

  // once per visit: show the greeting as a small balloon next to the button
  const hasGreeting = messages.length > 0 && messages[0].role === 'nate'
  useEffect(() => {
    if (!hasGreeting || open || readSeen()) return
    const t = setTimeout(() => setPeek(true), 1200)
    return () => clearTimeout(t)
  }, [hasGreeting, open])

  useEffect(() => { const el = chatRef.current; if (el) el.scrollTop = el.scrollHeight }, [messages, busy, open])
  useEffect(() => { if (open) { setPeek(false); saveSeen(); setTimeout(() => inputRef.current?.focus(), 50) } }, [open])

  if (!user || !onLearn) return null

  const ask = async (q) => {
    const t = String(q ?? text).trim()
    if (!t || busy) return
    const next = [...messages, { role: 'student', text: t }]
    setMessages(next); setText(''); setBusy(true); setError('')
    try {
      const r = await callNate({
        messages: next.map(({ role, text }) => ({ role, text })),
        course_code: course, lesson_id: lessonId, step_id: stepId,
      })
      setMessages(m => [...m, { role: 'nate', text: r.reply, action: r.action }])
    } catch {
      setError(T.error)
    } finally { setBusy(false) }
  }

  const chips = messages.some(m => m.role === 'student') ? [] : (lessonId && stepId ? [T.explain, ...T.chips.slice(0, 1)] : T.chips)
  const first = messages[0]

  return (
    <div className="nate">
      {open && (
        <section className="nate-panel" role="dialog" aria-label={T.title}>
          <header className="nate-head">
            <span className="nate-av" aria-hidden="true">N</span>
            <strong>{T.title}</strong>
            <button type="button" className="nate-x" onClick={() => setOpen(false)} aria-label={T.close}>×</button>
          </header>
          <div className="nate-chat" ref={chatRef} aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`nate-msg ${m.role === 'nate' ? 'them' : 'me'}`}>
                <span>{m.text}</span>
                {m.action && <Link className="nate-go" to={m.action.to} onClick={() => setOpen(false)}>{m.action.label} →</Link>}
              </div>
            ))}
            {busy && <div className="nate-msg them nate-typing" aria-label={T.thinking}><i /><i /><i /></div>}
            {error && <div className="nate-err" role="alert">{error}</div>}
          </div>
          {chips.length > 0 && (
            <div className="nate-chips">
              {chips.map(c => <button type="button" key={c} onClick={() => ask(c)} disabled={busy}>{c}</button>)}
            </div>
          )}
          <form className="nate-bar" onSubmit={(e) => { e.preventDefault(); ask() }}>
            <input ref={inputRef} value={text} onChange={e => setText(e.target.value)} placeholder={T.placeholder}
                   maxLength={400} autoComplete="off" aria-label={T.placeholder} disabled={busy} />
            <button type="submit" disabled={busy || !text.trim()} aria-label={T.send}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" /></svg>
            </button>
          </form>
        </section>
      )}

      {!open && peek && first && (
        <div className="nate-peek">
          <button type="button" className="nate-peek-x" onClick={() => { setPeek(false); saveSeen() }} aria-label={T.close}>×</button>
          <button type="button" className="nate-peek-text" onClick={() => setOpen(true)}>{first.text.split('\n')[0]}</button>
        </div>
      )}

      <button type="button" className={`nate-btn${open ? ' on' : ''}`} onClick={() => setOpen(o => !o)}
              aria-expanded={open} aria-label={open ? T.close : T.open} title={T.open}>
        {open
          ? <span aria-hidden="true" className="nate-btn-x">×</span>
          : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm3 6.5a1.5 1.5 0 1 0 0 .01zm5 0a1.5 1.5 0 1 0 0 .01zm5 0a1.5 1.5 0 1 0 0 .01z" /></svg>}
      </button>
    </div>
  )
}
