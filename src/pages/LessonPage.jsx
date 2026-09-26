import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { loadCourse, courseCodeForLesson, setCurrentCourse } from '../lib/course.js'
import { getLessonSteps, checkStep, completeLesson } from '../lib/lessonApi.js'
import { fill } from '../lib/placeholders.js'
import { Loading } from '../components/Guards.jsx'
import StepView from '../components/player/StepView.jsx'
import { Video } from '../components/Media.jsx'
import StreakBar from '../components/StreakBar.jsx'
import { myProgress } from '../lib/progressApi.js'
import { announceStep } from '../components/NateBubble.jsx'

export default function LessonPage() {
  const { lessonId } = useParams()
  const [params] = useSearchParams()
  const { isStaff, profile, refreshProfile } = useAuth()
  const preview = isStaff && params.get('preview') === '1'
  const navigate = useNavigate()

  const [course, setCourse] = useState(null)
  const [steps, setSteps] = useState(null)
  const [error, setError] = useState('')
  const [phase, setPhase] = useState('intro')        // intro | play | result
  const [queue, setQueue] = useState([])             // indexes of steps to play
  const [pos, setPos] = useState(0)                  // position in queue
  const [feedback, setFeedback] = useState(null)     // result of the last check
  const [attemptKey, setAttemptKey] = useState(0)    // remounts the step for "Try again"
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [showEs, setShowEs] = useState(false)
  const [prog, setProg] = useState(null)

  useEffect(() => {
    let alive = true
    setCourse(null); setSteps(null); setPhase('intro'); setResult(null); setError('')
    courseCodeForLesson(lessonId).then(code => {
      if (code) setCurrentCourse(code)
      return loadCourse(code || undefined)
    }).then(async (c) => {
      if (!alive) return
      setCourse(c)
      const lesson = c?.lessons.find(l => l.id === lessonId)
      if (lesson && (lesson.state !== 'locked' || preview)) {
        const s = await getLessonSteps(lessonId)
        if (alive) setSteps(s)
      }
    }).catch(e => alive && setError(e.message))
    return () => { alive = false }
  }, [lessonId, preview])

  const lesson = course?.lessons.find(l => l.id === lessonId)
  const lang = course?.language || 'en'
  // Dutch course: helper texts in Spanish · English; Spanish course: helper texts in Dutch · English
  const bilingual = lang === 'nl' || lang === 'es'
  const T = LESSON_UI[lang] || LESSON_UI.nl
  const vocab = Array.isArray(lesson?.vocab) ? lesson.vocab : []
  const nextLesson = useMemo(() => {
    if (!course || !lesson) return null
    const i = course.lessons.findIndex(l => l.id === lesson.id)
    return course.lessons[i + 1] ?? null
  }, [course, lesson])

  // tell floating Nate which exercise is on screen (he explains it, never gives the answer)
  const nateStepId = phase === 'play' && steps ? steps[queue[pos]]?.id ?? null : null
  useEffect(() => { announceStep(lessonId, nateStepId) }, [lessonId, nateStepId])
  useEffect(() => () => announceStep(null, null), [])

  if (error) return <main className="page"><p className="error">{error}</p><Link to="/learn">Back to the hub</Link></main>
  if (!course) return <Loading />
  if (!lesson) return <main className="page"><h1 className="h2">Lesson not found</h1><Link to="/learn">Back to the hub</Link></main>

  if (lesson.state === 'locked' && !preview) {
    return (
      <main className="page">
        <div className="card">
          <h1 className="h2">This lesson is still locked</h1>
          <p>Pass the previous lesson with at least {lesson.pass_mark ?? 70}% to unlock it.</p>
          {course.next && <Link className="btn btn-primary" to={`/learn/lesson/${course.next.id}`}>Go to your current lesson</Link>}
          <p><Link to="/learn">Back to the hub</Link></p>
        </div>
      </main>
    )
  }
  if (!steps) return <Loading />

  const answered = steps.filter(s => s.result).length
  const start = (indexes) => { setQueue(indexes); setPos(0); setFeedback(null); setAttemptKey(k => k + 1); setPhase('play') }
  const startAll = () => start(steps.map((_, i) => i))
  const resume = () => {
    const first = steps.findIndex(s => !s.result)
    start(steps.map((_, i) => i).slice(Math.max(first, 0)))
  }

  const current = phase === 'play' ? steps[queue[pos]] : null

  const submit = async (answer, preset = null) => {
    setBusy(true); setError('')
    try {
      // AI steps are marked by the AI function (preset); skipped role-plays still count as seen
      const r = preset ?? await checkStep(current.id, answer, preview)
      setFeedback(r)
      if (['personal', 'spelling', 'nationality'].includes(current.kind) && !preview) await refreshProfile()
      setSteps(list => list.map(s => (s.id === current.id ? { ...s, result: { correct: r.correct, tries: r.tries ?? (s.result?.tries ?? 0) + 1 } } : s)))
      // Non-scored steps that went fine need no feedback screen
      if (r.correct && !current.gradable && !r.feedback) goNext()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const goNext = async () => {
    setFeedback(null); setAttemptKey(k => k + 1)
    if (pos + 1 < queue.length) { setPos(p => p + 1); window.scrollTo(0, 0); return }
    setBusy(true)
    try {
      const r = await completeLesson(lesson.id, preview)
      setResult(r); setPhase('result'); window.scrollTo(0, 0)
      if (!preview) myProgress().then(setProg).catch(() => {})
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const retry = () => { setFeedback(null); setAttemptKey(k => k + 1) }

  // ---------- screens ----------
  const header = (
    <>
      {preview && <p className="notice">Administrator preview — progress is not saved.</p>}
      <p className="small"><Link to={preview ? '/admin' : '/learn'}>← {preview ? 'Admin' : 'Learning hub'}</Link></p>
    </>
  )

  if (phase === 'intro') {
    return (
      <main className="page">
        {header}
        <div className="card stack">
          <p className="eyebrow">{course.title}</p>
          <h1 className="h2">{lesson.title}</h1>
          {lesson.objective && <p><strong>By the end of this lesson, you can…</strong><br />{lesson.objective.replace(/^After this lesson, you can /i, '')}</p>}
          <Video url={lesson.video_url} title={lesson.title} />
          {lesson.content && <p>{lesson.content}</p>}
          {lesson.content_es && (bilingual
            ? <p className="muted small es">{lesson.content_es}</p>
            : <div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowEs(v => !v)}>{showEs ? 'Ocultar español' : 'Ver en español'}</button>
                {showEs && <p className="muted small es">{lesson.content_es}</p>}
              </div>
          )}
          {bilingual
            ? (lesson.tip || lesson.tip_es) && (
                <div className="tip">
                  {lesson.tip_es && <p className="tip-line"><strong>{T.tip2}</strong> {lesson.tip_es}</p>}
                  {lesson.tip && <p className="tip-line"><strong>{T.tip}</strong> {lesson.tip}</p>}
                </div>)
            : lesson.tip && <p className="tip"><strong>Spanish-speaker tip:</strong> {lesson.tip}</p>}
          {vocab.length > 0 && (
            <details className="vocab-box">
              <summary>{T.words} ({vocab.length})</summary>
              <VocabTable words={vocab} lang={lang} />
              <Link className="small" to={`/learn/lesson/${lesson.id}/words`}>{T.pdf}</Link>
            </details>
          )}
          <p className="muted small">{steps.length} steps{lesson.minutes ? ` · about ${lesson.minutes} minutes` : ''} · pass mark {lesson.pass_mark ?? 70}%</p>
          <div className="row">
            {answered > 0 && answered < steps.length && lesson.state !== 'done'
              ? <><button className="btn btn-primary" onClick={resume}>Continue where you left off</button>
                  <button className="btn btn-ghost" onClick={startAll}>Start from the beginning</button></>
              : <button className="btn btn-primary" onClick={startAll} disabled={!steps.length}>{lesson.state === 'done' ? 'Practise again' : 'Start lesson'}</button>}
          </div>
        </div>
      </main>
    )
  }

  if (phase === 'result' && result) {
    const wrong = steps.map((s, i) => ({ s, i })).filter(({ s }) => result.wrong_steps?.includes(s.id))
    return (
      <main className="page">
        {header}
        <div className="card stack center-text">
          <p className="eyebrow">{lesson.title}</p>
          <div className={`score ${result.passed ? 'pass' : 'fail'}`}>{result.score}%</div>
          {result.passed ? (
            <>
              <h1 className="h2">Well done{profile?.preferred_name ? `, ${profile.preferred_name}` : ''}!</h1>
              <p>You passed this lesson.{preview ? ' (Preview: nothing was saved or unlocked.)' : nextLesson ? ' The next lesson is now open.' : ''}</p>
            </>
          ) : (
            <>
              <h1 className="h2">Almost there</h1>
              <p>You need {result.pass_mark}% to pass. Practise only the {wrong.length} exercise{wrong.length === 1 ? '' : 's'} you missed.</p>
            </>
          )}
          {!result.preview && result.best_score != null && <p className="muted small">Best score: {result.best_score}%</p>}
          {result.passed && vocab.length > 0 && (
            <div className="vocab-box left-text">
              <h2 className="h3">{T.words}</h2>
              <VocabTable words={vocab} lang={lang} />
              <Link className="btn btn-ghost btn-sm" to={`/learn/lesson/${lesson.id}/words`}>{T.pdf}</Link>
            </div>
          )}
          {!preview && prog && <div className="row center-row"><StreakBar p={prog} compact /></div>}
          <div className="row center-row">
            {wrong.length > 0 && <button className="btn btn-primary" onClick={() => start(wrong.map(w => w.i))}>Practise what I missed</button>}
            {result.passed && nextLesson && !preview && <button className="btn btn-primary" onClick={() => navigate(`/learn/lesson/${nextLesson.id}`)}>Next lesson</button>}
            {preview && nextLesson && <button className="btn btn-primary" onClick={() => navigate(`/learn/lesson/${nextLesson.id}?preview=1`)}>Preview next lesson</button>}
            <Link className="btn btn-ghost" to={preview ? '/admin' : '/learn'}>{preview ? 'Back to admin' : 'Back to the hub'}</Link>
          </div>
        </div>
      </main>
    )
  }

  // play
  return (
    <main className="page">
      {header}
      <div className="player-top">
        <span className="small muted">{lesson.title}</span>
        <span className="small muted">Step {pos + 1} of {queue.length}</span>
      </div>
      <div className="progress"><div style={{ width: `${Math.round((pos / queue.length) * 100)}%` }} /></div>
      <div className="card">
        {current && (
          <StepView key={`${current.id}-${attemptKey}`} step={current} profile={profile}
            locked={!!feedback} busy={busy} onSubmit={submit} preview={preview} attempt={attemptKey} lang={course?.language || 'en'} />
        )}
        {error && <p className="error">{error}</p>}
        {feedback && (
          <div className={`feedback ${feedback.correct ? 'ok' : 'no'}`} role="status">
            <p className="feedback-title">{feedback.scores ? (feedback.correct ? `Well done! ${feedback.total}/8` : `${feedback.total}/8 — you need 5 to pass`) : feedback.correct ? (current.gradable ? 'Correct!' : 'Saved.') : feedback.final ? 'Not quite.' : 'Not quite — try once more.'}</p>
            {feedback.feedback && <p>{fill(feedback.feedback, profile)}</p>}
            {feedback.scores && <Rubric r={feedback} />}
            {feedback.explanation && <p className="small">{feedback.explanation}</p>}
            {feedback.explanation_es && (bilingual
              ? <p className="small es">{feedback.explanation_es}</p>
              : <details className="small"><summary>En español</summary><p>{feedback.explanation_es}</p></details>)}
            <div className="row">
              {!feedback.correct && !feedback.final
                ? <button className="btn btn-primary" onClick={retry}>Try again</button>
                : <button className="btn btn-primary" onClick={goNext} disabled={busy}>{pos + 1 < queue.length ? 'Continue' : 'See my result'}</button>}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

const CRITERIA = [['task', 'Task done'], ['target', 'Lesson target'], ['words', 'Words & spelling'], ['communication', 'Clear message']]

function Rubric({ r }) {
  return (
    <div className="rubric">
      <ul className="rubric-scores">
        {CRITERIA.map(([k, label]) => <li key={k}><span>{label}</span><span className="dots">{'●'.repeat(r.scores[k])}{'○'.repeat(2 - r.scores[k])}</span></li>)}
      </ul>
      {r.strength && <p><strong>Good:</strong> {r.strength}</p>}
      {r.corrections?.length > 0 && (
        <ul className="corrections">
          {r.corrections.map((x, i) => <li key={i}><s>{x.wrong}</s> → <strong>{x.right}</strong>{x.why ? <span className="small muted"> — {x.why}</span> : null}</li>)}
        </ul>
      )}
      {r.hint_es && <p className="small es">💬 {r.hint_es}</p>}
      {r.level_flag && <p className="small notice">This looks above beginner level. Please write it again with the words from this lesson.</p>}
    </div>
  )
}

// Labels for the helper texts per course language (Dutch course: Spanish helper; Spanish course: Dutch helper).
export const LESSON_UI = {
  nl: { tip2: 'Consejo:', tip: 'Tip:', words: 'Palabras de esta lección · Words in this lesson', pdf: 'Descargar PDF · Download PDF', save: 'Guardar como PDF · Save as PDF' },
  es: { tip2: 'Tip:', tip: 'In English:', words: 'Woorden van deze les · Words in this lesson', pdf: 'Download PDF', save: 'Opslaan als PDF · Save as PDF' },
}

// Word list of a lesson: the course language first, then its translations.
const VOCAB_COLS = {
  es: [['es', 'Español'], ['nl', 'Nederlands'], ['en', 'English']],
  default: [['nl', 'Nederlands'], ['en', 'English'], ['es', 'Español']],
}
export function VocabTable({ words, lang }) {
  const cols = VOCAB_COLS[lang] || VOCAB_COLS.default
  return (
    <table className="table vocab-table">
      <thead><tr>{cols.map(([, label]) => <th key={label}>{label}</th>)}</tr></thead>
      <tbody>{words.map((w, i) => <tr key={i}>{cols.map(([k], j) => <td key={k}>{j === 0 ? <strong>{w[k] ?? w.word}</strong> : w[k]}</td>)}</tr>)}</tbody>
    </table>
  )
}
