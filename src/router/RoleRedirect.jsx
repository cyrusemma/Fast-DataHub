import { Navigate } from 'react-router-dom'
import { useRole } from '../hooks/useRole'

export function RoleRedirect() {
  const { dashboardPath } = useRole()
  return <Navigate to={dashboardPath} replace />
}
