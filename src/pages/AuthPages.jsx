import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'

function AuthCard({ title, children }) {
  return (
    <main className="page narrow">
      <div className="card">
        <h1 className="h2">{title}</h1>
        {children}
      </div>
    </main>
  )
}

export function Login() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to={location.state?.from || '/learn'} replace />

  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setError(error.message === 'Email not confirmed'
      ? 'Please confirm your email first. Check your inbox.'
      : 'Invalid email or password.')
    else navigate(location.state?.from || '/learn', { replace: true })
  }
  return (
    <AuthCard title="Sign in">
      <form onSubmit={submit} className="form">
        <label>Email<input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label>Password<input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="small"><Link to="/forgot-password">Forgot your password?</Link></p>
      <p className="small">No account yet? <Link to="/signup">Create one</Link></p>
    </AuthCard>
  )
}

export function Signup() {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accept, setAccept] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to="/learn" replace />

  const submit = async (e) => {
    e.preventDefault(); setError('')
    if (password.length < 10) return setError('Use at least 10 characters for your password.')
    if (!accept) return setError('Please accept the Terms of Use and Privacy Policy.')
    setBusy(true)
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}/learn` },
    })
    setBusy(false)
    if (error) return setError(error.message)
    if (!data.session) setDone(true)
  }
  if (done) return (
    <AuthCard title="Check your email">
      <p>We sent a confirmation link to <strong>{email}</strong>. Open it to activate your account, then sign in.</p>
    </AuthCard>
  )
  return (
    <AuthCard title="Create your free account">
      <form onSubmit={submit} className="form">
        <label>Name<input required autoComplete="name" placeholder="María González" value={name} onChange={e => setName(e.target.value)} /></label>
        <label>Email<input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label>Password<input type="password" required autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} />
          <span className="hint">At least 10 characters.</span></label>
        <label className="check"><input type="checkbox" checked={accept} onChange={e => setAccept(e.target.checked)} />
          <span>I accept the <Link to="/terms" target="_blank">Terms of Use</Link> and <Link to="/privacy" target="_blank">Privacy Policy</Link>.</span></label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create my account'}</button>
      </form>
      <p className="small">Already have an account? <Link to="/login">Sign in</Link></p>
    </AuthCard>
  )
}

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault(); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/update-password` })
    if (error) setError(error.message); else setSent(true)
  }
  return (
    <AuthCard title="Reset your password">
      {sent ? <p>If an account exists for <strong>{email}</strong>, you will receive a reset link.</p> : (
        <form onSubmit={submit} className="form">
          <label>Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary">Send reset link</button>
        </form>
      )}
      <p className="small"><Link to="/login">Back to sign in</Link></p>
    </AuthCard>
  )
}

export function UpdatePassword() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (loading) return <div className="center muted">Loading…</div>
  if (!user) return (
    <AuthCard title="Link expired">
      <p>This reset link is no longer valid. <Link to="/forgot-password">Request a new one</Link>.</p>
    </AuthCard>
  )
  const submit = async (e) => {
    e.preventDefault(); setError('')
    if (password.length < 10) return setError('Use at least 10 characters.')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) setError(error.message); else navigate('/learn', { replace: true })
  }
  return (
    <AuthCard title="Choose a new password">
      <form onSubmit={submit} className="form">
        <label>New password<input type="password" required autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>Save password</button>
      </form>
    </AuthCard>
  )
}
