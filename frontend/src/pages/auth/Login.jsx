import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const { signIn, signUp, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Please enter email and password'); return }
    if (isSignUp && !fullName.trim()) { toast.error('Please enter your full name'); return }
    setLoading(true)
    try {
      if (isSignUp) {
        await signUp(email, password, fullName)
        toast.success('Registration request sent! Please check your email for verification.')
        setIsSignUp(false)
      } else {
        await signIn(email, password)
        toast.success('Welcome back!')
      }
    } catch (err) {
      toast.error(err.message || 'Action failed. Check your inputs.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navkar-900 via-navkar-800 to-navkar-700 flex items-center justify-center p-4">
      {/* Background dots pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-white dark:bg-card rounded-2xl shadow-2xl shadow-black/30 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-navkar px-8 pt-8 pb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">Navkar QR Manager</h1>
                <p className="text-white/70 text-xs">Dynamic QR Code Platform</p>
              </div>
            </div>
            <p className="text-white/70 text-sm">{isSignUp ? 'Create your administrator account' : 'Sign in to manage your QR codes'}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Full Name
                </label>
                <input
                  id="login-fullname"
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Navkar Admin"
                  disabled={loading}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                    bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                    placeholder-gray-400 text-sm
                    focus:outline-none focus:ring-2 focus:ring-navkar-700 focus:border-transparent
                    transition-all disabled:opacity-50"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@navkarplywood.com"
                disabled={loading}
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                  bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                  placeholder-gray-400 text-sm
                  focus:outline-none focus:ring-2 focus:ring-navkar-700 focus:border-transparent
                  transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 dark:border-gray-700
                    bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                    placeholder-gray-400 text-sm
                    focus:outline-none focus:ring-2 focus:ring-navkar-700 focus:border-transparent
                    transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
                bg-navkar-700 hover:bg-navkar-800 text-white font-semibold text-sm
                transition-all duration-150 shadow-sm hover:shadow-md
                disabled:opacity-70 disabled:cursor-not-allowed mt-6"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Processing...</>
                : isSignUp 
                  ? <>Create Account <ArrowRight size={16} /></>
                  : <>Sign In <ArrowRight size={16} /></>
              }
            </button>

            <div className="text-center mt-4 text-xs">
              <button
                type="button"
                onClick={() => setIsSignUp(v => !v)}
                className="text-navkar-700 hover:underline font-semibold"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>

          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-gray-400">
              Navkar Plywood © {new Date().getFullYear()} · Secured with Supabase Auth
            </p>
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-4">v1.0.0 · Enterprise Edition</p>
      </div>
    </div>
  )
}
