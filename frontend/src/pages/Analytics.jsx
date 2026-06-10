import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Smartphone, Monitor, Tablet,
  Globe, QrCode, Calendar, ScanLine
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatNumber, formatDate, formatRelativeTime } from '../lib/utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#C62828', '#1565C0', '#2E7D32', '#E65100', '#6A1B9A', '#00695C'];

const ChartTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-navkar-700">{payload[0]?.value} scans</p>
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [devices, setDevices] = useState([]);
  const [recentScans, setRecentScans] = useState([]);
  const [totals, setTotals] = useState({ total: 0, today: 0, week: 0, month: 0 });

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      const [scansRes, topRes, recentRes] = await Promise.all([
        supabase.from('scans').select('scanned_at, device_type').gte('scanned_at', startDate.toISOString()),
        supabase.from('top_scanned_qr').select('*').limit(8),
        supabase.from('scans')
          .select('id, scanned_at, device_type, country, city, browser, qr_id, qr_codes(product_name)')
          .order('scanned_at', { ascending: false })
          .limit(15),
      ]);

      // Totals
      const allScans = scansRes.data || [];
      const now = new Date();
      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(); monthStart.setDate(monthStart.getDate() - 30);

      setTotals({
        total: allScans.length,
        today: allScans.filter(s => new Date(s.scanned_at) >= todayStart).length,
        week: allScans.filter(s => new Date(s.scanned_at) >= weekStart).length,
        month: allScans.filter(s => new Date(s.scanned_at) >= monthStart).length,
      });

      // Chart data - group by day
      const grouped = {};
      for (let i = parseInt(period) - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        grouped[key] = { date: label, count: 0 };
      }
      allScans.forEach(s => {
        const day = s.scanned_at.split('T')[0];
        if (grouped[day]) grouped[day].count++;
      });
      setChartData(Object.values(grouped));

      // Device breakdown
      const deviceMap = {};
      allScans.forEach(s => {
        const d = s.device_type || 'unknown';
        deviceMap[d] = (deviceMap[d] || 0) + 1;
      });
      setDevices(
        Object.entries(deviceMap)
          .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
          .sort((a, b) => b.value - a.value)
      );

      setTopProducts(topRes.data || []);
      setRecentScans(recentRes.data || []);
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
          color === 'red' ? 'bg-navkar-50 dark:bg-navkar-900/30' : 'bg-muted'
        }`}>
          <Icon size={14} className={color === 'red' ? 'text-navkar-700' : 'text-muted-foreground'} />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{formatNumber(value)}</p>
    </div>
  );

  const deviceIcon = (type) => {
    if (type?.toLowerCase() === 'mobile') return <Smartphone size={12} className="text-navkar-700" />;
    if (type?.toLowerCase() === 'tablet') return <Tablet size={12} className="text-blue-600" />;
    return <Monitor size={12} className="text-muted-foreground" />;
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <div />
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {[
            { label: '7 days', value: '7' },
            { label: '30 days', value: '30' },
            { label: '90 days', value: '90' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                period === opt.value
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ScanLine} label={`Scans (${period}d)`} value={totals.total} color="red" />
        <StatCard icon={Calendar} label="Today" value={totals.today} />
        <StatCard icon={TrendingUp} label="This Week" value={totals.week} />
        <StatCard icon={BarChart3} label="This Month" value={totals.month} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Area chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Scan Activity — Last {period} Days
          </h3>
          {loading ? (
            <div className="h-56 skeleton rounded" />
          ) : (
            <ResponsiveContainer width="100%" height={224}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C62828" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#C62828" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false}
                  interval={Math.max(Math.floor(chartData.length / 7) - 1, 0)} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#C62828" strokeWidth={2}
                  fill="url(#grad)" dot={false} activeDot={{ r: 4, fill: '#C62828' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Device breakdown */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Device Types</h3>
          {loading ? (
            <div className="h-56 skeleton rounded" />
          ) : devices.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">No data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={devices} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                    dataKey="value" paddingAngle={3}>
                    {devices.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} scans`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {devices.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-foreground">{d.name}</span>
                    </div>
                    <span className="text-muted-foreground font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top products + Recent scans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top scanned */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Top Scanned Products</h3>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-8 skeleton rounded" />)}</div>
          ) : topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No scan data yet</p>
          ) : (
            <div className="space-y-2">
              {topProducts.map((p, i) => {
                const maxScans = topProducts[0]?.scan_count || 1;
                const pct = Math.round((p.scan_count / maxScans) * 100);
                return (
                  <div key={p.qr_id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-muted-foreground w-4 text-right flex-shrink-0">{i + 1}</span>
                        <code className="text-navkar-700 font-mono font-bold">{p.qr_id}</code>
                        <span className="text-foreground truncate">{p.product_name}</span>
                      </div>
                      <span className="font-bold text-foreground flex-shrink-0 ml-2">{formatNumber(p.scan_count)}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden ml-6">
                      <div
                        className="h-full bg-navkar-700 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent scans */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Recent Scan Activity</h3>
          {loading ? (
            <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-10 skeleton rounded" />)}</div>
          ) : recentScans.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No scans recorded yet</p>
          ) : (
            <div className="space-y-1 overflow-y-auto max-h-72">
              {recentScans.map(scan => (
                <div key={scan.id} className="flex items-center gap-2.5 py-2 border-b border-border/50 last:border-0">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    {deviceIcon(scan.device_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <code className="text-[10px] font-mono text-navkar-700 font-bold">{scan.qr_id}</code>
                      <span className="text-xs text-foreground truncate">{scan.qr_codes?.product_name}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {[scan.city, scan.country].filter(Boolean).join(', ') || 'Location unknown'}
                      {scan.browser && ` · ${scan.browser}`}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {formatRelativeTime(scan.scanned_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
