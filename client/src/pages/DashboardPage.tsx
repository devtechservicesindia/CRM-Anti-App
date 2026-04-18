import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Monitor, Activity, DollarSign, TrendingUp, TrendingDown,
  Plus, UserPlus, RefreshCw, Zap, Clock, CheckCircle2, XCircle,
  Gamepad2, Headset, Car, BarChart2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import Topbar from '@/components/layout/Topbar';
import api from '@/lib/api';
import { RevenueDataPoint, StationUsage, HeatmapCell } from '@/types';
import { formatCurrency, formatDateTime, formatDuration } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import CustomerDashboard from './CustomerDashboard';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATION_TYPE_ICONS: Record<string, React.ElementType> = {
  PC: Monitor, CONSOLE: Gamepad2, VR: Headset, SIMULATOR: Car,
};

const STATION_TYPE_COLORS: Record<string, string> = {
  PC: '#7c3aed', CONSOLE: '#2563eb', VR: '#06b6d4', SIMULATOR: '#f59e0b',
};

const HOURS = Array.from({ length: 24 }, (_, i) =>
  i === 0 ? '12a' : i < 12 ? `${i}a` : i === 12 ? '12p' : `${i - 12}p`
);
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Sub-components ───────────────────────────────────────────────────────────

// KPI Card with neon border glow on hover
const KpiCard = ({
  icon: Icon, label, value, sub, trend, color = 'purple', delay = 0,
}: {
  icon: React.ElementType; label: string; value: string;
  sub?: string; trend?: { value: number; label: string };
  color?: 'purple' | 'blue' | 'green' | 'amber'; delay?: number;
}) => {
  const palette = {
    purple: { grad: 'from-purple-600/20 to-transparent', border: 'hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)]', icon: 'from-purple-600 to-purple-800', text: 'text-purple-400' },
    blue:   { grad: 'from-blue-600/20 to-transparent',   border: 'hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(37,99,235,0.15)]',   icon: 'from-blue-600 to-blue-800',   text: 'text-blue-400' },
    green:  { grad: 'from-emerald-600/20 to-transparent',border: 'hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',icon: 'from-emerald-600 to-emerald-800',text:'text-emerald-400'},
    amber:  { grad: 'from-amber-600/20 to-transparent',  border: 'hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]',  icon: 'from-amber-600 to-amber-800',  text: 'text-amber-400' },
  };
  const p = palette[color];
  const positive = (trend?.value ?? 0) >= 0;

  return (
    <div
      className={`glass-card p-5 bg-gradient-to-br ${p.grad} border border-white/[0.08] ${p.border}
        transition-all duration-300 hover:scale-[1.02] cursor-default animate-slide-in`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${p.icon} flex items-center justify-center shadow-lg`}>
          <Icon size={20} className="text-white" />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            positive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div className="text-3xl font-black text-white tracking-tight mb-1">{value}</div>
      <div className="text-sm font-medium text-slate-400">{label}</div>
      {sub && <div className="text-xs text-slate-600 mt-1">{sub}</div>}
      {trend && <div className="text-[10px] text-slate-600 mt-0.5">{trend.label}</div>}
    </div>
  );
};

// Revenue chart tooltip
const RevenueTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: { value: number; name: string }[]; label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-4 py-3 text-sm border border-purple-500/20 shadow-[0_0_20px_rgba(124,58,237,0.1)]">
      <p className="text-slate-400 text-xs mb-2 font-medium">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-white font-bold">
          {entry.name === 'revenue' ? formatCurrency(entry.value) : `${entry.value} sessions`}
        </p>
      ))}
    </div>
  );
};

// Heatmap cell color interpolation
const heatColor = (count: number, max: number): string => {
  if (count === 0) return 'rgba(255,255,255,0.03)';
  const pct = count / max;
  if (pct < 0.25) return `rgba(37,99,235,${0.15 + pct * 0.6})`;
  if (pct < 0.5)  return `rgba(124,58,237,${0.2 + pct * 0.5})`;
  if (pct < 0.75) return `rgba(245,158,11,${0.25 + pct * 0.5})`;
  return `rgba(239,68,68,${0.3 + pct * 0.6})`;
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    ACTIVE: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/30',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${map[status] ?? ''}`}>
      {status}
    </span>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'STAFF';

  // State hooks
  const [stats, setStats] = useState<any | null>(null);
  const [revenue, setRevenue] = useState<RevenueDataPoint[]>([]);
  const [stationUsage, setStationUsage] = useState<StationUsage[]>([]);
  const [heatmap, setHeatmap] = useState<{ cells: HeatmapCell[]; maxCount: number }>({ cells: [], maxCount: 1 });
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async (silent = false) => {
    // If not staff, don't fetch staff dashboards
    if (!isStaff) return;
    
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    try {
      const [s, r, u, h] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/revenue?days=30'),
        api.get('/dashboard/station-usage'),
        api.get('/dashboard/heatmap'),
      ]);
      setStats(s.data);
      setRevenue(r.data);
      setStationUsage(u.data);
      setHeatmap(h.data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Dashboard fetch failed', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(() => fetchAll(true), 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchAll]);

  // ─── Quick action: New Booking ──────────────────────────────────────────────
  const handleNewBooking = () => navigate('/bookings');
  const handleAddWalkin = () => navigate('/bookings');

  // ─── Loading skeleton ───────────────────────────────────────────────────────
  if (!isStaff) {
    return <CustomerDashboard />;
  }

  if (loading) {
    return (
      <div>
        <Topbar title="Dashboard" subtitle="Gaming Parlour Overview" />
        <div className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card p-5 h-32 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-white/5 mb-4" />
                <div className="h-6 w-2/3 bg-white/5 rounded mb-2" />
                <div className="h-3 w-1/2 bg-white/[0.03] rounded" />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500 text-sm tracking-widest uppercase animate-pulse">Loading Arena Stats...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const topStations = stationUsage.slice(0, 5);

  return (
    <div>
      <Topbar
        title="Dashboard"
        subtitle="Gaming Parlour Overview"
        action={
          <div className="flex items-center gap-2">
            {/* Last refresh indicator */}
            <button
              onClick={() => fetchAll(true)}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-500 hover:text-slate-300 text-xs transition-all hover:bg-white/[0.07] disabled:opacity-50"
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Refreshing...' : `${lastRefresh.toLocaleTimeString()}`}
            </button>

            {/* Quick actions — staff/admin only */}
            {isStaff && (
              <>
                <button
                  onClick={handleAddWalkin}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white text-xs font-medium transition-all hover:bg-white/[0.07]"
                >
                  <UserPlus size={13} /> Walk-in
                </button>
                <button
                  onClick={handleNewBooking}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all"
                >
                  <Plus size={13} /> New Booking
                </button>
              </>
            )}
          </div>
        }
      />

      <div className="p-6 space-y-6">

        {/* ── KPI Cards ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={DollarSign} label="Today's Revenue"
            value={formatCurrency(stats?.todayRevenue || 0)}
            color="green" delay={0}
            trend={{ value: 12, label: 'vs yesterday' }}
          />
          <KpiCard
            icon={Activity} label="Active Sessions"
            value={String(stats?.activeBookings || 0)}
            sub="Live right now" color="blue" delay={60}
          />
          <KpiCard
            icon={Users} label="Total Customers"
            value={String(stats?.totalCustomers || 0)}
            sub={`+${stats?.newCustomersThisMonth || 0} this month`}
            color="purple" delay={120}
          />
          <KpiCard
            icon={Monitor} label="Available Stations"
            value={String(stats?.availableStations || 0)}
            sub={`${stats?.occupiedStations || 0} occupied · ${stats?.maintenanceStations || 0} maintenance`}
            color="amber" delay={180}
          />
        </div>

        {/* ── Revenue Chart + Live Station Grid ──────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Revenue area chart — 30 days */}
          <div className="xl:col-span-2 glass-card p-6 border border-white/[0.08] hover:border-purple-500/20 transition-colors duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp size={18} className="text-purple-400" />
                  Revenue (30 Days)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Daily earnings trend</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-white">{formatCurrency(stats?.totalRevenue || 0)}</p>
                <p className="text-xs text-slate-500">All-time total</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={revenue} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revGradMain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="bookGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#475569', fontSize: 10 }}
                  tickFormatter={(v) => v.slice(5)}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: '#475569', fontSize: 10 }}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                  tickLine={false}
                  axisLine={false}
                  width={45}
                />
                <Tooltip content={<RevenueTooltip />} cursor={{ stroke: 'rgba(124,58,237,0.3)', strokeWidth: 1 }} />
                <Area
                  type="monotone" dataKey="revenue" name="revenue"
                  stroke="#7c3aed" strokeWidth={2.5}
                  fill="url(#revGradMain)" dot={false}
                  activeDot={{ r: 5, fill: '#7c3aed', stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive animationDuration={800} animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Live station status grid */}
          <div className="glass-card p-6 border border-white/[0.08] hover:border-blue-500/20 transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  Live Stations
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{stats?.totalStations} total</p>
              </div>
              <div className="flex gap-2">
                {[
                  { label: stats?.availableStations ?? 0, color: 'bg-emerald-400', title: 'Available' },
                  { label: stats?.occupiedStations ?? 0, color: 'bg-amber-400', title: 'Occupied' },
                  { label: stats?.maintenanceStations ?? 0, color: 'bg-red-400', title: 'Maintenance' },
                ].map(({ label, color, title }) => (
                  <div key={title} className="text-center" title={title}>
                    <div className={`w-1.5 h-1.5 ${color} rounded-full mx-auto mb-1`} />
                    <span className="text-xs font-bold text-white">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {stats?.stations?.map((station: any) => {
                const Icon = STATION_TYPE_ICONS[station.type] ?? Monitor;
                const isOccupied = station.status === 'OCCUPIED';
                const isMaintenance = station.status === 'MAINTENANCE';
                return (
                  <div
                    key={station.id}
                    title={`${station.name} — ${station.status}`}
                    className={`relative p-2.5 rounded-xl border transition-all duration-300 cursor-default
                      ${isOccupied
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                        : isMaintenance
                        ? 'bg-red-500/10 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                        : 'bg-emerald-500/10 border-emerald-500/30'
                      }`}
                  >
                    <Icon size={14} className={
                      isOccupied ? 'text-amber-400' : isMaintenance ? 'text-red-400' : 'text-emerald-400'
                    } />
                    <p className="text-[9px] text-slate-400 mt-1 leading-tight truncate">{station.name.split(' ')[0]}</p>
                    {isOccupied && (
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/[0.04]">
              {[
                { color: 'bg-emerald-400', label: 'Available' },
                { color: 'bg-amber-400', label: 'Occupied' },
                { color: 'bg-red-400', label: 'Maintenance' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-[10px] text-slate-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Top Stations Bar Chart + Heatmap ─────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Top 5 stations by booking count */}
          <div className="glass-card p-6 border border-white/[0.08] hover:border-purple-500/20 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-5">
              <BarChart2 size={18} className="text-purple-400" />
              <div>
                <h2 className="text-base font-bold text-white">Top 5 Stations</h2>
                <p className="text-xs text-slate-500">By total booking sessions</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topStations} layout="vertical" margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category" dataKey="name" width={90}
                  tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => v.length > 11 ? `${v.slice(0, 11)}…` : v}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  formatter={(v) => [`${Number(v)} sessions`, 'Bookings']}
                  contentStyle={{ background: '#12121e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}
                  labelStyle={{ color: '#94a3b8', fontSize: 11 }}
                  itemStyle={{ color: '#fff', fontWeight: 700 }}
                />
                <Bar dataKey="totalBookings" radius={[0, 6, 6, 0]} maxBarSize={24}>
                  {topStations.map((entry) => (
                    <Cell key={entry.name} fill={STATION_TYPE_COLORS[entry.type] ?? '#7c3aed'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Type legend */}
            <div className="flex flex-wrap gap-3 mt-2 pt-3 border-t border-white/[0.04]">
              {Object.entries(STATION_TYPE_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                  <span className="text-[10px] text-slate-500">{type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Station Utilization Heatmap — hour × day */}
          <div className="glass-card p-6 border border-white/[0.08] hover:border-cyan-500/20 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-5">
              <Zap size={18} className="text-cyan-400" />
              <div>
                <h2 className="text-base font-bold text-white">Utilization Heatmap</h2>
                <p className="text-xs text-slate-500">Bookings per hour × day (last 30 days)</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[460px]">
                {/* Hour labels */}
                <div className="flex items-center mb-1 pl-8">
                  {HOURS.map((h, i) => (
                    // Show every 3rd hour label to avoid crowding
                    <div key={i} className="flex-1 text-center">
                      <span className="text-[8px] text-slate-600">
                        {i % 3 === 0 ? h : ''}
                      </span>
                    </div>
                  ))}
                </div>

                {DAYS.map((day) => {
                  const dayIndex = DAYS.indexOf(day);
                  return (
                    <div key={day} className="flex items-center gap-0 mb-0.5">
                      <span className="text-[10px] text-slate-600 w-8 flex-shrink-0 font-medium">{day}</span>
                      {HOURS.map((_, hourIdx) => {
                        const cell = heatmap.cells.find(
                          (c) => c.dayIndex === dayIndex && c.hour === hourIdx
                        );
                        const count = cell?.count ?? 0;
                        return (
                          <div
                            key={hourIdx}
                            className="flex-1 h-5 mx-[1px] rounded-[3px] transition-all duration-500 cursor-default"
                            style={{ background: heatColor(count, heatmap.maxCount) }}
                            title={`${day} ${HOURS[hourIdx]}: ${count} booking${count !== 1 ? 's' : ''}`}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Heatmap legend gradient */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.04]">
              <span className="text-[10px] text-slate-600">Low</span>
              <div className="flex-1 h-2 rounded-full" style={{
                background: 'linear-gradient(to right, rgba(37,99,235,0.2), rgba(124,58,237,0.5), rgba(245,158,11,0.7), rgba(239,68,68,0.9))'
              }} />
              <span className="text-[10px] text-slate-600">High</span>
            </div>
          </div>
        </div>

        {/* ── Recent Bookings Table ─────────────────────────────────────────── */}
        <div className="glass-card overflow-hidden border border-white/[0.08] hover:border-white/[0.15] transition-colors duration-300">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock size={16} className="text-blue-400" />
                Recent Bookings
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Last 10 sessions</p>
            </div>
            <button
              onClick={() => navigate('/bookings')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              View all →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  {['Player', 'Station', 'Started', 'Duration', 'Amount', 'Status'].map((h) => (
                    <th key={h} className="text-left text-[10px] font-bold text-slate-600 uppercase tracking-[0.1em] px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats?.recentBookings?.map((b: any, i: number) => (
                  <tr
                    key={b.id}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                          {b.user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-white font-medium truncate max-w-[100px]">{b.user?.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-400">{b.station?.name}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{formatDateTime(b.startTime)}</td>
                    <td className="px-5 py-3 text-sm text-slate-300 font-mono">
                      {b.duration ? formatDuration(b.duration) : (
                        b.status === 'ACTIVE'
                          ? <span className="text-amber-400 flex items-center gap-1 text-xs"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />Live</span>
                          : '—'
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-emerald-400">
                      {b.totalAmount ? formatCurrency(b.totalAmount) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {b.status === 'ACTIVE' && <Clock size={12} className="text-amber-400" />}
                        {b.status === 'COMPLETED' && <CheckCircle2 size={12} className="text-emerald-400" />}
                        {b.status === 'CANCELLED' && <XCircle size={12} className="text-red-400" />}
                        <StatusBadge status={b.status} />
                      </div>
                    </td>
                  </tr>
                ))}
                {(!stats?.recentBookings?.length) && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-600 text-sm">
                      No bookings yet. Start a session from the Bookings page.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Quick Actions (mobile-friendly shortcut row) ────────────────── */}
        {isStaff && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Plus, label: 'New Booking', onClick: handleNewBooking, color: 'from-purple-600 to-blue-600' },
              { icon: UserPlus, label: 'Walk-in', onClick: handleAddWalkin, color: 'from-blue-600 to-cyan-600' },
              { icon: Monitor, label: 'Stations', onClick: () => navigate('/stations'), color: 'from-cyan-600 to-teal-600' },
              { icon: Users, label: 'Customers', onClick: () => navigate('/customers'), color: 'from-emerald-600 to-green-600' },
            ].map(({ icon: Icon, label, onClick, color }) => (
              <button
                key={label}
                onClick={onClick}
                className={`glass-card p-4 flex items-center gap-3 border border-white/[0.08]
                  hover:border-white/[0.2] hover:scale-[1.02] transition-all duration-200 group`}
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <Icon size={16} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-slate-400 group-hover:text-white transition-colors">{label}</span>
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
