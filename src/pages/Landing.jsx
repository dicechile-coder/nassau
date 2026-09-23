import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'

export default function Landing() {
  const { user, loading } = useAuth()
  if (!loading && user) return <Navigate to="/learn" replace />
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Nassau Academy English · Beta</p>
        <h1>Speak English with confidence — one clear lesson at a time.</h1>
        <p className="lead">A structured course for beginners, with story videos, interactive exercises and a personal AI tutor. Built with Spanish-speaking learners in mind.</p>
        <div className="row">
          <Link to="/signup" className="btn btn-primary">Start Level A1.1</Link>
          <Link to="/login" className="btn btn-ghost">Sign in</Link>
        </div>
      </section>
      <p className="muted small">This is the beta version of the new platform.</p>
    </main>
  )
}
