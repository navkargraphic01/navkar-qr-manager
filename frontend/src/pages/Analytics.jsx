import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import { supabase } from '../lib/supabase'

const COLORS = ['#C62828', '#B71C1C', '#ef5350', '#ef9a9a', '#ffcdd2']

export default function Analytics() {
  const [scanTrend, setScanTrend] = useState([])
  const [deviceBreakdown, setDeviceBreakdown] = useState([])
  const [topQR, setTopQR] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAnalytics() }, [])

  const fetchAnalytics = async () => {
    try {
      // Scan trend (30 days)
      const since = new Date()
      since.setDate(since.getDate() - 30)
      const { data: scans } = await supabase.from('scans')
        .select('scanned_at, device_type, qr_id')
        .gte('scanned_at', since.toISOString())

      // Build trend
      const trendMap = {}
      for (let k = 0; k < 30; k++) {
        const d = new Date()
        d.setDate(d.getDate() - (29 - k))
        trendMap[d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })] = 0
      }
      ;(scans || []).forEach(s => {
        const key = new Date(s.scanned_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
        if (key in trendMap) trendMap[key]++
      })
      setScanTrend(Object.entries(trendMap).map(([date, count]) => ({ date, count })))

      // Device breakdown
      const devices = {}
      ;(scans || []).forEach(s => { devices[s.device_type || 'unknown'] = (devices[s.device_type || 'unknown'] || 0) + 1 })
      setDeviceBreakdown(Object.entries(devices).map(([name, value]) => ({ name, value })))

      // Top QR codes
      const { data: qrData } = await supabase.from('qr_codes')
        .select('qr_id, product_name, scan_count')
        .order('scan_count', { ascending: false })
        .limit(10)
      setTopQR(qrData || [])
    } catch (err) {
      console.error('Analytics error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-64 skeleton rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Scan Trend */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-4">Scan Trend (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={scanTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={4} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Area type="monotone" dataKey="count" stroke="#C62828" fill="#C62828" fillOpacity={0.1} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Device Breakdown</h3>
          {deviceBreakdown.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No scan data yet</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={deviceBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                    {deviceBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {deviceBreakdown.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="capitalize text-foreground">{d.name}</span>
                    <span className="text-muted-foreground ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top QR Codes */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Top QR Codes by Scans</h3>
          {topQR.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topQR.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis dataKey="qr_id" type="category" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={60} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="scan_count" fill="#C62828" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
