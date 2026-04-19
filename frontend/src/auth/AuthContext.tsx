import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { UserRole } from '../types/user'
import { apiClient } from '../api/apiClient'

/* ─── Типи ─────────────────────────────────────────────── */

interface AuthUser {
  userId: number
  email: string
  firstName: string
  lastName: string
  role: UserRole
}

interface AuthContextValue {
  /** JWT-токен або null, якщо не автентифікований */
  token: string | null
  /** Дані поточного користувача */
  user: AuthUser | null
  /** Виконати логін; кидає помилку при невдалій спробі */
  login: (email: string, password: string) => Promise<void>
  /** Вийти з системи */
  logout: () => void
  /** Чи ідентифіковано токен (не null) */
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

/* ─── Local Storage Keys ───────────────────────────────── */

const LS_TOKEN = 'thesis-auth-token'
const LS_USER = 'thesis-auth-user'

/* ─── Допоміжні ────────────────────────────────────────── */

function loadToken(): string | null {
  return localStorage.getItem(LS_TOKEN)
}

function loadUser(): AuthUser | null {
  const raw = localStorage.getItem(LS_USER)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

/* ─── Provider ─────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(loadToken)
  const [user, setUser] = useState<AuthUser | null>(loadUser)

  /* Синхронізуємо заголовок Authorization при зміні токена */
  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete apiClient.defaults.headers.common['Authorization']
    }
  }, [token])

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiClient.post<{
      token: string
      userId: number
      email: string
      firstName: string
      lastName: string
      role: UserRole
    }>('/auth/login', { email, password })

    const { token: jwt, userId, firstName, lastName, role } = res.data
    const authUser: AuthUser = {
      userId,
      email: res.data.email,
      firstName,
      lastName,
      role,
    }

    localStorage.setItem(LS_TOKEN, jwt)
    localStorage.setItem(LS_USER, JSON.stringify(authUser))
    setToken(jwt)
    setUser(authUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(LS_TOKEN)
    localStorage.removeItem(LS_USER)
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      login,
      logout,
      isAuthenticated: token !== null,
    }),
    [token, user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* ─── Hook ─────────────────────────────────────────────── */

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>')
  }
  return ctx
}
