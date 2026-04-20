import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { CuratorGlobalRole } from '../types/user'
import type { MeContext } from '../types/org'
import type { UserRole } from '../types/user'
import { fetchMeContext } from '../api/api'
import { apiClient } from '../api/apiClient'

interface AuthUser {
  userId: number
  email: string
  firstName: string
  lastName: string
  role: UserRole
  curatorGlobalRole?: CuratorGlobalRole
}

interface AuthContextValue {
  token: string | null
  user: AuthUser | null
  /** Контекст організацій з user-service після логіну та при refreshMeContext */
  meContext: MeContext | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshMeContext: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

const LS_TOKEN = 'thesis-auth-token'
const LS_USER = 'thesis-auth-user'

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(loadToken)
  const [user, setUser] = useState<AuthUser | null>(loadUser)
  const [meContext, setMeContext] = useState<MeContext | null>(null)

  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common.Authorization = `Bearer ${token}`
    } else {
      delete apiClient.defaults.headers.common.Authorization
    }
  }, [token])

  const refreshMeContext = useCallback(async () => {
    const t = localStorage.getItem(LS_TOKEN)
    if (!t) {
      setMeContext(null)
      return
    }
    apiClient.defaults.headers.common.Authorization = `Bearer ${t}`
    try {
      const ctx = await fetchMeContext()
      setMeContext(ctx)
    } catch {
      setMeContext(null)
    }
  }, [])

  useEffect(() => {
    if (token) {
      void refreshMeContext()
    } else {
      setMeContext(null)
    }
  }, [token, refreshMeContext])

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiClient.post<{
      token: string
      userId: number
      email: string
      firstName: string
      lastName: string
      role: UserRole
      curatorGlobalRole?: CuratorGlobalRole
    }>('/auth/login', { email, password })

    const { token: jwt, userId, firstName, lastName, role } = res.data
    const authUser: AuthUser = {
      userId,
      email: res.data.email,
      firstName,
      lastName,
      role,
      curatorGlobalRole: res.data.curatorGlobalRole,
    }

    localStorage.setItem(LS_TOKEN, jwt)
    localStorage.setItem(LS_USER, JSON.stringify(authUser))
    apiClient.defaults.headers.common.Authorization = `Bearer ${jwt}`
    setToken(jwt)
    setUser(authUser)

    try {
      const ctx = await fetchMeContext()
      setMeContext(ctx)
    } catch {
      setMeContext(null)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(LS_TOKEN)
    localStorage.removeItem(LS_USER)
    delete apiClient.defaults.headers.common.Authorization
    setToken(null)
    setUser(null)
    setMeContext(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      meContext,
      login,
      logout,
      refreshMeContext,
      isAuthenticated: token !== null,
    }),
    [token, user, meContext, login, logout, refreshMeContext],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>')
  }
  return ctx
}
