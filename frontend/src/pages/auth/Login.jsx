import { useState } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success('Welcome back!');
    } catch (error) {
      toast.error(error.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navkar-900 via-navkar-800 to-navkar-700 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="bg-white dark:bg-card rounded-2xl shadow-2xl shadow-black/30 overflow-hidden"
        >
          {/* Top accent */}
          <div className="h-1 bg-gradient-navkar" />

          <div className="p-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-navkar flex items-center justify-center shadow-lg mb-4">
                <QrCode size={28} className="text-white" strokeWidth={2} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Navkar QR Manager
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Dynamic QR Code Management System
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@navkarplywood.com"
                  disabled={loading}
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
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 dark:border-gray-700
                             bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                             placeholder-gray-400 text-sm
                             focus:outline-none focus:ring-2 focus:ring-navkar-700 focus:border-transparent
                             transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
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
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Signing in...</>
                ) : (
                  <>Sign In <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-gray-400">
              Navkar Plywood © {new Date().getFullYear()} · Secured with Supabase Auth
            </p>
          </div>
        </motion.div>

        {/* Version tag */}
        <p className="text-center text-white/40 text-xs mt-4">
          v1.0.0 · Enterprise Edition
        </p>
      </div>
    </div>
  );
}
