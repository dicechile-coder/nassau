import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { loadCourse } from '../lib/course.js'
import { Loading } from '../components/Guards.jsx'

export default function LessonPage() {
  const { lessonId } = useParams()
  const [params] = useSearchParams()
  const { isStaff } = useAuth()
  const preview = isStaff && params.get('preview') === '1'
  const [course, setCourse] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { loadCourse().then(setCourse).catch(e => setError(e.message)) }, [])

  if (error) return <main className="page"><p className="error">{error}</p></main>
  if (!course) return <Loading />
  const lesson = course.lessons.find(l => l.id === lessonId)
  if (!lesson) return <main className="page narrow"><h1 className="h2">Lesson not found</h1><Link to="/learn">Back to the hub</Link></main>

  if (lesson.state === 'locked' && !preview) {
    return (
      <main className="page narrow">
        <div className="card">
          <h1 className="h2">This lesson is still locked</h1>
          <p>Pass the previous lesson with at least 70% to unlock it.</p>
          {course.next && <Link className="btn btn-primary" to={`/learn/lesson/${course.next.id}`}>Go to your current lesson</Link>}
          <p><Link to="/learn">Back to the hub</Link></p>
        </div>
      </main>
    )
  }

  return (
    <main className="page narrow">
      {preview && <p className="notice">Administrator preview — your progress is not changed.</p>}
      <p className="small"><Link to="/learn">← Learning hub</Link></p>
      <div className="card">
        <p className="eyebrow">{course.title}</p>
        <h1 className="h2">{lesson.title}</h1>
        {lesson.objective && <p><strong>By the end of this lesson:</strong> {lesson.objective}</p>}
        {lesson.minutes && <p className="muted small">About {lesson.minutes} minutes</p>}
        <p className="notice">The lesson player arrives in Round 2.</p>
      </div>
    </main>
  )
}
