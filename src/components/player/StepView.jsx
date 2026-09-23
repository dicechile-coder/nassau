import { useMemo, useState } from 'react'
import { fill, shuffled, COUNTRIES, suggestedNationality } from '../../lib/placeholders.js'

// Renders one exercise step and calls onSubmit(answer) when the student checks it.
// `locked` = feedback is showing; inputs are frozen until "Try again" or "Continue".
export default function StepView({ step, profile, locked, onSubmit, busy }) {
  const c = step.content || {}
  const ad = c.answer_data || {}
  const f = (t) => fill(t, profile)
  const instruction = f(c.instruction)
  const question = f(c.question)
  const showQuestion = question && question !== instruction && !/^Model dialogue|^Scene|^Alphabet|^Buttons:|^Show a four-step/.test(question)

  return (
    <div className="step">
      {instruction && <p className="step-instruction">{instruction}</p>}
      {showQuestion && <p className="step-question">{question}</p>}
      {step.needs_audio && <AudioNote transcript={c.transcript} kind={step.kind} />}
      <Body step={step} c={c} ad={ad} f={f} profile={profile} locked={locked} onSubmit={onSubmit} busy={busy} />
    </div>
  )
}

function AudioNote({ transcript, kind }) {
  const [open, setOpen] = useState(kind === 'info')
  if (!transcript) return <p className="notice small">Audio is coming soon.</p>
  return (
    <div className="audio-note">
      <p className="small muted">🔈 Audio is coming soon. For now, read the text.</p>
      {kind !== 'info' && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(o => !o)}>
          {open ? 'Hide text' : 'Show text'}
        </button>
      )}
      {open && kind !== 'info' && <Transcript text={transcript} />}
    </div>
  )
}

function Transcript({ text }) {
  return (
    <div className="transcript">
      {String(text).split('\n').map((line, i) => {
        const m = line.match(/^([^:]{1,20}):\s*(.*)$/)
        return m
          ? <p key={i}><strong>{m[1]}:</strong> {m[2]}</p>
          : <p key={i}>{line}</p>
      })}
    </div>
  )
}

function SubmitButton({ disabled, busy, label = 'Check' }) {
  return <button className="btn btn-primary" disabled={disabled || busy}>{busy ? 'Checking…' : label}</button>
}

function Body({ step, c, ad, f, profile, locked, onSubmit, busy }) {
  switch (step.kind) {
    case 'choice': return <Choice options={c.options} f={f} locked={locked} onSubmit={onSubmit} busy={busy} />
    case 'order': return <Order tokens={ad.tokens || []} seed={step.id} locked={locked} onSubmit={onSubmit} busy={busy} />
    case 'fill': return <Fill c={c} ad={ad} f={f} locked={locked} onSubmit={onSubmit} busy={busy} />
    case 'sort': return <Sort items={ad.items || []} groups={ad.groups || []} seed={step.id} locked={locked} onSubmit={onSubmit} busy={busy} />
    case 'sequence': return <Sequence items={ad.items || []} seed={step.id} locked={locked} onSubmit={onSubmit} busy={busy} />
    case 'personal': return <Personal ad={ad} profile={profile} locked={locked} onSubmit={onSubmit} busy={busy} />
    case 'spelling': return <TextAnswer placeholder="F-E-R-R-Y" locked={locked} onSubmit={onSubmit} busy={busy} />
    case 'nationality': return <Nationality profile={profile} locked={locked} onSubmit={onSubmit} busy={busy} />
    case 'open': return <Open model={f(ad.model)} locked={locked} onSubmit={onSubmit} busy={busy} />
    case 'ai': return <AiPractice c={c} ad={ad} f={f} locked={locked} onSubmit={onSubmit} busy={busy} />
    default: return <Info c={c} ad={ad} f={f} locked={locked} onSubmit={onSubmit} busy={busy} />
  }
}

function Choice({ options = [], f, locked, onSubmit, busy }) {
  const [choice, setChoice] = useState(null)
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ choice }) }} className="stack">
      <div className="options" role="radiogroup">
        {options.map(o => (
          <button type="button" key={o} role="radio" aria-checked={choice === o} disabled={locked}
            className={`option ${choice === o ? 'selected' : ''}`} onClick={() => setChoice(o)}>{f(o)}</button>
        ))}
      </div>
      {!locked && <SubmitButton disabled={!choice} busy={busy} />}
    </form>
  )
}

function Order({ tokens, seed, locked, onSubmit, busy }) {
  const pool = useMemo(() => shuffled(tokens.map((t, i) => ({ t, i })), seed).map(x => x), [tokens, seed])
  const [picked, setPicked] = useState([])
  const remaining = pool.filter(p => !picked.includes(p.i))
  const sentence = picked.map(i => tokens[i]).join(' ').replace(/\s+([?.!,])/g, '$1')
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ text: sentence }) }} className="stack">
      <div className="built" aria-live="polite">{sentence || <span className="muted">Tap the words in order…</span>}</div>
      <div className="chips">
        {remaining.map(p => (
          <button type="button" key={p.i} className="chip" disabled={locked} onClick={() => setPicked(x => [...x, p.i])}>{p.t}</button>
        ))}
      </div>
      {!locked && (
        <div className="row">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPicked(x => x.slice(0, -1))} disabled={!picked.length}>Undo</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPicked([])} disabled={!picked.length}>Clear</button>
          <SubmitButton disabled={picked.length !== tokens.length} busy={busy} />
        </div>
      )}
    </form>
  )
}

function Fill({ c, ad, f, locked, onSubmit, busy }) {
  const count = ad.blanks || (String(c.question || '').match(/_{3,}/g) || []).length || 1
  const [vals, setVals] = useState(Array(count).fill(''))
  const bank = c.word_bank || []
  const set = (i, v) => setVals(a => a.map((x, j) => (j === i ? v : x)))
  const useWord = (w) => { const i = vals.findIndex(v => !v.trim()); if (i >= 0) set(i, w) }
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ blanks: vals.map(v => v.trim()) }) }} className="stack form">
      {bank.length > 0 && !locked && (
        <div className="chips">{bank.map(w => <button type="button" className="chip" key={w} onClick={() => useWord(w)}>{f(w)}</button>)}</div>
      )}
      {vals.map((v, i) => (
        <label key={i}>Blank {i + 1}
          <input value={v} disabled={locked} onChange={e => set(i, e.target.value)} autoComplete="off" />
        </label>
      ))}
      {!locked && <SubmitButton disabled={vals.some(v => !v.trim())} busy={busy} />}
    </form>
  )
}

function Sort({ items, groups, seed, locked, onSubmit, busy }) {
  const order = useMemo(() => shuffled(items, seed), [items, seed])
  const [map, setMap] = useState({})
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ groups: map }) }} className="stack">
      {order.map(w => (
        <div key={w} className="sort-row">
          <span className="sort-word">{w}</span>
          <div className="seg">
            {groups.map(g => (
              <button type="button" key={g} disabled={locked} aria-pressed={map[w] === g}
                className={`seg-btn ${map[w] === g ? 'selected' : ''}`} onClick={() => setMap(m => ({ ...m, [w]: g }))}>{g}</button>
            ))}
          </div>
        </div>
      ))}
      {!locked && <SubmitButton disabled={Object.keys(map).length !== items.length} busy={busy} />}
    </form>
  )
}

function Sequence({ items, seed, locked, onSubmit, busy }) {
  const [list, setList] = useState(() => shuffled(items, seed))
  const move = (i, d) => setList(l => { const a = [...l]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a })
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ order: list.map(x => x.id) }) }} className="stack">
      <ol className="sequence">
        {list.map((it, i) => (
          <li key={it.id}>
            <span>{it.text}</span>
            {!locked && (
              <span className="seq-btns">
                <button type="button" className="btn btn-ghost btn-sm" aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                <button type="button" className="btn btn-ghost btn-sm" aria-label="Move down" onClick={() => move(i, 1)} disabled={i === list.length - 1}>↓</button>
              </span>
            )}
          </li>
        ))}
      </ol>
      {!locked && <SubmitButton busy={busy} />}
    </form>
  )
}

function Personal({ ad, profile, locked, onSubmit, busy }) {
  const isCountry = ad.inputType === 'country' || ad.store === 'country'
  const initial = ad.store === 'preferred_name' ? (profile?.preferred_name || '') : isCountry ? (profile?.country || '') : ''
  return <TextAnswer initial={initial} list={isCountry ? COUNTRIES : null} locked={locked} onSubmit={onSubmit} busy={busy} label="Save" />
}

function Nationality({ profile, locked, onSubmit, busy }) {
  const suggested = suggestedNationality(profile?.country)
  const [other, setOther] = useState(false)
  const [text, setText] = useState('')
  if (locked) return null
  return (
    <div className="stack">
      <div className="options">
        {suggested && <button type="button" className="option" disabled={busy} onClick={() => onSubmit({ choice: 'Yes', text: suggested })}>Yes, I’m {suggested}</button>}
        <button type="button" className="option" onClick={() => setOther(true)}>Choose another</button>
        <button type="button" className="option" disabled={busy} onClick={() => onSubmit({ choice: 'Skip', text: '' })}>Skip</button>
      </div>
      {other && (
        <form className="form" onSubmit={e => { e.preventDefault(); onSubmit({ choice: 'Choose another', text: text.trim() }) }}>
          <label>My nationality<input value={text} onChange={e => setText(e.target.value)} placeholder="e.g. Venezuelan" /></label>
          <SubmitButton disabled={!text.trim()} busy={busy} label="Save" />
        </form>
      )}
    </div>
  )
}

function TextAnswer({ initial = '', placeholder, list, locked, onSubmit, busy, label = 'Check' }) {
  const [text, setText] = useState(initial)
  return (
    <form className="form" onSubmit={e => { e.preventDefault(); onSubmit({ text: text.trim() }) }}>
      <input value={text} onChange={e => setText(e.target.value)} placeholder={placeholder} disabled={locked}
        list={list ? 'country-list' : undefined} autoComplete="off" />
      {list && <datalist id="country-list">{list.map(x => <option key={x} value={x} />)}</datalist>}
      {!locked && <SubmitButton disabled={!text.trim()} busy={busy} label={label} />}
    </form>
  )
}

function Open({ model, locked, onSubmit, busy }) {
  const [text, setText] = useState('')
  return (
    <form className="form" onSubmit={e => { e.preventDefault(); onSubmit({ text: text.trim() }) }}>
      {model && <p className="model">Model: <strong>{model}</strong></p>}
      <textarea rows={3} value={text} onChange={e => setText(e.target.value)} disabled={locked} placeholder="Type your answer…" />
      {!locked && <SubmitButton disabled={!text.trim()} busy={busy} label="Submit" />}
    </form>
  )
}

function AiPractice({ c, ad, f, locked, onSubmit, busy }) {
  const [text, setText] = useState('')
  const lines = (ad.script || []).filter(s => s.role === 'tutor')
  return (
    <form className="form" onSubmit={e => { e.preventDefault(); onSubmit({ text: text.trim(), practice: true }) }}>
      {lines.length > 0 && (
        <div className="transcript">
          {lines.map((l, i) => <p key={i}><strong>{ad.persona || 'Tutor'}:</strong> {f(l.text)}</p>)}
        </div>
      )}
      <p className="notice small">The AI conversation partner arrives soon. For now, type what you would say.</p>
      <textarea rows={3} value={text} onChange={e => setText(e.target.value)} disabled={locked} placeholder="Type your answer…" />
      {!locked && <SubmitButton busy={busy} label="Continue" />}
    </form>
  )
}

function Info({ c, ad, f, locked, onSubmit, busy }) {
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ seen: true }) }} className="stack">
      {c.transcript && <Transcript text={f(c.transcript)} />}
      {ad.kind === 'completion' && <p className="notice">{f(c.question)}</p>}
      {!locked && <SubmitButton busy={busy} label="Continue" />}
    </form>
  )
}
