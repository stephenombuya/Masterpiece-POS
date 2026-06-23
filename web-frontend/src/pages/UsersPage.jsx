// src/pages/UsersPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, X, Loader, UserCheck, UserX } from 'lucide-react';
import { userApi } from '../services/api';

const inputCls = `w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500`;

const roleBadge = {
  ADMIN:   'bg-purple-500/10 text-purple-400',
  MANAGER: 'bg-blue-500/10 text-blue-400',
  CASHIER: 'bg-slate-700 text-slate-300',
};

export default function UsersPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getAll().then(r => r.data),
  });

  const { mutate: toggleUser } = useMutation({
    mutationFn: (id) => userApi.toggle(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User updated'); },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { mutate: createUser, isPending } = useMutation({
    mutationFn: (data) => userApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created!');
      reset();
      setShowModal(false);
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Failed to create user'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Users</h1>
          <p className="text-slate-400 text-sm">{users.length} system users</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white
                     font-semibold px-4 py-2 rounded-lg transition text-sm">
          <Plus size={16} />Add User
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 text-left">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading…</td></tr>
            ) : users.map(user => (
              <tr key={user.id} className="hover:bg-slate-800/50 transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center
                                    justify-center text-emerald-400 text-xs font-bold">
                      {user.fullName?.[0]}
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.fullName}</p>
                      <p className="text-slate-500 text-xs">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-400 font-mono text-xs">{user.username}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${roleBadge[user.role] ?? ''}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium
                    ${user.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {user.active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggleUser(user.id)}
                    className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded transition
                      ${user.active
                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}>
                    {user.active
                      ? <><UserX size={12} />Disable</>
                      : <><UserCheck size={12} />Enable</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-white font-bold text-lg">New User</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(createUser)} className="p-5 space-y-4">
              {[
                { name: 'fullName',  label: 'Full Name',  type: 'text',     placeholder: 'John Doe'          },
                { name: 'username',  label: 'Username',   type: 'text',     placeholder: 'jdoe'              },
                { name: 'email',     label: 'Email',      type: 'email',    placeholder: 'john@store.com'    },
                { name: 'password',  label: 'Password',   type: 'password', placeholder: '••••••••'          },
              ].map(({ name, label, type, placeholder }) => (
                <div key={name}>
                  <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
                  <input {...register(name, { required: `${label} is required` })}
                    type={type} placeholder={placeholder} className={inputCls} />
                  {errors[name] && <p className="text-red-400 text-xs mt-1">{errors[name].message}</p>}
                </div>
              ))}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Role</label>
                <select {...register('role', { required: 'Role is required' })} className={inputCls}>
                  <option value="CASHIER">Cashier</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={isPending}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white
                             font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm">
                  {isPending && <Loader size={14} className="animate-spin" />}
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
