import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase.js'

// Admin → Audio: choose a voice per character, test it, and generate all course audio with ElevenLabs.
const tts = async (body) => {
  const { data, error } = await supabase.functions.invoke('tts', { body })
  if (error) {
    let msg = error.message
    try { const j = await error.context.json(); if (j?.error) msg = j.error } catch { /* keep message */ }
    throw new Error(msg)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

export default function AudioPanel() {
  const [lines, setLines] = useState(null)
  const [settings, setSettings] = useState(null)
  const [voices, setVoices] = useState(null)
  const [voiceErr, setVoiceErr] = useState('')
  const [msg, setMsg] = useState('')
  const [busyId, setBusyId] = useState('')
  const [batch, setBatch] = useState(null)       // { done, total, errors }
  const stopRef = useRef(false)
  const [filter, setFilter] = useState('E01')
  const audioRef = useRef(null)

  const load = async () => {
    const [{ data: l }, { data: s }] = await Promise.all([
      supabase.from('audio_lines').select('id, kind, episode, module, lines, url, chars, generated_at').order('id'),
      supabase.from('app_settings').select('value').eq('key', 'voices').maybeSingle(),
    ])
    setLines(l ?? []); setSettings(s?.value ?? { voices: {} })
  }
  useEffect(() => {
    load()
    tts({ action: 'voices' }).then(d => setVoices(d.voices)).catch(e => setVoiceErr(e.message))
  }, [])

  const roles = useMemo(() => {
    if (!lines) return []
    const count = {}
    for (const l of lines) for (const p of l.lines) count[p.speaker] = (count[p.speaker] || 0) + 1
    return Object.entries(count).sort((a, b) => b[1] - a[1])
  }, [lines])

  if (!lines || !settings) return <p className="muted">Loading…</p>

  const chosen = settings.voices || {}
  const setVoice = (role, id) => setSettings(s => ({ ...s, voices: { ...(s.voices || {}), [role]: id } }))
  const saveVoices = async () => {
    setMsg('')
    const { error } = await supabase.from('app_settings').update({ value: settings, updated_at: new Date().toISOString() }).eq('key', 'voices')
    setMsg(error ? `Could not save: ${error.message}` : 'Voices saved.')
  }
  const play = (src) => { if (audioRef.current) { audioRef.current.src = src; audioRef.current.play() } }
  const test = async (role) => {
    const sample = lines.flatMap(l => l.lines).find(p => p.speaker === role)?.say?.replace(/<[^>]+>/g, '') || `Hello! I'm ${role}.`
    if (!chosen[role]) return setMsg(`Choose a voice for ${role} first.`)
    setBusyId('test-' + role); setMsg('')
    try { const d = await tts({ action: 'test', voice_id: chosen[role], text: sample, speed: 0.95 }); play(`data:audio/mpeg;base64,${d.audio}`) }
    catch (e) { setMsg(e.message) } finally { setBusyId('') }
  }
  const generate = async (id) => {
    const d = await tts({ action: 'generate', id })
    setLines(ls => ls.map(l => (l.id === id ? { ...l, url: d.url, chars: d.chars, generated_at: new Date().toISOString() } : l)))
    return d
  }
  const genOne = async (id) => {
    setBusyId(id); setMsg('')
    try { const d = await generate(id); play(d.url) } catch (e) { setMsg(`${id}: ${e.message}`) } finally { setBusyId('') }
  }
  const genMany = async (list) => {
    stopRef.current = false
    setBatch({ done: 0, total: list.length, errors: [] }); setMsg('')
    for (let i = 0; i < list.length; i++) {
      if (stopRef.current) break
      try { await generate(list[i].id) } catch (e) { setBatch(b => ({ ...b, errors: [...b.errors, `${list[i].id}: ${e.message}`] })) }
      setBatch(b => ({ ...b, done: i + 1 }))
    }
    setBatch(b => ({ ...b, finished: true }))
  }

  const groups = [...new Set(lines.map(l => (l.kind === 'episode' ? `E${String(l.episode).padStart(2, '0')}` : 'Exercises')))]
  const shown = lines.filter(l => (filter === 'Exercises' ? l.kind === 'exercise' : l.kind === 'episode' && `E${String(l.episode).padStart(2, '0')}` === filter))
  const missing = shown.filter(l => !l.url)
  const allMissing = lines.filter(l => !l.url)
  const doneCount = lines.filter(l => l.url).length
  const needVoice = roles.filter(([r]) => r !== 'All' && !chosen[r]).map(([r]) => r)

  return (
    <div className="stack">
      <audio ref={audioRef} controls className="audio-player" />

      <section className="card form">
        <h3 className="h3">1 · Voices</h3>
        <p className="small muted">Add voices in ElevenLabs (“Add to my voices”), then pick one per character here and press Test. Group lines (“All”) use Maya’s voice unless you choose one.</p>
        {voiceErr && <p className="error">{voiceErr}</p>}
        {!voices && !voiceErr && <p className="muted small">Loading your ElevenLabs voices…</p>}
        {voices && (
          <table className="table">
            <thead><tr><th>Character</th><th>Lines</th><th>Voice</th><th></th></tr></thead>
            <tbody>
              {roles.map(([role, n]) => (
                <tr key={role}>
                  <td><strong>{role}</strong></td>
                  <td>{n}</td>
                  <td>
                    <select value={chosen[role] || ''} onChange={e => setVoice(role, e.target.value)}>
                      <option value="">— choose —</option>
                      {voices.map(v => <option key={v.id} value={v.id}>{v.name}{v.labels?.accent ? ` · ${v.labels.accent}` : ''}{v.labels?.gender ? ` · ${v.labels.gender}` : ''}</option>)}
                    </select>
                  </td>
                  <td><button className="btn btn-ghost btn-sm" disabled={!chosen[role] || busyId === 'test-' + role} onClick={() => test(role)}>{busyId === 'test-' + role ? '…' : 'Test'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="row">
          <button className="btn btn-primary" onClick={saveVoices}>Save voices</button>
          <label className="inline small">Speed Module 1
            <input type="number" step="0.05" min="0.7" max="1.2" value={settings.speed?.['1'] ?? 0.9}
              onChange={e => setSettings(s => ({ ...s, speed: { ...(s.speed || {}), 1: Number(e.target.value) } }))} style={{ width: 80 }} />
          </label>
        </div>
        {needVoice.length > 0 && <p className="small muted">Still without a voice: {needVoice.join(', ')}</p>}
      </section>

      <section className="card">
        <h3 className="h3">2 · Generate</h3>
        <p className="small muted">{doneCount} of {lines.length} recordings made · {lines.reduce((a, l) => a + (l.chars || 0), 0).toLocaleString()} characters used so far. Exercise clips are attached to their lesson automatically.</p>
        <div className="row">
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            {groups.map(g => <option key={g} value={g}>{g === 'Exercises' ? 'Exercise clips' : `Episode ${Number(g.slice(1))}`}</option>)}
          </select>
          <button className="btn btn-primary" disabled={!!batch && !batch.finished} onClick={() => genMany(missing)}>Generate missing here ({missing.length})</button>
          <button className="btn btn-ghost" disabled={!!batch && !batch.finished} onClick={() => genMany(allMissing)}>Generate ALL missing ({allMissing.length})</button>
          {batch && !batch.finished && <button className="btn btn-ghost" onClick={() => { stopRef.current = true }}>Stop</button>}
        </div>
        {batch && (
          <div className="small">
            <div className="progress"><div style={{ width: `${Math.round(batch.done / Math.max(batch.total, 1) * 100)}%` }} /></div>
            {batch.done} / {batch.total}{batch.finished ? ' — finished' : ' — working, keep this page open'}
            {batch.errors.length > 0 && <ul className="error">{batch.errors.slice(0, 5).map(e => <li key={e}>{e}</li>)}</ul>}
          </div>
        )}
        {msg && <p className={msg.endsWith('saved.') ? 'success' : 'error'}>{msg}</p>}
        <table className="table">
          <thead><tr><th>ID</th><th>Lines</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {shown.map(l => (
              <tr key={l.id}>
                <td className="small"><strong>{l.id}</strong></td>
                <td className="small">{l.lines.map((p, i) => <div key={i}><strong>{p.speaker}:</strong> {p.text || p.say}</div>)}</td>
                <td className="small">{l.url ? <button className="linkish" onClick={() => play(l.url)}>▶ Play</button> : <span className="muted">not yet</span>}</td>
                <td><button className="btn btn-ghost btn-sm" disabled={busyId === l.id || (batch && !batch.finished)} onClick={() => genOne(l.id)}>{busyId === l.id ? '…' : l.url ? 'Redo' : 'Generate'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
