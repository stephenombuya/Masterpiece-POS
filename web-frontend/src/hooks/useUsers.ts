import { useState, useEffect, useCallback } from 'react'
import { userService } from '@/services/userService'
import type { User } from '@/types'
import toast from 'react-hot-toast'

export function useUsers() {
  const [users, setUsers]     = useState<User[]>([])
  const [roles, setRoles]     = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [u, r] = await Promise.all([userService.getAll(), userService.getRoles()])
      setUsers(u)
      setRoles(r)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const createUser = async (data: Parameters<typeof userService.create>[0]) => {
    const u = await userService.create(data)
    setUsers(prev => [...prev, u])
    toast.success('User created')
    return u
  }

  const updateUser = async (id: number, data: Partial<User>) => {
    const u = await userService.update(id, data)
    setUsers(prev => prev.map(x => x.id === id ? u : x))
    toast.success('User updated')
    return u
  }

  const deactivateUser = async (id: number) => {
    await userService.deactivate(id)
    setUsers(prev => prev.map(x => x.id === id ? { ...x, active: false } : x))
    toast.success('User deactivated')
  }

  return { users, roles, loading, reload: load, createUser, updateUser, deactivateUser }
}
