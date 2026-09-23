import { Link } from 'react-router-dom'
import { SITE } from '../lib/site.js'

export default function Footer() {
  return (
    <footer className="footer">
      <span>© {new Date().getFullYear()} {SITE.legalName} · {SITE.country}</span>
      <nav>
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <a href={`mailto:${SITE.contactEmail}`}>Contact</a>
      </nav>
    </footer>
  )
}
