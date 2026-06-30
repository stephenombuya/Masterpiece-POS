import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { cn, getInitials } from '@/utils'
import {
  ShoppingCart, Package, Warehouse, BarChart2, Users,
  LogOut, Menu, X, Bell, ChevronDown,
} from 'lucide-react'

const NAV = [
  { to: '/sale',      label: 'New Sale',   icon: ShoppingCart },
  { to: '/products',  label: 'Products',   icon: Package },
  { to: '/inventory', label: 'Inventory',  icon: Warehouse },
  { to: '/reports',   label: 'Reports',    icon: BarChart2 },
  { to: '/users',     label: 'Users',      icon: Users },
]

export function AppLayout() {
  const { user, logout, isManagerOrAbove } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const visibleNav = NAV.filter(n => n.to !== '/users' || isManagerOrAbove)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside className={cn(
        'flex flex-col bg-[#0d2b55] text-white transition-all duration-200 shrink-0',
        sidebarOpen ? 'w-56' : 'w-16',
      )}>
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-sm font-bold shrink-0">
            R
          </div>
          {sidebarOpen && <span className="font-bold text-base tracking-tight">RetailPOS</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {visibleNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon size={18} className="shrink-0"/>
              {sidebarOpen && label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-2 pb-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white text-sm transition-colors"
          >
            <LogOut size={18} className="shrink-0"/>
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-4 shrink-0 shadow-sm">
          <button
            onClick={() => setSidebarOpen(p => !p)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            {sidebarOpen ? <X size={18}/> : <Menu size={18}/>}
          </button>

          <div className="flex-1"/>

          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 relative">
            <Bell size={18}/>
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(p => !p)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-primary-700 text-white text-xs font-bold flex items-center justify-center">
                {getInitials(user?.fullName ?? 'U')}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-gray-800 leading-none">{user?.fullName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{user?.roleName}</p>
              </div>
              <ChevronDown size={14} className="text-gray-400"/>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1">
                <div className="px-3 py-2 border-b border-gray-50">
                  <p className="text-xs font-semibold text-gray-700">{user?.fullName}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-danger-600 hover:bg-danger-50 transition-colors"
                >
                  <LogOut size={14}/> Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet/>
        </main>
      </div>
    </div>
  )
}
