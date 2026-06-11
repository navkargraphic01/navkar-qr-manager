import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Login from './pages/auth/Login'
import Dashboard from './pages/Dashboard'
import QRCodes from './pages/QRCodes'
import CreateQR from './pages/CreateQR'
import EditQR from './pages/EditQR'
import Analytics from './pages/Analytics'
import DesignStudio from './pages/DesignStudio'
import BulkUpload from './pages/BulkUpload'
import Settings from './pages/Settings'
import QRRedirect from './pages/QRRedirect'

function Router() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/p/:qrId" element={<QRRedirect />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="qr-codes" element={<QRCodes />} />
        <Route path="qr-codes/create" element={<CreateQR />} />
        <Route path="qr-codes/:id/edit" element={<EditQR />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="design-studio" element={<DesignStudio />} />
        <Route path="bulk-upload" element={<BulkUpload />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Router />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--card-foreground))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
              },
              success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
              error: { iconTheme: { primary: '#C62828', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
