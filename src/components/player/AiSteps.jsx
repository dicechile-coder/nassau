import { useEffect, useRef, useState } from 'react'
import { aiChat, aiMark } from '../../lib/aiApi.js'

// ---------- AI role-play: a WhatsApp-style chat with a story character ----------
const AVATARS = {
  jan: 'jan', 'sofía': 'sofia', sofia: 'sofia', luis: 'luis', maya: 'maya', emma: 'emma', ana: 'ana',
  'mr. martis': 'martis', martis: 'martis', 'the fruit seller': 'seller', seller: 'seller',
  'peter de vries': 'teacher', 'meneer de vries': 'teacher', valentina: 'valentina', rafael: 'rafael', megan: 'megan', 'oude man': 'oldman',
  nate: 'nate', carmen: 'carmen', diego: 'diego', 'lucía': 'lucia', lucia: 'lucia', 'el vendedor': 'seller', vendedor: 'seller', 'señor': 'oldman',
}
const DISPLAY = { 'Peter de Vries': 'Meneer De Vries', 'the fruit seller': 'Fruit seller' }
const avatarFor = (p) => AVATARS[String(p || '').toLowerCase()]
const time = () => { const d = new Date(); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}` }

const UI = {
  en: { online: 'online', typing: 'typing…', tutor: 'with Nate · AI tutor', placeholder: 'Type or tap the mic to speak…',
        mic: 'Record a voice message', recording: 'Recording… tap ✓ to send', micDenied: 'Please allow the microphone in your browser to send voice messages.',
        notHeard: 'Sorry, I couldn’t hear that. Please try again, a little closer to the microphone.', heard: 'Heard:',
        voiceOn: 'Voice replies on', voiceOff: 'Voice replies off', play: 'Play', cancel: 'Cancel', listening: 'listening…', done: 'Well done!', doneSub: 'Conversation complete', again: 'Finish', left: 'AI messages left today:',
        skip: 'Skip for now', you: 'You', finished: 'Conversation finished' },
  nl: { online: 'en línea · online', typing: 'escribiendo… · typing…', tutor: 'con Nate · AI tutor', placeholder: 'Escribe o habla en neerlandés… · Type or speak Dutch…',
        mic: 'Grabar un mensaje de voz · Record a voice message', recording: 'Grabando… toca ✓ para enviar · Recording… tap ✓ to send',
        micDenied: 'Permite el micrófono en tu navegador para enviar mensajes de voz. · Please allow the microphone in your browser.',
        notHeard: 'No te escuché bien. Inténtalo otra vez, más cerca del micrófono. · I couldn’t hear that. Please try again.', heard: 'Oído · Heard:',
        voiceOn: 'Respuestas con voz: sí · Voice replies on', voiceOff: 'Respuestas con voz: no · Voice replies off', play: 'Escuchar · Play', cancel: 'Cancelar · Cancel',
        listening: 'escuchando… · listening…', done: 'Goed zo!', doneSub: 'Conversación completada · Conversation complete', again: 'Continuar · Continue',
        left: 'Mensajes de IA hoy · AI messages left today:', skip: 'Saltar · Skip for now', you: 'Tú · You', finished: 'Conversación terminada · Chat finished' },
  es: { online: 'online', typing: 'typt… · typing…', tutor: 'met Nate · AI tutor', placeholder: 'Typ of spreek Spaans… · Type or speak Spanish…',
        mic: 'Spraakbericht opnemen · Record a voice message', recording: 'Opnemen… tik op ✓ om te sturen · Recording… tap ✓ to send',
        micDenied: 'Sta de microfoon toe in je browser om spraakberichten te sturen. · Please allow the microphone in your browser.',
        notHeard: 'Ik kon je niet goed horen. Probeer het nog eens, dichter bij de microfoon. · I couldn’t hear that. Please try again.', heard: 'Gehoord · Heard:',
        voiceOn: 'Antwoorden met stem: aan · Voice replies on', voiceOff: 'Antwoorden met stem: uit · Voice replies off', play: 'Afspelen · Play', cancel: 'Annuleren · Cancel',
        listening: 'luistert… · listening…', done: '¡Muy bien!', doneSub: 'Gesprek afgerond · Conversation complete', again: 'Verder · Continue',
        left: 'AI-berichten vandaag · AI messages left today:', skip: 'Overslaan · Skip for now', you: 'Jij · You', finished: 'Gesprek afgelopen · Chat finished' },
}

// ---------- voice helpers ----------
const MAX_REC_MS = 15000
const recMime = () => {
  if (typeof MediaRecorder === 'undefined') return null
  for (const t of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']) {
    try { if (MediaRecorder.isTypeSupported(t)) return t } catch { /* try next */ }
  }
  return ''
}
const blobToB64 = (blob) => new Promise((res, rej) => {
  const r = new FileReader()
  r.onload = () => res(String(r.result).split(',')[1] || '')
  r.onerror = rej
  r.readAsDataURL(blob)
})
const readPref = () => { try { return localStorage.getItem('nassau:voiceReplies') !== 'off' } catch { return true } }
const savePref = (on) => { try { localStorage.setItem('nassau:voiceReplies', on ? 'on' : 'off') } catch { /* private mode */ } }
const secs = (ms) => `0:${String(Math.min(59, Math.floor(ms / 1000))).padStart(2, '0')}`

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
  // voice messages and spoken replies (all courses)
  const voiceOk = recMime() !== null && !!navigator.mediaDevices?.getUserMedia
  const [speakOn, setSpeakOn] = useState(readPref())
  const [rec, setRec] = useState(null)          // { started } while recording
  const [recMs, setRecMs] = useState(0)
  const recRef = useRef(null)                   // { recorder, stream, chunks, cancel, timer, tick }
  const playerRef = useRef(null)
  const urlsRef = useRef(new Map())            // base64 → blob: URL (the site's security rules allow blob: audio, not data:)
  const audioUrl = (b64) => {
    let u = urlsRef.current.get(b64)
    if (!u) {
      const bin = atob(b64)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      u = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }))
      urlsRef.current.set(b64, u)
    }
    return u
  }
  const play = (b64) => {
    if (!b64) return
    try { playerRef.current?.pause() } catch { /* ignore */ }
    const a = new Audio(audioUrl(b64))
    playerRef.current = a
    a.play().catch(() => { /* autoplay blocked: the play button is there */ })
  }
  useEffect(() => () => {
    try { playerRef.current?.pause() } catch { /* ignore */ }
    urlsRef.current.forEach(u => URL.revokeObjectURL(u))
    const r = recRef.current
    if (r) { r.cancel = true; try { r.recorder.stop() } catch { /* ignore */ } r.stream.getTracks().forEach(t => t.stop()); clearTimeout(r.timer); clearInterval(r.tick) }
  }, [])
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
    aiChat(step.id, [], preview, { speak: readPref() })
      .then(r => { setMessages([{ role: 'tutor', text: r.reply, audio: r.audio, at: time() }]); setRemaining(r.remaining); play(r.audio) })
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
      const r = await aiChat(step.id, next.map(({ role, text }) => ({ role, text })), preview, { speak: speakOn })
      if (r.limit_reached) { setLimit(r.message); return }
      setRemaining(r.remaining)
      setMessages(m => [...m, { role: 'tutor', text: r.reply, tip: r.tip, quote: r.tip ? t : null, audio: r.audio, at: time() }])
      play(r.audio)
      if (r.done) setDone(r)
    } catch (err) { setError(err.message) } finally { setBusy(false); inputRef.current?.focus() }
  }

  // ----- voice messages -----
  const startRec = async () => {
    if (busy || done || limit || rec) return
    setError('')
    try { playerRef.current?.pause() } catch { /* ignore */ }
    let stream
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }) } catch { setError(ui.micDenied); return }
    const mime = recMime()
    const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
    const r = { recorder, stream, chunks: [], cancel: false, started: Date.now() }
    recorder.ondataavailable = (e) => { if (e.data?.size) r.chunks.push(e.data) }
    recorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop())
      clearTimeout(r.timer); clearInterval(r.tick)
      recRef.current = null; setRec(null)
      const ms = Date.now() - r.started
      if (r.cancel || ms < 600) return
      sendVoice(new Blob(r.chunks, { type: recorder.mimeType || mime || 'audio/webm' }))
    }
    recorder.start()
    r.timer = setTimeout(() => { try { recorder.stop() } catch { /* ignore */ } }, MAX_REC_MS)
    r.tick = setInterval(() => setRecMs(Date.now() - r.started), 250)
    recRef.current = r; setRecMs(0); setRec({ started: r.started })
  }
  const stopRec = (cancel = false) => {
    const r = recRef.current
    if (!r) return
    r.cancel = cancel
    try { r.recorder.stop() } catch { /* ignore */ }
  }
  const sendVoice = async (blob) => {
    const url = URL.createObjectURL(blob)
    const prev = messages.map(({ role, text }) => ({ role, text }))
    setMessages(m => [...m, { role: 'student', text: '', voice: url, pending: true, at: time() }])
    setBusy(true); setError('')
    try {
      const b64 = await blobToB64(blob)
      const r = await aiChat(step.id, prev, preview, { audio: b64, audio_type: blob.type, speak: speakOn })
      if (r.limit_reached) { setMessages(m => m.filter(x => x.voice !== url)); setLimit(r.message); return }
      if (r.retry || !r.heard) {
        setMessages(m => m.filter(x => x.voice !== url))
        setError(ui.notHeard)
        return
      }
      setRemaining(r.remaining)
      setMessages(m => [
        ...m.map(x => x.voice === url ? { ...x, text: r.heard, pending: false } : x),
        { role: 'tutor', text: r.reply, tip: r.tip, quote: r.tip ? r.heard : null, audio: r.audio, at: time() },
      ])
      play(r.audio)
      if (r.done) setDone(r)
    } catch (err) {
      setMessages(m => m.filter(x => x.voice !== url))
      setError(err.message)
    } finally { setBusy(false) }
  }
  const toggleSpeak = () => { const v = !speakOn; setSpeakOn(v); savePref(v); if (!v) { try { playerRef.current?.pause() } catch { /* ignore */ } } }
  const useChip = (a) => { const v = a.replace(/…|\.\.\./g, '').trimEnd(); setText(v + (a.includes('…') || a.includes('...') ? ' ' : '')); inputRef.current?.focus() }

  return (
    <div className="wa">
      <div className="wa-head">
        {av ? <img src={`/avatars/${av}.webp`} alt="" /> : <span className="wa-av">{name.charAt(0)}</span>}
        <div className="wa-who">
          <div className="wa-name">{name}</div>
          <div className="wa-status">{rec ? ui.listening : busy ? ui.typing : `${ui.online} · ${ui.tutor}`}</div>
        </div>
        {(
          <button type="button" className={`wa-speak${speakOn ? ' on' : ''}`} onClick={toggleSpeak}
                  aria-pressed={speakOn} title={speakOn ? ui.voiceOn : ui.voiceOff} aria-label={speakOn ? ui.voiceOn : ui.voiceOff}>
            {speakOn
              ? <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" /></svg>
              : <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.6 3 2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4z" /></svg>}
          </button>
        )}
        <span className="wa-prog" aria-label="progress">{progress}/{goals}</span>
      </div>
      <div className="wa-chat" ref={chatRef} aria-live="polite">
        {instruction && <div className="wa-notice">📍 {instruction}</div>}
        {messages.map((m, i) => (
          <div key={i} className={`wa-b ${m.role === 'tutor' ? 'them' : 'me'}`}>
            {m.quote && <div className="wa-quote"><s>{m.quote}</s></div>}
            {m.voice && <audio className="wa-audio" src={m.voice} controls preload="metadata" />}
            {m.voice
              ? (m.pending ? <span className="wa-heard">…</span> : <span className="wa-heard"><b>{ui.heard}</b> “{m.text}”</span>)
              : <span>{m.text}</span>}
            {m.role === 'tutor' && m.audio && (
              <button type="button" className="wa-replay" onClick={() => play(m.audio)} aria-label={ui.play}>
                <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>{ui.play}
              </button>
            )}
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
        {rec ? (
          <>
            <button type="button" className="wa-round wa-cancel" onClick={() => stopRec(true)} aria-label={ui.cancel}>
              <svg viewBox="0 0 24 24"><path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6L19 6.4 17.6 5 12 10.6z" /></svg>
            </button>
            <div className="wa-rec" role="status"><i className="wa-rec-dot" /> {secs(recMs)} · {ui.recording}</div>
            <button type="button" className="wa-round" onClick={() => stopRec(false)} aria-label="Send">
              <svg viewBox="0 0 24 24"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" /></svg>
            </button>
          </>
        ) : (
          <>
            <input ref={inputRef} value={text} onChange={e => setText(e.target.value)} placeholder={done ? ui.finished : ui.placeholder}
              disabled={busy || !!done || !!limit} maxLength={300} autoComplete="off" aria-label={ui.placeholder} />
            {text.trim()
              ? <button className="wa-round" disabled={busy} aria-label="Send"><svg viewBox="0 0 24 24"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" /></svg></button>
              : <button type="button" className={`wa-round${voiceOk ? '' : ' off'}`} title={ui.mic} aria-label={ui.mic}
                  disabled={!voiceOk || busy || !!done || !!limit} onClick={startRec}>
                  <svg viewBox="0 0 24 24"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" /></svg>
                </button>}
          </>
        )}
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
