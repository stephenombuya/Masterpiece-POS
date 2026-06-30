import axios, { AxiosError } from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ── Request: attach JWT ───────────────────────────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('pos_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response: handle errors globally ─────────────────────────────────
api.interceptors.response.use(
  res => res,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pos_token')
      localStorage.removeItem('pos_user')
      window.location.href = '/login'
      return Promise.reject(error)
    }
    const msg = error.response?.data?.message ?? error.message ?? 'An error occurred'
    if (error.response?.status !== 404) toast.error(msg)
    return Promise.reject(error)
  }
)

export default api
