import { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Search, Plus, QrCode } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

const pageTitles = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your QR system' },
  '/qr-codes': { title: 'QR Codes', subtitle: 'Manage all your dynamic QR codes' },
  '/qr-codes/create': { title: 'Create QR Code', subtitle: 'Generate a new dynamic QR code' },
  '/analytics': { title: 'Analytics', subtitle: 'Scan data and performance insights' },
  '/design-studio': { title: 'Design Studio', subtitle: 'Create custom QR templates' },
  '/bulk-upload': { title: 'Bulk Upload', subtitle: 'Import multiple QR codes via Excel' },
  '/settings': { title: 'Settings', subtitle: 'Application preferences and configuration' },
};

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { profile } = useAuth();

  const currentPage = Object.entries(pageTitles).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] || { title: 'Navkar QR', subtitle: '' };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(p => !p)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-background/95 backdrop-blur-sm flex items-center px-6 gap-4 flex-shrink-0 z-10">
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-foreground leading-tight truncate">
              {currentPage.title}
            </h1>
            <p className="text-xs text-muted-foreground leading-tight hidden sm:block">
              {currentPage.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick search placeholder */}
            <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm hover:bg-muted/80 transition-colors">
              <Search size={14} />
              <span>Search...</span>
              <kbd className="text-[10px] border border-border rounded px-1.5 py-0.5">⌘K</kbd>
            </button>

            {/* Create QR button */}
            <Link
              to="/qr-codes/create"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navkar-700 text-white text-sm font-medium hover:bg-navkar-800 transition-colors shadow-sm"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span className="hidden sm:inline">New QR</span>
            </Link>

            {/* Notifications */}
            <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors relative">
              <Bell size={16} />
            </button>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-navkar-700 flex items-center justify-center cursor-pointer">
              <span className="text-white text-xs font-bold">
                {profile?.full_name?.[0]?.toUpperCase() || 'A'}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
