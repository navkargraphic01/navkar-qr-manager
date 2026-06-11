import { Link, useLocation } from 'react-router-dom'
import { Search, Plus, Bell, Sun, Moon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const PAGE_TITLES = {
  '/dashboard':      { title: 'Dashboard',      subtitle: 'Overview of your QR activity' },
  '/qr-codes':       { title: 'QR Codes',        subtitle: 'Manage all your dynamic QR codes' },
  '/qr-codes/create':{ title: 'Create QR Code',  subtitle: 'Generate a new dynamic QR code' },
  '/analytics':      { title: 'Analytics',        subtitle: 'Scan statistics and insights' },
  '/design-studio':  { title: 'Design Studio',    subtitle: 'Customize QR code appearance' },
  '/bulk-upload':    { title: 'Bulk Upload',       subtitle: 'Import QR codes from spreadsheet' },
  '/settings':       { title: 'Settings',          subtitle: 'App preferences and configuration' },
}

export default function Header() {
  const location = useLocation()
  const { profile } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  // Match longest prefix
  const pageInfo = Object.entries(PAGE_TITLES)
    .find(([path]) => location.pathname.startsWith(path) && (location.pathname === path || location.pathname.startsWith(path + '/')))
    ?.[1] ?? { title: 'Navkar QR', subtitle: '' }

  const initials = profile?.full_name?.[0]?.toUpperCase() ?? 'A'

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur-sm flex items-center px-6 gap-4 flex-shrink-0 z-10">
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-foreground leading-tight truncate">
          {pageInfo.title}
        </h1>
        <p className="text-xs text-muted-foreground leading-tight hidden sm:block">
          {pageInfo.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm hover:bg-muted/80 transition-colors">
          <Search size={14} />
          <span>Search...</span>
          <kbd className="text-[10px] border border-border rounded px-1.5 py-0.5">⌘K</kbd>
        </button>

        {/* New QR */}
        <Link
          to="/qr-codes/create"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navkar-700 text-white text-sm font-medium hover:bg-navkar-800 transition-colors shadow-sm"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span className="hidden sm:inline">New QR</span>
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors relative">
          <Bell size={16} />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-navkar-700 flex items-center justify-center cursor-pointer">
          <span className="text-white text-xs font-bold">{initials}</span>
        </div>
      </div>
    </header>
  )
}
