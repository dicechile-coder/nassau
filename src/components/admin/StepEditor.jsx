import { useState } from 'react'
import { saveStep, typeGroup, extractEmbedUrl } from '../../lib/adminApi.js'

// Edit form for one exercise. Common fields for every type, plus a helper for the type's answer,
// and an "Advanced" JSON view for anything special.
export default function StepEditor({ step, onSaved, onCancel }) {
  const [title, setTitle] = useState(step.title ?? '')
  const [status, setStatus] = useState(step.status)
  const [needsAudio, setNeedsAudio] = useState(step.needs_audio)
  const [c, setC] = useState(() => structuredClone(step.content ?? {}))
  const [json, setJson] = useState(null)       // advanced editor text, null when closed
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const group = typeGroup(step.type)

  const set = (k, v) => setC(x => ({ ...x, [k]: v }))
  const setAd = (k, v) => setC(x => ({ ...x, answer_data: { ...(x.answer_data || {}), [k]: v } }))
  const ad = c.answer_data || {}

  const save = async () => {
    setSaving(true); setMsg('')
    try {
      let content = c
      if (json !== null) content = JSON.parse(json)
      if (group === 'h5p') content = { ...content, h5p_url: extractEmbedUrl(content.h5p_url) }
      if (Array.isArray(content.options)) content = { ...content, options: content.options.map(o => o.trim()).filter(Boolean) }
      const problem = validate(step.type, group, content)
      if (problem) throw new Error(problem)
      await saveStep(step.id, { title: title || content.question || content.instruction || step.type, status, needs_audio: needsAudio, content })
      setMsg('Saved.')
      onSaved?.()
    } catch (e) {
      setMsg(e instanceof SyntaxError ? 'The advanced JSON is not valid.' : e.message)
    } finally { setSaving(false) }
  }

  return (
    <div className="editor form">
      <div className="grid-2">
        <label>Title in the list<input value={title} onChange={e => setTitle(e.target.value)} /></label>
        <label>Status
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="published">Published (students see it)</option>
            <option value="draft">Draft (hidden)</option>
          </select>
        </label>
      </div>
      <label>Instruction<input value={c.instruction ?? ''} onChange={e => set('instruction', e.target.value)} /></label>
      <label>Question / prompt<textarea rows={2} value={c.question ?? ''} onChange={e => set('question', e.target.value)} /></label>

      {(group === 'info' || c.transcript !== undefined || needsAudio) && (
        <label>Transcript / text (one line per speaker, e.g. “Maya: Hello!”)
          <textarea rows={4} value={c.transcript ?? ''} onChange={e => set('transcript', e.target.value)} />
        </label>
      )}

      <fieldset className="fieldset">
        <legend>Media</legend>
        <label className="check"><input type="checkbox" checked={needsAudio} onChange={e => setNeedsAudio(e.target.checked)} />
          <span>This exercise needs audio</span></label>
        <label>Audio link (mp3)<input value={c.audio_url ?? ''} placeholder="https://…/lesson1-dialogue.mp3" onChange={e => set('audio_url', e.target.value)} /></label>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Answer</legend>
        <AnswerEditor group={group} type={step.type} c={c} ad={ad} set={set} setAd={setAd} />
      </fieldset>

      <fieldset className="fieldset">
        <legend>Feedback</legend>
        <label>When correct<input value={c.feedback_correct ?? ''} onChange={e => set('feedback_correct', e.target.value)} /></label>
        <label>Hint after first wrong try<input value={c.feedback_retry ?? ''} onChange={e => set('feedback_retry', e.target.value)} /></label>
        <label>After second wrong try<input value={c.feedback_incorrect ?? ''} onChange={e => set('feedback_incorrect', e.target.value)} /></label>
        <label>Explanation (English)<textarea rows={2} value={c.explanation ?? ''} onChange={e => set('explanation', e.target.value)} /></label>
        <label>Explanation (Spanish)<textarea rows={2} value={c.explanation_es ?? ''} onChange={e => set('explanation_es', e.target.value)} /></label>
      </fieldset>

      <details onToggle={e => setJson(e.currentTarget.open ? JSON.stringify(c, null, 2) : null)}>
        <summary className="small">Advanced: edit all data as JSON</summary>
        {json !== null && <textarea rows={14} className="mono" value={json} onChange={e => setJson(e.target.value)} />}
        <p className="hint">While this is open, Save uses the JSON above.</p>
      </details>

      <div className="row">
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save exercise'}</button>
        <button className="btn btn-ghost" onClick={onCancel}>Close</button>
        {msg && <span className={msg === 'Saved.' ? 'success' : 'error'}>{msg}</span>}
      </div>
      <p className="hint">Placeholders you can use: {'{preferred_name}'}, {'{country}'}, {'{nationality}'}.</p>
    </div>
  )
}

function lines(v) { return (v || []).join('\n') }
function toLines(t) { return t.split('\n').map(s => s.trim()).filter(Boolean) }

function AnswerEditor({ group, type, c, ad, set, setAd }) {
  if (group === 'choice') {
    const opts = c.options || []
    return (
      <>
        <label>Options (one per line)<textarea rows={4} value={lines(opts)} onChange={e => set('options', e.target.value.split('\n'))} /></label>
        {type !== 'nationality_confirm' && (
          <label>Correct answer
            <select value={c.correct_answer ?? ''} onChange={e => set('correct_answer', e.target.value)}>
              <option value="">— choose —</option>
              {opts.filter(o => o.trim()).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        )}
      </>
    )
  }
  if (group === 'order') {
    return (
      <>
        <label>Words to tap (separated by spaces, in the correct order; students see them shuffled)
          <input value={(ad.tokens || []).join(' ')} onChange={e => setAd('tokens', e.target.value.split(/\s+/).filter(Boolean))} />
        </label>
        <label>Accepted sentences (one per line)<textarea rows={3} value={lines(ad.accept)} onChange={e => setAd('accept', toLines(e.target.value))} /></label>
      </>
    )
  }
  if (group === 'reorder') {
    return <label>Correct sentence (students get the words shuffled)<input value={c.correct_answer ?? ''} onChange={e => set('correct_answer', e.target.value)} /></label>
  }
  if (group === 'fill') {
    const personal = ad.bothPreferredName
    return (
      <>
        {personal
          ? <p className="hint">Personal answer: any answer is accepted (not scored).</p>
          : <label>Correct answers, one per blank, in order<textarea rows={3} value={lines(ad.answers)}
              onChange={e => { const a = toLines(e.target.value); setAd('answers', a); setAd('blanks', Math.max(a.length, 1)) }} /></label>}
        <label>Word bank (optional, one per line)<textarea rows={2} value={lines(c.word_bank)} onChange={e => set('word_bank', toLines(e.target.value))} /></label>
      </>
    )
  }
  if (group === 'sort') {
    return (
      <>
        <label>Groups (comma separated)<input value={(ad.groups || []).join(', ')} onChange={e => setAd('groups', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} /></label>
        <label>Items: “word = group”, one per line
          <textarea rows={5} value={(ad.items || []).map(i => `${i.word} = ${i.group}`).join('\n')}
            onChange={e => setAd('items', toLines(e.target.value).map(l => { const [w, g] = l.split('='); return { word: (w || '').trim(), group: (g || '').trim() } }))} />
        </label>
      </>
    )
  }
  if (group === 'sequence') {
    const ordered = (ad.correctOrder || []).map(id => (ad.items || []).find(i => i.id === id)).filter(Boolean)
    return (
      <label>Lines in the correct order (one per line; students see them shuffled)
        <textarea rows={5} value={ordered.map(i => i.text).join('\n')}
          onChange={e => {
            const items = toLines(e.target.value).map((text, i) => ({ id: String.fromCharCode(65 + i), text }))
            setAd('items', items); setAd('correctOrder', items.map(i => i.id))
          }} />
      </label>
    )
  }
  if (group === 'personal') {
    return (
      <label>Save the answer as
        <select value={ad.store ?? ''} onChange={e => setAd('store', e.target.value)}>
          <option value="">Don’t save</option>
          <option value="preferred_name">Preferred name</option>
          <option value="country">Country</option>
          <option value="name_spelling">Name spelling</option>
        </select>
      </label>
    )
  }
  if (group === 'open') {
    return <label>Model answer shown to the student<input value={ad.model ?? ''} onChange={e => setAd('model', e.target.value)} /></label>
  }
  if (group === 'ai') {
    const tutor = (ad.script || []).filter(s => s.role === 'tutor')
    return (
      <>
        <label>Tutor character<input value={ad.persona ?? ''} onChange={e => setAd('persona', e.target.value)} /></label>
        <label>Tutor lines (one per line)
          <textarea rows={4} value={tutor.map(s => s.text).join('\n')}
            onChange={e => {
              const others = (ad.script || []).filter(s => s.role !== 'tutor')
              const newTutor = toLines(e.target.value).map(text => ({ role: 'tutor', text }))
              // keep expected-answer lines after each tutor line where they were
              const merged = []; newTutor.forEach((t, i) => { merged.push(t); if (others[i]) merged.push(others[i]) })
              setAd('script', merged.concat(others.slice(newTutor.length)))
            }} />
        </label>
        <p className="hint">Full AI conversation arrives in Round 4.</p>
      </>
    )
  }
  if (group === 'writing') {
    return (
      <>
        <label>Task (what the student must write)<textarea rows={2} value={c.task ?? ''} onChange={e => set('task', e.target.value)} /></label>
        <label>Situations — one per line; each student gets a different one, and “Try again” gives a new one
          <textarea rows={5} value={(c.variations || []).join('\n')} onChange={e => set('variations', e.target.value.split('\n').map(x => x.trim()).filter(Boolean))} />
        </label>
        <label>Must include (one per line, optional)<textarea rows={3} value={(c.required || []).join('\n')} onChange={e => set('required', e.target.value.split('\n').map(x => x.trim()).filter(Boolean))} /></label>
        <div className="grid-2">
          <label>Lesson target the AI checks<input value={c.target ?? ''} placeholder="e.g. possessive adjectives his / her" onChange={e => set('target', e.target.value)} /></label>
          <label>Minimum words<input type="number" min="0" value={c.min_words ?? 0} onChange={e => set('min_words', Number(e.target.value))} /></label>
        </div>
        <label>Example answer shown to the student (optional)<input value={ad.model ?? ''} onChange={e => setAd('model', e.target.value)} /></label>
        <p className="hint">Marked by the AI with the A1 rubric (4 criteria × 0–2). Pass = 5 of 8. Counts towards the lesson score.</p>
      </>
    )
  }
  if (group === 'h5p') {
    return (
      <>
        <label>H5P embed code or link
          <textarea rows={3} value={c.h5p_url ?? ''} placeholder='Paste the embed code (<iframe src="…">) or the link'
            onChange={e => set('h5p_url', e.target.value)} onBlur={e => set('h5p_url', extractEmbedUrl(e.target.value) || e.target.value)} />
        </label>
        <label>Height in pixels<input type="number" min="200" max="1500" value={c.height ?? 500} onChange={e => set('height', Number(e.target.value))} /></label>
        {extractEmbedUrl(c.h5p_url) && (
          <div className="h5p-frame"><iframe title="H5P preview" src={extractEmbedUrl(c.h5p_url)} style={{ height: c.height || 500 }} allowFullScreen /></div>
        )}
        <p className="hint">Shown inside the lesson. It counts as completed, not scored (scoring comes with uploaded H5P files later).</p>
      </>
    )
  }
  return <p className="hint">No answer needed: students read or listen and continue.</p>
}

function validate(type, group, c) {
  if (group === 'choice' && type !== 'nationality_confirm') {
    const opts = (c.options || []).filter(o => o.trim())
    if (opts.length < 2) return 'Add at least two options.'
    if (!opts.includes(c.correct_answer)) return 'Choose which option is correct.'
  }
  if (group === 'order' && !(c.answer_data?.accept || []).length) return 'Add at least one accepted sentence.'
  if (group === 'reorder' && !(c.correct_answer || '').trim()) return 'Add the correct sentence.'
  if (group === 'writing' && !(c.task || '').trim()) return 'Add the task text.'
  if (group === 'h5p' && !extractEmbedUrl(c.h5p_url)) return 'Paste a valid H5P embed code or https link.'
  if (group === 'fill' && !c.answer_data?.bothPreferredName && !(c.answer_data?.answers || []).length) return 'Add the correct answers.'
  if (group === 'sort' && (c.answer_data?.items || []).some(i => !(c.answer_data?.groups || []).includes(i.group))) return 'Every item needs a group from the group list.'
  return null
}
