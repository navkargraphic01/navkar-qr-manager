import { useState, useEffect } from 'react'
import { User, Settings as SettingsIcon, Globe, Shield, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

// ─────────────────────────────────────────────────────────────
//  BUG FIX: SectionCard and FormRow are defined HERE at MODULE
//  level, NOT inside the Settings component function.
//
//  Previously, both were defined as:
//    function Settings() {
//      const w = ({ icon, title, children }) => ...  // ❌ new type each render
//      const k = ({ label, hint, children }) => ...  // ❌ new type each render
//    }
//
//  This caused every input to lose focus after one character
//  because React unmounts/remounts components whose type changes.
// ─────────────────────────────────────────────────────────────

/** Section card wrapper — defined at module scope for stable identity */
function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <Icon size={16} className="text-navkar-700" /> {title}
      </h3>
      {children}
    </div>
  )
}

/** Form row wrapper — defined at module scope for stable identity */
function FormRow({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  )
}

export default function Settings() {
  const { profile, updateProfile, user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [saving, setSaving] = useState(false)
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name ?? '',
    company: profile?.company ?? 'Navkar Plywood',
  })
  const [qrBaseUrl, setQrBaseUrl] = useState('https://qr.navkarplywood.com')
  const [qrPrefix, setQrPrefix] = useState('NP')
  const [loadingSettings, setLoadingSettings] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data } = await supabase.from('settings').select('*')
      if (data) {
        const map = {}
        data.forEach(row => { map[row.key] = row.value })
        if (map.qr_base_url) setQrBaseUrl(JSON.parse(map.qr_base_url) || '')
        if (map.qr_prefix) setQrPrefix(JSON.parse(map.qr_prefix) || 'NP')
      }
    } catch { /* ignore */ } finally {
      setLoadingSettings(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await updateProfile(profileForm)
      toast.success('Profile saved!')
    } catch (err) {
      toast.error('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSetting = async (key, value) => {
    try {
      await supabase.from('settings').upsert({ key, value: JSON.stringify(value) })
      toast.success('Setting saved!')
    } catch {
      toast.error('Failed to save setting')
    }
  }

  if (loadingSettings) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 skeleton rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">

      {/* ── Profile ── */}
      {/* ✅ SectionCard and FormRow are defined at MODULE scope — stable references */}
      <SectionCard icon={User} title="Your Profile">
        <FormRow label="Full Name">
          <input
            type="text"
            value={profileForm.full_name}
            onChange={e => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
            className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navkar-700"
          />
        </FormRow>

        <FormRow label="Email">
          <input
            type="email"
            value={user?.email ?? ''}
            disabled
            className="w-full px-3.5 py-2.5 text-sm bg-muted border border-border rounded-lg text-muted-foreground cursor-not-allowed"
          />
        </FormRow>

        <FormRow label="Company">
          <input
            type="text"
            value={profileForm.company}
            onChange={e => setProfileForm(prev => ({ ...prev, company: e.target.value }))}
            className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navkar-700"
          />
        </FormRow>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 bg-navkar-700 hover:bg-navkar-800 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Profile
        </button>
      </SectionCard>

      {/* ── Appearance ── */}
      <SectionCard icon={SettingsIcon} title="Appearance">
        <FormRow label="Theme">
          <div className="flex gap-2">
            {[{ value: 'light', label: '☀️ Light' }, { value: 'dark', label: '🌙 Dark' }].map(opt => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg border-2 transition-all
                  ${theme === opt.value
                    ? 'border-navkar-700 bg-navkar-50 dark:bg-navkar-900/20 text-navkar-700'
                    : 'border-border text-muted-foreground hover:border-navkar-700/50'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </FormRow>
      </SectionCard>

      {/* ── QR Code Settings ── */}
      <SectionCard icon={Globe} title="QR Code Settings">
        <FormRow label="QR Base URL" hint="The domain used in QR codes. Change only if you have a custom domain.">
          <div className="flex gap-2">
            <input
              type="url"
              value={qrBaseUrl}
              onChange={e => setQrBaseUrl(e.target.value)}
              className="flex-1 px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navkar-700"
            />
            <button
              onClick={() => handleSaveSetting('qr_base_url', qrBaseUrl)}
              className="px-4 py-2.5 bg-navkar-700 hover:bg-navkar-800 text-white text-sm rounded-lg transition-colors"
            >
              Save
            </button>
          </div>
        </FormRow>

        <FormRow label="QR ID Prefix" hint={`QR codes will be named: ${qrPrefix}001, ${qrPrefix}002, etc.`}>
          <div className="flex gap-2">
            <input
              type="text"
              value={qrPrefix}
              onChange={e => setQrPrefix(e.target.value.toUpperCase())}
              maxLength={5}
              className="w-28 px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navkar-700 font-mono uppercase"
            />
            <button
              onClick={() => handleSaveSetting('qr_prefix', qrPrefix)}
              className="px-4 py-2.5 bg-navkar-700 hover:bg-navkar-800 text-white text-sm rounded-lg transition-colors"
            >
              Save
            </button>
          </div>
        </FormRow>
      </SectionCard>

      {/* ── Security & Info ── */}
      <SectionCard icon={Shield} title="Security & Info">
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>User ID</span>
            <code className="font-mono text-foreground">{user?.id?.slice(0, 8)}...</code>
          </div>
          <div className="flex justify-between">
            <span>Role</span>
            <span className="font-medium text-green-600 capitalize">{profile?.role}</span>
          </div>
          <div className="flex justify-between">
            <span>Auth Provider</span>
            <span>Supabase Email</span>
          </div>
          <div className="flex justify-between">
            <span>App Version</span>
            <span>v1.0.0</span>
          </div>
        </div>
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            To change your password, use the Supabase Auth reset password flow or contact your system administrator.
          </p>
        </div>
      </SectionCard>
    </div>
  )
}
