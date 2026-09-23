import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'

const FEATURES = [
  ['🎬', 'Story videos', 'Every lesson starts with a short animated episode: four friends meet at Nassau Academy in Curaçao and learn English together.'],
  ['✅', 'Practise and get instant feedback', 'Short exercises check your answers straight away, with tips written for Spanish speakers.'],
  ['💬', 'Talk to an AI tutor', 'Have real mini-conversations with the characters and get friendly corrections — any time of day.'],
  ['✍️', 'Writing with personal feedback', 'Write short messages and forms. The AI tutor gives you a score, what went well and what to fix.'],
  ['🔥', 'Keep a streak', 'Earn XP, keep your daily streak (with one free "freeze" a week) and see your progress.'],
  ['🎯', 'Real A1 level', 'The course follows the CEFR A1 descriptions, step by step, lesson by lesson.'],
]

const MODULES = [
  ['First conversations & personal identity', 'Greetings, names, countries, spelling, meeting people'],
  ['Family, belongings & descriptions', 'Family members, everyday objects, colours, describing people'],
  ['Daily routine, time & frequency', 'Telling the time, days, routines, he/she/it + -s'],
  ['Around town, places & prepositions', 'Places in the city, directions, in / on / at, there is / there are'],
]

const FAQ = [
  ['Who is this course for?', 'Beginners (and false beginners) who want a clear, structured start in English. Explanations are in simple English, with Spanish help where it matters.'],
  ['Is there a teacher?', 'This is a self-study course. The exercises and the AI tutor give you feedback, so you can learn at your own pace. For classes with a teacher, see Nassau Academy’s regular courses.'],
  ['How long does it take?', 'Level A1.1 has 16 lessons of about 20–30 minutes. Many students do 3–4 lessons a week.'],
  ['What does it cost?', 'The beta is free. Prices for the full version will be announced before launch.'],
  ['What do I need?', 'A phone, tablet or computer with internet. No app to install.'],
]

export default function Landing() {
  const { user, loading } = useAuth()
  if (!loading && user) return <Navigate to="/learn" replace />
  return (
    <main className="page landing">
      <section className="hero">
        <p className="eyebrow">Nassau Academy English · Beta</p>
        <h1>Speak English with confidence — one clear lesson at a time.</h1>
        <p className="lead">A self-study course for beginners with story videos, interactive exercises and a personal AI tutor. Made in Curaçao, built for Spanish-speaking learners.</p>
        <div className="row">
          <Link to="/signup" className="btn btn-primary">Start Level A1.1 — free in beta</Link>
          <Link to="/login" className="btn btn-ghost">Sign in</Link>
        </div>
      </section>

      <section>
        <h2 className="h3">How it works</h2>
        <div className="features">
          {FEATURES.map(([icon, title, text]) => (
            <div key={title} className="card feature">
              <div className="feature-icon" aria-hidden="true">{icon}</div>
              <h3 className="h4">{title}</h3>
              <p className="small muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="h3">Level A1.1 — 4 modules, 16 lessons</h2>
        <ol className="module-list">
          {MODULES.map(([title, text], i) => (
            <li key={title}><strong>Module {i + 1}: {title}</strong><br /><span className="small muted">{text}</span></li>
          ))}
        </ol>
        <p className="small muted">Each module ends with a checkpoint. Pass a lesson with 70% or more to unlock the next one. Level A1.2 follows after A1.1.</p>
      </section>

      <section>
        <h2 className="h3">Questions</h2>
        {FAQ.map(([q, a]) => (
          <details key={q} className="faq">
            <summary>{q}</summary>
            <p className="small">{a}</p>
          </details>
        ))}
      </section>

      <section className="card cta">
        <h2 className="h3">Ready for your first lesson?</h2>
        <p className="small muted">Create a free account and start with “Hello, I’m…”.</p>
        <Link to="/signup" className="btn btn-primary">Create my free account</Link>
      </section>
    </main>
  )
}
