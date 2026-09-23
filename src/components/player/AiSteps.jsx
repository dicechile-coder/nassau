import { useEffect, useRef, useState } from 'react'
import { aiChat, aiMark } from '../../lib/aiApi.js'

// ---------- AI role-play: a short chat with a story character ----------
export function RolePlay({ step, ad, f, preview, onDone, onSkip }) {
  const [messages, setMessages] = useState([])   // { role: 'tutor' | 'student', text, tip? }
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(true)
  const [done, setDone] = useState(null)
  const [error, setError] = useState('')
  const [limit, setLimit] = useState('')
  const [remaining, setRemaining] = useState(null)
  const endRef = useRef(null)
  const persona = ad.persona || 'Tutor'

  useEffect(() => {
    aiChat(step.id, [], preview)
      .then(r => { setMessages([{ role: 'tutor', text: r.reply }]); setRemaining(r.remaining) })
      .catch(e => setError(e.message))
      .finally(() => setBusy(false))
  }, [step.id, preview])
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }) }, [messages])

  const send = async (e) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    const next = [...messages, { role: 'student', text: t }]
    setMessages(next); setText(''); setBusy(true); setError('')
    try {
      const r = await aiChat(step.id, next.map(({ role, text }) => ({ role, text })), preview)
      if (r.limit_reached) { setLimit(r.message); return }
      setRemaining(r.remaining)
      setMessages(m => [...m, { role: 'tutor', text: r.reply, tip: r.tip }])
      if (r.done) setDone(r)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="stack">
      <div className="chat" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <span className="who">{m.role === 'tutor' ? persona : 'You'}</span>
            <span>{m.text}</span>
            {m.tip && <span className="tip-inline">💡 {m.tip}</span>}
          </div>
        ))}
        {busy && <div className="bubble tutor typing">{persona} is typing…</div>}
        <div ref={endRef} />
      </div>
      {error && <p className="error small">{error}</p>}
      {limit && <p className="notice small">{limit}</p>}
      {done ? (
        <button className="btn btn-primary" onClick={() => onDone({
          correct: true, final: true,
          feedback: done.goals_met ? f('Well done, {preferred_name}! You completed the conversation.') : 'Conversation finished. You can practise it again any time.',
        })}>Finish conversation</button>
      ) : !limit && (
        <form className="chat-input" onSubmit={send}>
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Type your answer in English…" disabled={busy} maxLength={300} autoComplete="off" />
          <button className="btn btn-primary" disabled={busy || !text.trim()}>Send</button>
        </form>
      )}
      <div className="row spread">
        <span className="small muted">{remaining != null ? `AI messages left today: ${remaining}` : ''}</span>
        {!done && <button type="button" className="btn btn-ghost btn-sm" onClick={onSkip}>Skip for now</button>}
      </div>
    </div>
  )
}

// ---------- Writing task marked by AI ----------
export function Writing({ step, c, ad, f, preview, onMarked, onSkip, attempt }) {
  const variations = Array.isArray(c.variations) ? c.variations : []
  const vIndex = variations.length ? ((step.seed ?? 0) + (step.result?.tries ?? 0) + attempt) % variations.length : 0
  const variation = variations.length ? variations[vIndex] : null
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      const r = await aiMark(step.id, text.trim(), vIndex, preview)
      if (r.limit_reached) { setNotice(r.message); return }
      if (r.no_score) { setNotice(r.reason); return }
      onMarked(r)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  return (
    <form className="form" onSubmit={submit}>
      {c.task && <p className="step-question">{f(c.task)}</p>}
      {variation && <p className="variation"><strong>Your situation:</strong> {f(typeof variation === 'string' ? variation : variation.text || JSON.stringify(variation))}</p>}
      {c.required?.length > 0 && <p className="small"><strong>Include:</strong> {c.required.map(f).join(' · ')}</p>}
      {ad.model && <p className="model small">Example: <em>{f(ad.model)}</em></p>}
      <textarea rows={5} value={text} onChange={e => setText(e.target.value)} placeholder="Write your answer in English…" maxLength={1200} />
      <div className="row spread">
        <span className="small muted">{words} words{c.min_words ? ` · at least ${c.min_words}` : ''}</span>
        <span className="row">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onSkip}>Skip for now</button>
          <button className="btn btn-primary" disabled={busy || !text.trim() || (c.min_words && words < c.min_words)}>{busy ? 'The tutor is reading…' : 'Check my writing'}</button>
        </span>
      </div>
      {notice && <p className="notice small">{notice}</p>}
      {error && <p className="error small">{error}</p>}
      <p className="hint">Your writing is checked by the AI tutor. Don't include private details like your address or phone number.</p>
    </form>
  )
}
