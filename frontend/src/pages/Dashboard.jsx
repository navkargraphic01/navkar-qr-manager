import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  QrCode, ScanLine, Activity, TrendingUp, TrendingDown,
  Plus, ArrowRight, Smartphone, Monitor, Tablet, Globe,
  Clock, Package, BarChart3
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatRelativeTime, formatNumber, statusColors } from '../lib/utils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';

// Stat card component
const StatCard = ({ icon: Icon, label, value, change, changeType, color = 'red', loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-card border border-border rounded-xl p-5 space-y-3"
  >
    <div className="flex items-center justify-between">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
        color === 'red' ? 'bg-navkar-50 dark:bg-navkar-900/30' :
        color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/30' :
        color === 'green' ? 'bg-green-50 dark:bg-green-900/30' :
        'bg-purple-50 dark:bg-purple-900/30'
      }`}>
        <Icon size={18} className={
          color === 'red' ? 'text-navkar-700' :
          color === 'blue' ? 'text-blue-600' :
          color === 'green' ? 'text-green-600' :
          'text-purple-600'
        } />
      </div>
      {change !== undefined && (
        <span className={`text-xs font-medium flex items-center gap-0.5 ${
          changeType === 'up' ? 'text-green-600' : 'text-red-500'
        }`}>
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
);

// Custom chart tooltip
const ChartTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-navkar-700">{payload[0].value} scans</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [recentScans, setRecentScans] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch in parallel
      const [statsResult, scansResult, recentScansResult, recentProductsResult] = await Promise.all([
        supabase.rpc('get_dashboard_stats'),
        fetchChartData(),
        supabase.from('scans')
          .select('id, scanned_at, device_type, country, qr_id, qr_codes(product_name)')
          .order('scanned_at', { ascending: false })
          .limit(8),
        supabase.from('qr_codes')
          .select('id, qr_id, product_name, product_code, status, scan_count, created_at')
          .order('created_at', { ascending: false })
          .limit(6)
      ]);

      setStats(statsResult.data);
      setRecentScans(recentScansResult.data || []);
      setRecentProducts(recentProductsResult.data || []);
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    const days = 14;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data } = await supabase.from('scans')
      .select('scanned_at')
      .gte('scanned_at', startDate.toISOString());

    // Group by day
    const grouped = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      grouped[key] = 0;
    }

    (data || []).forEach(scan => {
      const d = new Date(scan.scanned_at);
      const key = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      if (grouped[key] !== undefined) grouped[key]++;
    });

    const result = Object.entries(grouped).map(([date, count]) => ({ date, count }));
    setChartData(result);
    return result;
  };

  const deviceIcon = (type) => {
    if (type === 'mobile') return <Smartphone size={13} className="text-navkar-700" />;
    if (type === 'tablet') return <Tablet size={13} className="text-blue-600" />;
    return <Monitor size={13} className="text-gray-500" />;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome banner */}
      <div className="bg-gradient-navkar rounded-xl p-5 text-white flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Welcome to Navkar QR Manager</h2>
          <p className="text-white/70 text-sm mt-0.5">
            Create, manage and track dynamic QR codes for your products
          </p>
        </div>
        <Link
          to="/qr-codes/create"
          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          New QR Code
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={QrCode}
          label="Total QR Codes"
          value={formatNumber(stats?.total_qr_codes)}
          color="red"
          loading={loading}
        />
        <StatCard
          icon={Activity}
          label="Active QR Codes"
          value={formatNumber(stats?.active_qr_codes)}
          color="green"
          loading={loading}
        />
        <StatCard
          icon={ScanLine}
          label="Total Scans"
          value={formatNumber(stats?.total_scans)}
          color="blue"
          loading={loading}
        />
        <StatCard
          icon={BarChart3}
          label="Scans This Month"
          value={formatNumber(stats?.scans_this_month)}
          color="purple"
          loading={loading}
        />
      </div>

      {/* Charts + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Scan chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Scan Activity</h3>
              <p className="text-xs text-muted-foreground">Last 14 days</p>
            </div>
            <Link to="/analytics" className="text-xs text-navkar-700 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div className="h-44 skeleton rounded" />
          ) : (
            <ResponsiveContainer width="100%" height={176}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C62828" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#C62828" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#C62828" strokeWidth={2}
                  fill="url(#scanGradient)" dot={false} activeDot={{ r: 4, fill: '#C62828' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent scans */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Recent Scans</h3>
            <span className="text-xs bg-navkar-50 dark:bg-navkar-900/30 text-navkar-700 px-2 py-0.5 rounded-full font-medium">
              Live
            </span>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 skeleton rounded" />
              ))}
            </div>
          ) : recentScans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ScanLine size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No scans yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentScans.map(scan => (
                <div key={scan.id} className="flex items-center gap-2.5 py-1.5">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    {deviceIcon(scan.device_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {scan.qr_codes?.product_name || scan.qr_id}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {scan.country || 'Unknown'} · {formatRelativeTime(scan.scanned_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent QR Codes */}
      <div className="bg-card border border-border rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Recently Created QR Codes</h3>
          <Link to="/qr-codes" className="text-xs text-navkar-700 hover:underline flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-14 skeleton rounded" />)}
          </div>
        ) : recentProducts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No QR codes yet</p>
            <Link to="/qr-codes/create" className="text-navkar-700 text-sm hover:underline mt-1 inline-block">
              Create your first QR code
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentProducts.map((qr) => (
              <div key={qr.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-navkar-50 dark:bg-navkar-900/30 flex items-center justify-center flex-shrink-0">
                  <QrCode size={15} className="text-navkar-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{qr.product_name}</p>
                  <p className="text-xs text-muted-foreground">{qr.product_code}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-mono font-bold text-navkar-700">{qr.qr_id}</p>
                  <p className="text-[10px] text-muted-foreground">{qr.scan_count} scans</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[qr.status]}`}>
                  {qr.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
