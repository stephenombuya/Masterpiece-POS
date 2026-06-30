import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useUsers } from '@/hooks/useUsers'
import { getInitials } from '@/utils'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card, CardHeader, Badge, Modal, Table, Th, Td, PageSpinner, EmptyState, ConfirmDialog } from '@/components/ui/index'
import { Plus, Edit2, UserX, Users } from 'lucide-react'
import type { User } from '@/types'

interface UserForm {
  username: string
  fullName: string
  email: string
  password: string
  roleId: number
  active: boolean
}

export default function UsersPage() {
  const { users, roles, loading, createUser, updateUser, deactivateUser } = useUsers()
  const [editing, setEditing]       = useState<User | null>(null)
  const [modalOpen, setModalOpen]   = useState(false)
  const [deactivating, setDeactivating] = useState<User | null>(null)
  const [deactLoading, setDeactLoading] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UserForm>()

  const openCreate = () => { setEditing(null); reset({ active: true }); setModalOpen(true) }
  const openEdit   = (u: User) => { setEditing(u); reset({ ...u, password: '' }); setModalOpen(true) }

  const onSubmit = async (data: UserForm) => {
    if (editing) {
      await updateUser(editing.id, { fullName: data.fullName, email: data.email, roleId: Number(data.roleId), active: data.active })
    } else {
      await createUser({ username: data.username, fullName: data.fullName, email: data.email, roleId: Number(data.roleId), password: data.password })
    }
    setModalOpen(false)
    reset()
  }

  const handleDeactivate = async () => {
    if (!deactivating) return
    setDeactLoading(true)
    try { await deactivateUser(deactivating.id); setDeactivating(null) }
    finally { setDeactLoading(false) }
  }

  const roleOptions = roles.map(r => ({ value: r.id, label: r.name }))

  if (loading) return <PageSpinner/>

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="User Management"
          subtitle={`${users.length} users`}
          action={
            <Button onClick={openCreate} size="sm">
              <Plus size={14}/> New User
            </Button>
          }
        />

        {users.length === 0 ? (
          <EmptyState icon={<Users size={40}/>} title="No users found"/>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>User</Th>
                <Th>Username</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {getInitials(u.fullName)}
                      </div>
                      <span className="font-medium text-gray-900">{u.fullName}</span>
                    </div>
                  </Td>
                  <Td className="font-mono text-xs">{u.username}</Td>
                  <Td className="text-gray-500">{u.email ?? '—'}</Td>
                  <Td>
                    <Badge variant={u.roleName === 'ADMIN' ? 'info' : u.roleName === 'MANAGER' ? 'warning' : 'neutral'}>
                      {u.roleName}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge variant={u.active ? 'success' : 'neutral'}>
                      {u.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(u)} className="text-primary-600 hover:text-primary-800">
                        <Edit2 size={14}/>
                      </button>
                      {u.active && (
                        <button onClick={() => setDeactivating(u)} className="text-danger-500 hover:text-danger-700">
                          <UserX size={14}/>
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* User Form Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit User' : 'New User'} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Username *"
              placeholder="jdoe"
              disabled={!!editing}
              error={errors.username?.message}
              {...register('username', { required: !editing && 'Username is required' })}
            />
            <Input
              label="Full Name *"
              placeholder="Jane Doe"
              error={errors.fullName?.message}
              {...register('fullName', { required: 'Full name is required' })}
            />
          </div>
          <Input
            label="Email"
            type="email"
            placeholder="jane@example.com"
            {...register('email')}
          />
          {!editing && (
            <Input
              label="Password *"
              type="password"
              placeholder="Min 8 characters"
              error={errors.password?.message}
              {...register('password', { required: !editing && 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })}
            />
          )}
          <Select
            label="Role *"
            options={roleOptions}
            placeholder="Select role"
            error={errors.roleId?.message}
            {...register('roleId', { required: 'Role is required', valueAsNumber: true })}
          />
          {editing && (
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" {...register('active')} className="rounded"/>
              Active
            </label>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>
              {editing ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deactivating}
        onClose={() => setDeactivating(null)}
        onConfirm={handleDeactivate}
        title="Deactivate User"
        message={`Are you sure you want to deactivate "${deactivating?.fullName}"? They will lose access immediately.`}
        confirmLabel="Deactivate"
        danger
        loading={deactLoading}
      />
    </div>
  )
}
