import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { currentCourseCode, languageOf, LANGUAGE_NAMES } from '../lib/course.js'

// Inside a course (/learn…): "Nassau Academy English|Dutch|Spanish", the language in its own colour.
// Everywhere else (sign in, admin, …): just the logo.
function useCourseLanguage() {
  const [lang, setLang] = useState(() => languageOf(currentCourseCode()))
  useEffect(() => {
    const on = (e) => setLang(languageOf(e.detail))
    window.addEventListener('nassau:course', on)
    return () => window.removeEventListener('nassau:course', on)
  }, [])
  return lang
}

export default function Header() {
  const { user, profile, isStaff, signOut } = useAuth()
  const navigate = useNavigate()
  const logout = async () => { await signOut(); navigate('/') }
  const { pathname } = useLocation()
  const lang = useCourseLanguage()
  const inCourse = pathname.startsWith('/learn')
  return (
    <header className="header">
      {inCourse ? (
        <Link to="/learn" className="brand">
          <img src="/site/logo-icon.png" alt="" width="28" height="28" />
          <span className="brand-name">Nassau Academy</span> <span className={`brand-lang lang-${lang}`}>{LANGUAGE_NAMES[lang] || LANGUAGE_NAMES.en}</span>
        </Link>
      ) : (
        <Link to={user ? '/learn' : '/'} className="brand brand-logo" aria-label="Nassau Academy">
          <img src="/site/logo.png" alt="Nassau Academy" width="143" height="36" />
        </Link>
      )}
      <nav className="nav">
        {user ? (
          <>
            <Link to="/learn/progress" className="hide-sm">Progress</Link>
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
