import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import type { UserRole } from '../types/user'

interface ProtectedRouteProps {
  /** Ролі, яким дозволено доступ до цього маршруту */
  allowedRoles: UserRole[]
}

/**
 * Обгортка для маршрутів, що вимагають автентифікації та відповідної ролі.
 * - Неавтентифікований → /login
 * - Роль не відповідає → /forbidden (403)
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />
  }

  return <Outlet />
}
