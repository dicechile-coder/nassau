import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'

export function Loading() {
  return <div className="center muted">Loading…</div>
}

export function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

export function RequireStaff({ children }) {
  const { user, profile, isStaff, loading } = useAuth()
  if (loading || (user && !profile)) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  if (!isStaff) return <Navigate to="/learn" replace />
  return children
}
