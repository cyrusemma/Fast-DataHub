import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, profile } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  if (allowedRoles && !allowedRoles.includes(profile?.role)) return <Navigate to="/" replace />
  return children
}
