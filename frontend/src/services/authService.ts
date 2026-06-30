import api from './api'
import type { LoginRequest, LoginResponse, User } from '@/types'

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await api.post<LoginResponse>('/auth/login', data)
    return res.data
  },

  register: async (data: Partial<User> & { password: string }): Promise<User> => {
    const res = await api.post<User>('/auth/register', data)
    return res.data
  },

  logout: () => {
    localStorage.removeItem('pos_token')
    localStorage.removeItem('pos_user')
  },

  getStoredUser: (): User | null => {
    const raw = localStorage.getItem('pos_user')
    return raw ? JSON.parse(raw) : null
  },

  getToken: (): string | null => localStorage.getItem('pos_token'),

  storeSession: (token: string, user: User) => {
    localStorage.setItem('pos_token', token)
    localStorage.setItem('pos_user', JSON.stringify(user))
  },
}
