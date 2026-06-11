import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, QrCode, BarChart3, Palette, Upload,
  Settings, LogOut, ScanLine, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/qr-codes',      icon: QrCode,          label: 'QR Codes' },
  { to: '/analytics',     icon: BarChart3,        label: 'Analytics' },
  { to: '/design-studio', icon: Palette,          label: 'Design Studio' },
  { to: '/bulk-upload',   icon: Upload,           label: 'Bulk Upload' },
  { to: '/settings',      icon: Settings,         label: 'Settings' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out')
      navigate('/login')
    } catch {
      toast.error('Sign out failed')
    }
  }

  return (
    <aside
      className={`
        flex flex-col bg-sidebar border-r border-sidebar-border
        transition-all duration-300 flex-shrink-0
        ${collapsed ? 'w-16' : 'w-56'}
      `}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border gap-3 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-navkar-700 flex items-center justify-center flex-shrink-0">
          <ScanLine size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-bold text-sm text-sidebar-foreground leading-tight truncate">Navkar QR</p>
            <p className="text-xs text-muted-foreground truncate">Manager</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${isActive
                ? 'bg-navkar-700 text-white'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }
              ${collapsed ? 'justify-center' : ''}
            `}
            title={collapsed ? label : undefined}
          >
            <Icon size={16} className="flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        <button
          onClick={handleSignOut}
          className={`
            w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
            text-muted-foreground hover:bg-red-50 hover:text-red-600
            dark:hover:bg-red-900/20 transition-colors
            ${collapsed ? 'justify-center' : ''}
          `}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className={`
            w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
            text-muted-foreground hover:bg-sidebar-accent transition-colors
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
