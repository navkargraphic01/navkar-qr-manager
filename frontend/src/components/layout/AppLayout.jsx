import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import Header from './Header'

export default function AppLayout() {
  const location = useLocation()

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {/*
            KEY FIX: The key prop on the motion.div causes the entire content area
            to unmount/remount on every route change. This is intentional for page
            transitions, but the key must ONLY change on route changes (pathname),
            NOT on every re-render.

            Previously the key was computed inside the AppLayout render fn from
            useLocation() — which is fine. The real bug was FormField/SectionCard
            components being defined INSIDE page component render functions.
          */}
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
  )
}
