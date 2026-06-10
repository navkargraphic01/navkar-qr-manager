import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, QrCode, BarChart3, Palette, Upload,
  Settings, ChevronLeft, ChevronRight, Layers, Activity,
  Zap, LogOut, User, Moon, Sun
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';

const navItems = [
  {
    group: 'Main',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
      { icon: QrCode, label: 'QR Codes', to: '/qr-codes' },
      { icon: BarChart3, label: 'Analytics', to: '/analytics' },
    ]
  },
  {
    group: 'Tools',
    items: [
      { icon: Palette, label: 'Design Studio', to: '/design-studio' },
      { icon: Upload, label: 'Bulk Upload', to: '/bulk-upload' },
    ]
  },
  {
    group: 'System',
    items: [
      { icon: Settings, label: 'Settings', to: '/settings' },
    ]
  }
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try { await signOut(); } catch {}
    setSigningOut(false);
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="flex flex-col h-full bg-sidebar border-r border-sidebar-border relative overflow-hidden"
    >
      {/* Top gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-navkar" />

      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-navkar flex items-center justify-center flex-shrink-0 shadow-sm">
            <QrCode size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="min-w-0"
              >
                <p className="text-sm font-bold text-sidebar-foreground leading-tight truncate">
                  Navkar QR
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Dynamic Manager
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {navItems.map((group) => (
          <div key={group.group}>
            {!collapsed && (
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                {group.group}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.to);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-all duration-150',
                      'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isActive && 'bg-navkar-700 text-white hover:bg-navkar-700 hover:text-white shadow-sm',
                      collapsed && 'justify-center px-2'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={17} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="font-medium truncate"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            'w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm',
            'text-sidebar-foreground hover:bg-sidebar-accent transition-colors',
            collapsed && 'justify-center'
          )}
          title={collapsed ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` : undefined}
        >
          {theme === 'dark'
            ? <Sun size={17} strokeWidth={2} className="flex-shrink-0" />
            : <Moon size={17} strokeWidth={2} className="flex-shrink-0" />
          }
          {!collapsed && (
            <span className="font-medium">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>

        {/* User */}
        <div className={cn(
          'flex items-center gap-2 px-2 py-2 rounded-lg',
          collapsed && 'justify-center'
        )}>
          <div className="w-7 h-7 rounded-full bg-navkar-700 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'A'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">
                {profile?.full_name || 'Admin'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {profile?.email}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-red-500 transition-colors"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Collapse toggle button */}
      <button
        onClick={onToggle}
        className={cn(
          'absolute top-14 -right-3 w-6 h-6 rounded-full',
          'bg-background border border-border shadow-sm',
          'flex items-center justify-center z-10',
          'hover:bg-sidebar-accent transition-colors',
          'text-muted-foreground hover:text-foreground'
        )}
      >
        {collapsed
          ? <ChevronRight size={12} strokeWidth={2.5} />
          : <ChevronLeft size={12} strokeWidth={2.5} />
        }
      </button>
    </motion.aside>
  );
}
