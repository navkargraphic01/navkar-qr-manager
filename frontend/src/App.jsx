import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import QRCodes from './pages/QRCodes';
import CreateQR from './pages/CreateQR';
import EditQR from './pages/EditQR';
import Analytics from './pages/Analytics';
import DesignStudio from './pages/DesignStudio';
import BulkUpload from './pages/BulkUpload';
import Settings from './pages/Settings';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <AppLoader />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Loading screen
const AppLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-12 h-12 rounded-xl bg-navkar-700 mx-auto flex items-center justify-center animate-pulse">
        <span className="text-white font-bold text-lg">N</span>
      </div>
      <p className="text-muted-foreground text-sm">Loading Navkar QR Manager...</p>
    </div>
  </div>
);

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <AppLoader />;

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      {/* Protected app routes */}
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

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
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
                fontFamily: 'Inter, sans-serif'
              },
              success: {
                iconTheme: { primary: '#22c55e', secondary: '#fff' }
              },
              error: {
                iconTheme: { primary: '#C62828', secondary: '#fff' }
              }
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}
