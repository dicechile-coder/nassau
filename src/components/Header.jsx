import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'

export default function Header() {
  const { user, profile, isStaff, signOut } = useAuth()
  const navigate = useNavigate()
  const logout = async () => { await signOut(); navigate('/') }
  return (
    <header className="header">
      <Link to={user ? '/learn' : '/'} className="brand">Nassau Academy <span>English</span></Link>
      <nav className="nav">
        {user ? (
          <>
            {isStaff && <Link to="/admin">Admin</Link>}
            <span className="muted hide-sm">{profile?.preferred_name || user.email}</span>
            <button className="btn btn-ghost" onClick={logout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login">Sign in</Link>
            <Link to="/signup" className="btn btn-primary">Start free</Link>
          </>
        )}
      </nav>
    </header>
  )
}
