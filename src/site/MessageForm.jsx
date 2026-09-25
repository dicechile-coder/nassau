import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { SITE } from '../lib/site.js'

// Contact and placement requests are stored in Supabase (table site_messages)
// and show up in Admin → Messages. A hidden "website" field catches spam bots.
export default function MessageForm({ kind = 'contact', submitLabel = 'Send message' }) {
  const [f, setF] = useState({ name: '', email: '', language: '', format: '', message: '', website: '' })
  const [state, setState] = useState('idle') // idle | sending | sent | error
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF(v => ({ ...v, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (f.website) { setState('sent'); return } // bot
    if (!f.name.trim() || !/^\S+@\S+\.\S+$/.test(f.email) || (kind === 'placement' && !f.language)) {
      setErr('Please fill in your name, a valid email' + (kind === 'placement' ? ' and the language.' : '.')); setState('error'); return
    }
    setState('sending'); setErr('')
    const { error } = await supabase.from('site_messages').insert({
      kind, name: f.name.trim().slice(0, 120), email: f.email.trim().slice(0, 200),
      language: f.language || null, format: f.format || null,
      message: f.message.trim().slice(0, 4000), page: window.location.pathname,
    })
    if (error) { setErr(`Sorry, that didn’t work. Please email us at ${SITE.contactEmail}.`); setState('error') }
    else setState('sent')
  }

  if (state === 'sent') {
    return (
      <div className="s-ok" role="status">
        Thank you{f.name ? `, ${f.name.split(' ')[0]}` : ''}! We received your {kind === 'placement' ? 'request' : 'message'} and reply within 1–2 working days.
      </div>
    )
  }

  return (
    <form className="s-form" onSubmit={submit} noValidate>
      <div className="s-form-2">
        <label>Name<input value={f.name} onChange={set('name')} autoComplete="name" required /></label>
        <label>Email<input type="email" value={f.email} onChange={set('email')} autoComplete="email" required /></label>
      </div>
      {kind === 'placement' && (
        <div className="s-form-2">
          <label>Language
            <select value={f.language} onChange={set('language')} required>
              <option value="">Choose…</option>
              <option value="dutch">Dutch</option>
              <option value="nt2">Dutch — NT2</option>
              <option value="naturalization">Dutch — Naturalization exam</option>
              <option value="english">English</option>
              <option value="spanish">Spanish</option>
            </select>
          </label>
          <label>I prefer
            <select value={f.format} onChange={set('format')}>
              <option value="">No preference</option>
              <option value="in-person">In person, in Curaçao</option>
              <option value="online">Online</option>
            </select>
          </label>
        </div>
      )}
      <label>{kind === 'placement' ? 'Tell us about your goals' : 'Message'}
        <textarea value={f.message} onChange={set('message')}
                  placeholder={kind === 'placement' ? 'For example: I need Dutch for work, I learned some at school…' : ''} />
      </label>
      <label className="s-hp" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} /></label>
      {state === 'error' && <div className="s-err" role="alert">{err}</div>}
      <div className="s-btns">
        <button type="submit" className="s-btn s-btn-primary" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : submitLabel}</button>
      </div>
      <p className="s-text" style={{ fontSize: 14 }}>We only use your details to answer you. See our <Link to="/privacy">privacy policy</Link>.</p>
    </form>
  )
}
