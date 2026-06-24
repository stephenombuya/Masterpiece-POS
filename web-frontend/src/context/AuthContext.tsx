import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { authService } from '@/services/authService'
import type { User, LoginRequest } from '@/types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  isManagerOrAbove: boolean
  login: (data: LoginRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(authService.getStoredUser)

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authService.login(data)
    authService.storeSession(res.token, res.user)
    setUser(res.user)
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const roleName = user?.roleName?.toUpperCase() ?? ''

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isAdmin: roleName === 'ADMIN',
      isManagerOrAbove: roleName === 'ADMIN' || roleName === 'MANAGER',
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
