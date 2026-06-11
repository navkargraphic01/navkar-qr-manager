import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { QrCode, Activity, TrendingUp, TrendingDown, Monitor, Smartphone, Tablet, Plus } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// ── Stat Card (defined at module scope) ──
function StatCard({ icon: Icon, label, value, change, changeType, color = 'red', loading }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center
          ${color === 'red' ? 'bg-navkar-50 dark:bg-navkar-900/30' :
            color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/30' :
            color === 'green' ? 'bg-green-50 dark:bg-green-900/30' :
            'bg-purple-50 dark:bg-purple-900/30'}`}
        >
          <Icon size={18} className={
            color === 'red' ? 'text-navkar-700' :
            color === 'blue' ? 'text-blue-600' :
            color === 'green' ? 'text-green-600' : 'text-purple-600'
          } />
        </div>
        {change !== undefined && (
          <span className={`text-xs font-medium flex items-center gap-0.5
            ${changeType === 'up' ? 'text-green-600' : 'text-red-500'}`}
          >
            {changeType === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {change}%
          </span>
        )}
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-7 w-20 skeleton rounded" />
          <div className="h-4 w-32 skeleton rounded" />
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold text-foreground">{value}</div>
          <p className="text-sm text-muted-foreground">{label}</p>
        </>
      )}
    </motion.div>
  )
}

// ── Chart Tooltip (defined at module scope) ──
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-navkar-700">{payload[0].value} scans</p>
    </div>
  )
}

function formatNumber(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState(null)
  const [chartData, setChartData] = useState([])
  const [recentScans, setRecentScans] = useState([])
  const [recentQR, setRecentQR] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [statsRes, scansRes, qrRes] = await Promise.all([
        supabase.rpc('get_dashboard_stats'),
        supabase.from('scans')
          .select('id, scanned_at, device_type, country, qr_id, qr_codes(product_name)')
          .order('scanned_at', { ascending: false })
          .limit(8),
        supabase.from('qr_codes')
          .select('id, qr_id, product_name, product_code, status, scan_count, created_at')
          .order('created_at', { ascending: false })
          .limit(6),
      ])
      setStats(statsRes.data)
      setRecentScans(scansRes.data || [])
      setRecentQR(qrRes.data || [])
      await fetchChartData()
    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchChartData = async () => {
    const since = new Date()
    since.setDate(since.getDate() - 14)
    const { data } = await supabase.from('scans')
      .select('scanned_at')
      .gte('scanned_at', since.toISOString())

    const buckets = {}
    for (let k = 0; k < 14; k++) {
      const d = new Date()
      d.setDate(d.getDate() - (13 - k))
      buckets[d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })] = 0
    }
    ;(data || []).forEach(row => {
      const key = new Date(row.scanned_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      if (key in buckets) buckets[key]++
    })
    setChartData(Object.entries(buckets).map(([date, count]) => ({ date, count })))
  }

  const deviceIcon = (type) => {
    if (type === 'mobile') return <Smartphone size={13} className="text-navkar-700" />
    if (type === 'tablet') return <Tablet size={13} className="text-blue-600" />
    return <Monitor size={13} className="text-gray-500" />
  }

  const statusBadge = (status) => (
    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium
      ${status === 'active' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
        status === 'inactive' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' :
        'bg-muted text-muted-foreground'}`}
    >
      {status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
      {status}
    </span>
  )

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome banner */}
      <div className="bg-gradient-navkar rounded-xl p-5 text-white flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg">Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Admin'}! 👋</h2>
          <p className="text-white/70 text-sm mt-0.5">Here's what's happening with your QR codes today.</p>
        </div>
        <Link
          to="/qr-codes/create"
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} /> New QR Code
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={QrCode} label="Total QR Codes" value={formatNumber(stats?.total_qr_codes ?? 0)} color="red" loading={loading} />
        <StatCard icon={Activity} label="Total Scans" value={formatNumber(stats?.total_scans ?? 0)} color="blue" loading={loading} />
        <StatCard icon={TrendingUp} label="Active QR Codes" value={formatNumber(stats?.active_qr_codes ?? 0)} color="green" loading={loading} />
        <StatCard icon={Monitor} label="Scans Today" value={formatNumber(stats?.scans_today ?? 0)} color="purple" loading={loading} />
      </div>

      {/* Chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-4">Scan Activity (Last 14 Days)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="count" stroke="#C62828" fill="#C62828" fillOpacity={0.1} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Scans */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Recent Scans</h3>
          <div className="space-y-3">
            {loading
              ? [...Array(4)].map((_, i) => <div key={i} className="h-10 skeleton rounded" />)
              : recentScans.map(scan => (
                <div key={scan.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {deviceIcon(scan.device_type)}
                    <div>
                      <p className="font-medium text-foreground text-xs">{scan.qr_codes?.product_name ?? scan.qr_id}</p>
                      <p className="text-muted-foreground text-[11px]">{scan.country ?? 'Unknown'}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(scan.scanned_at).toLocaleDateString('en-IN')}
                  </span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Recent QR Codes */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Recent QR Codes</h3>
          <div className="space-y-3">
            {loading
              ? [...Array(4)].map((_, i) => <div key={i} className="h-10 skeleton rounded" />)
              : recentQR.map(qr => (
                <div key={qr.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-foreground text-xs">{qr.product_name}</p>
                    <p className="text-muted-foreground text-[11px] font-mono">{qr.qr_id}</p>
                  </div>
                  <div className="text-right">
                    {statusBadge(qr.status)}
                    <p className="text-xs text-muted-foreground mt-0.5">{qr.scan_count ?? 0} scans</p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}
