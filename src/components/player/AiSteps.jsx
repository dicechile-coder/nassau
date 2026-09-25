import { useEffect, useRef, useState } from 'react'
import { aiChat, aiMark } from '../../lib/aiApi.js'

// ---------- AI role-play: a WhatsApp-style chat with a story character ----------
const AVATARS = {
  jan: 'jan', 'sofía': 'sofia', sofia: 'sofia', luis: 'luis', maya: 'maya', emma: 'emma', ana: 'ana',
  'mr. martis': 'martis', martis: 'martis', 'the fruit seller': 'seller', seller: 'seller',
  'peter de vries': 'teacher', 'meneer de vries': 'teacher', valentina: 'valentina', rafael: 'rafael', megan: 'megan', 'oude man': 'oldman',
  carmen: 'carmen', diego: 'diego', 'lucía': 'lucia', lucia: 'lucia', 'el vendedor': 'seller', vendedor: 'seller', 'señor': 'oldman',
}
const DISPLAY = { 'Peter de Vries': 'Meneer De Vries', 'the fruit seller': 'Fruit seller' }
const avatarFor = (p) => AVATARS[String(p || '').toLowerCase()]
const time = () => { const d = new Date(); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}` }

const UI = {
  en: { online: 'online', typing: 'typing…', tutor: 'with Nate · AI tutor', placeholder: 'Type your answer in English…',
        mic: 'Voice messages are coming soon', done: 'Well done!', doneSub: 'Conversation complete', again: 'Finish', left: 'AI messages left today:',
        skip: 'Skip for now', you: 'You', finished: 'Conversation finished' },
  nl: { online: 'en línea · online', typing: 'escribiendo… · typing…', tutor: 'con Nate · AI tutor', placeholder: 'Escribe en neerlandés… · Type in Dutch…',
        mic: 'Pronto: mensajes de voz · Voice messages coming soon', done: 'Goed zo!', doneSub: 'Conversación completada · Conversation complete', again: 'Continuar · Continue',
        left: 'Mensajes de IA hoy · AI messages left today:', skip: 'Saltar · Skip for now', you: 'Tú · You', finished: 'Conversación terminada · Chat finished' },
  es: { online: 'online', typing: 'typt… · typing…', tutor: 'met Nate · AI tutor', placeholder: 'Schrijf in het Spaans… · Type in Spanish…',
        mic: 'Binnenkort: spraakberichten · Voice messages coming soon', done: '¡Muy bien!', doneSub: 'Gesprek afgerond · Conversation complete', again: 'Verder · Continue',
        left: 'AI-berichten vandaag · AI messages left today:', skip: 'Overslaan · Skip for now', you: 'Jij · You', finished: 'Gesprek afgelopen · Chat finished' },
}

export function RolePlay({ step, c = {}, ad, f, lang, preview, onDone, onSkip }) {
  const ui = UI[lang] || UI.en
  const [messages, setMessages] = useState([])   // { role: 'tutor' | 'student', text, tip?, quote?, at }
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(true)
  const [done, setDone] = useState(null)
  const [error, setError] = useState('')
  const [limit, setLimit] = useState('')
  const [remaining, setRemaining] = useState(null)
  const chatRef = useRef(null)
  const inputRef = useRef(null)
  const persona = ad.persona || 'Nate'
  const name = DISPLAY[persona] || persona
  const av = avatarFor(persona)
  const expects = (ad.script || []).filter(s => s.role === 'expect')
  const goals = Math.max(1, expects.length)
  // a student turn "counts" when the tutor answered it without a correction tip
  const reached = messages.filter((m, i) => m.role === 'tutor' && i > 0 && !m.tip).length
  const progress = done ? goals : Math.min(reached, goals)
  // example answers from the script, tidied for display: fill {name}, capital first letter, "i" → "I",
  // and "…" after an unfinished English fragment ("I wake up at …")
  const tidy = (a) => {
    let t = f(String(a)).trim().replace(/\bi\b/g, 'I')
    t = t.charAt(0).toUpperCase() + t.slice(1)
    if (lang === 'en' && /[a-z]$/i.test(t)) t += ' …'
    return t
  }
  const chips = !busy && !done && !limit
    ? [...new Set((expects[Math.min(reached, expects.length - 1)]?.accept || []).map(tidy))].filter(Boolean).slice(0, 3) : []
  const instruction = f(c.instruction || '')

  useEffect(() => {
    aiChat(step.id, [], preview)
      .then(r => { setMessages([{ role: 'tutor', text: r.reply, at: time() }]); setRemaining(r.remaining) })
      .catch(e => setError(e.message))
      .finally(() => setBusy(false))
  }, [step.id, preview])
  useEffect(() => { const el = chatRef.current; if (el) el.scrollTop = el.scrollHeight }, [messages, busy, done])

  const send = async (e) => {
    e?.preventDefault()
    const t = text.trim()
    if (!t || busy) return
    const next = [...messages, { role: 'student', text: t, at: time() }]
    setMessages(next); setText(''); setBusy(true); setError('')
    try {
      const r = await aiChat(step.id, next.map(({ role, text }) => ({ role, text })), preview)
      if (r.limit_reached) { setLimit(r.message); return }
      setRemaining(r.remaining)
      setMessages(m => [...m, { role: 'tutor', text: r.reply, tip: r.tip, quote: r.tip ? t : null, at: time() }])
      if (r.done) setDone(r)
    } catch (err) { setError(err.message) } finally { setBusy(false); inputRef.current?.focus() }
  }
  const useChip = (a) => { const v = a.replace(/…|\.\.\./g, '').trimEnd(); setText(v + (a.includes('…') || a.includes('...') ? ' ' : '')); inputRef.current?.focus() }

  return (
    <div className="wa">
      <div className="wa-head">
        {av ? <img src={`/avatars/${av}.webp`} alt="" /> : <span className="wa-av">{name.charAt(0)}</span>}
        <div className="wa-who">
          <div className="wa-name">{name}</div>
          <div className="wa-status">{busy ? ui.typing : `${ui.online} · ${ui.tutor}`}</div>
        </div>
        <span className="wa-prog" aria-label="progress">{progress}/{goals}</span>
      </div>
      <div className="wa-chat" ref={chatRef} aria-live="polite">
        {instruction && <div className="wa-notice">📍 {instruction}</div>}
        {messages.map((m, i) => (
          <div key={i} className={`wa-b ${m.role === 'tutor' ? 'them' : 'me'}`}>
            {m.quote && <div className="wa-quote"><s>{m.quote}</s></div>}
            <span>{m.text}</span>
            {m.tip && <span className="wa-tip">💡 {m.tip}</span>}
            <span className="wa-t">{m.at}{m.role === 'student' && <span className="wa-tick">✓✓</span>}</span>
          </div>
        ))}
        {busy && <div className="wa-typing" aria-label={ui.typing}><i /><i /><i /></div>}
        {done && (
          <div className="wa-done">
            <div className="wa-done-big">{ui.done} 🎉</div>
            <div className="small muted">{ui.doneSub}</div>
            <button className="btn btn-primary" onClick={() => onDone({
              correct: true, final: true,
              feedback: done.goals_met ? f('Well done, {preferred_name}! You completed the conversation.') : 'Conversation finished. You can practise it again any time.',
            })}>{ui.again}</button>
          </div>
        )}
        {limit && <div className="wa-notice">{limit}</div>}
      </div>
      {chips.length > 0 && (
        <div className="wa-chips">
          {chips.map(a => <button type="button" key={a} className="wa-chip" onClick={() => useChip(a)}>{a}</button>)}
        </div>
      )}
      <form className="wa-bar" onSubmit={send}>
        <input ref={inputRef} value={text} onChange={e => setText(e.target.value)} placeholder={done ? ui.finished : ui.placeholder}
          disabled={busy || !!done || !!limit} maxLength={300} autoComplete="off" aria-label={ui.placeholder} />
        {text.trim()
          ? <button className="wa-round" disabled={busy} aria-label="Send"><svg viewBox="0 0 24 24"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" /></svg></button>
          : <button type="button" className="wa-round off" title={ui.mic} aria-label={ui.mic} disabled><svg viewBox="0 0 24 24"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" /></svg></button>}
      </form>
      {error && <p className="error small">{error}</p>}
      <div className="row spread wa-foot">
        <span className="small muted">{remaining != null ? `${ui.left} ${remaining}` : ''}</span>
        {!done && <button type="button" className="btn btn-ghost btn-sm" onClick={onSkip}>{ui.skip}</button>}
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
