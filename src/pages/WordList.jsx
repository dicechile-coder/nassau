import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { loadCourse, courseCodeForLesson } from '../lib/course.js'
import { Loading } from '../components/Guards.jsx'
import { VocabTable } from './LessonPage.jsx'

// Printable word list of one lesson. "Save as PDF" uses the browser's print dialog.
export default function WordList() {
  const { lessonId } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    courseCodeForLesson(lessonId).then(code => loadCourse(code || undefined)).then(c => {
      const lesson = c?.lessons.find(l => l.id === lessonId)
      if (!lesson) setError('Lesson not found'); else setData({ course: c, lesson })
    }).catch(e => setError(e.message))
  }, [lessonId])
  useEffect(() => {
    if (data) document.title = `${data.course.title} · ${data.lesson.title} · Words`
  }, [data])
  if (error) return <main className="page"><p className="error">{error}</p></main>
  if (!data) return <Loading />
  const { course, lesson } = data
  const words = Array.isArray(lesson.vocab) ? lesson.vocab : []
  return (
    <main className="page narrow wordlist">
      <div className="no-print row">
        <Link className="small" to={`/learn/lesson/${lesson.id}`}>← Back to the lesson</Link>
        <button className="btn btn-primary btn-sm" onClick={() => window.print()}>Guardar como PDF · Save as PDF</button>
      </div>
      <header className="wordlist-head">
        <img src="/site/logo.png" alt="Nassau Academy" height="40" />
        <div>
          <p className="eyebrow">{course.title} · Lesson {lesson.position}</p>
          <h1 className="h2">{lesson.title}</h1>
        </div>
      </header>
      {words.length ? <VocabTable words={words} /> : <p className="muted">No word list for this lesson yet.</p>}
      <p className="small muted">Nassau Academy · nassauacademy.com</p>
    </main>
  )
}
