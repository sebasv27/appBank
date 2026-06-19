// src/components/layout/Layout.tsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ArrowLeftRight, Wallet, Target,
  Bell, LogOut, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useQuery } from '@tanstack/react-query'
import { alertApi } from '../../services/api'

const NAV = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/gastos',       icon: ArrowLeftRight,  label: 'Gastos' },
  { to: '/presupuestos', icon: Wallet,           label: 'Presupuestos' },
  { to: '/metas',        icon: Target,           label: 'Metas' },
  { to: '/alertas',      icon: Bell,             label: 'Alertas' },
]

export default function Layout() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const { data: alertsData } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertApi.list().then(r => r.data),
    refetchInterval: 60_000
  })
  const unread = alertsData?.data?.filter((a: { isRead: boolean }) => !a.isRead).length || 0

  const handleLogout = () => { logout(); navigate('/login') }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm">$</div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">Control Gastos</p>
            <p className="text-white/50 text-xs mt-0.5">{user?.name}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
               ${isActive
                 ? 'bg-brand-600 text-white font-medium'
                 : 'text-white/60 hover:bg-white/10 hover:text-white'}`
            }
          >
            <Icon size={18} />
            {label}
            {label === 'Alertas' && unread > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:bg-white/10 hover:text-white transition-all w-full"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-dark shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-56 bg-dark z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
          <button onClick={() => setOpen(true)} className="p-1.5 rounded-lg hover:bg-slate-100">
            <Menu size={20} />
          </button>
          <span className="font-semibold text-dark">Control Gastos</span>
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
