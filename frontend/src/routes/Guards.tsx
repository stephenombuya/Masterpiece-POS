import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function RequireAuth() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Outlet/> : <Navigate to="/login" replace/>
}

export function RequireManager() {
  const { isManagerOrAbove } = useAuth()
  return isManagerOrAbove ? <Outlet/> : <Navigate to="/sale" replace/>
}

export function RedirectIfAuth() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/sale" replace/> : <Outlet/>
}
