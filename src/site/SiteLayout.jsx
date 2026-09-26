import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { SITE } from '../lib/site.js'
import { IconMenu, IconClose } from './icons.jsx'
import './site.css'

const NAV = [
  ['/courses', 'Courses'],
  ['/how-it-works', 'How it works'],
  ['/pricing', 'Pricing'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
]

// Sets the browser title and meta description per page (helps sharing and search).
export function usePageMeta(title, description) {
  useEffect(() => {
    document.title = title ? `${title} · Nassau Academy` : 'Nassau Academy · The Future of Learning'
    const meta = document.querySelector('meta[name="description"]')
    if (meta && description) meta.setAttribute('content', description)
  }, [title, description])
}

function SiteHeader() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => { setOpen(false) }, [pathname])
  return (
    <header className="s-header">
      <div className="s-wrap">
        <Link to="/" className="s-logo" aria-label="Nassau Academy home">
          <img src="/site/logo.png" alt="Nassau Academy" width="172" height="44" />
        </Link>
        <nav className="s-nav" aria-label="Main">
          {NAV.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
        </nav>
        <div className="s-header-actions">
          <a href={SITE.moodleUrl} className="s-moodle" target="_blank" rel="noopener" title="Teacher-led classes on Moodle">
            <img src="/site/moodle-icon.png" alt="" width="32" height="22" /> Moodle
          </a>
          {user ? (
            <Link to="/learn" className="s-btn s-btn-primary s-btn-sm">My lessons</Link>
          ) : (
            <>
              <Link to="/login" className="s-login">Log in</Link>
              <Link to="/signup" className="s-btn s-btn-primary s-btn-sm">Try a free lesson</Link>
            </>
          )}
        </div>
        <button type="button" className="s-menu-btn" aria-expanded={open} aria-controls="s-mobile-nav"
                aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(o => !o)}>
          {open ? <IconClose /> : <IconMenu />}
        </button>
      </div>
      <nav id="s-mobile-nav" className={`s-mobile-nav${open ? ' open' : ''}`} aria-label="Mobile">
        {NAV.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}
        <a href={SITE.moodleUrl} target="_blank" rel="noopener" className="s-moodle-m"><img src="/site/moodle-icon.png" alt="" width="29" height="20" /> Moodle (teacher-led classes)</a>
        {user ? <Link to="/learn" className="s-btn s-btn-primary">My lessons</Link> : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/signup" className="s-btn s-btn-primary">Try a free lesson</Link>
          </>
        )}
      </nav>
    </header>
  )
}

function SiteFooter() {
  return (
    <footer className="s-footer">
      <div className="s-wrap">
        <div className="s-footer-top">
          <div>
            <img src="/site/logo.png" alt="Nassau Academy" width="196" height="50" />
            <p className="s-text">The Future of Learning. Dutch, English and Spanish courses made in Curaçao, for learners everywhere.</p>
          </div>
          <div className="s-footer-cols">
            <div>
              <h4>Learn</h4>
              <Link to="/courses">Courses</Link>
              <Link to="/how-it-works">How it works</Link>
              <Link to="/pricing">Pricing</Link>
              <Link to="/signup">Free English lesson</Link>
            </div>
            <div>
              <h4>Academy</h4>
              <Link to="/about">About</Link>
              <Link to="/placement">Placement talk</Link>
              <a href={SITE.moodleUrl} target="_blank" rel="noopener">Teacher-led classes</a>
              <Link to="/contact">Contact</Link>
            </div>
            <div>
              <h4>Contact</h4>
              <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
              <a href={SITE.whatsappUrl} target="_blank" rel="noopener">WhatsApp {SITE.whatsapp}</a>
              <a href={SITE.instagramUrl} target="_blank" rel="noopener">Instagram {SITE.instagram}</a>
            </div>
          </div>
        </div>
        <div className="s-footer-bottom">
          <span>© {new Date().getFullYear()} {SITE.legalName} · {SITE.country}</span>
          <nav aria-label="Legal">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export default function SiteLayout({ children, plain }) {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return (
    <div className="site">
      <a href="#main" className="s-skip" style={{ position: 'absolute', left: -9999 }}>Skip to content</a>
      <SiteHeader />
      {plain ? <div id="main">{children}</div> : <main id="main">{children}</main>}
      <SiteFooter />
    </div>
  )
}
