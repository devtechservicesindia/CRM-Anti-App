import { useEffect, useState } from 'react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import Topbar from '@/components/layout/Topbar';
import api from '@/lib/api';
import { RevenueDataPoint } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function ReportsPage() {
  const [revenue7, setRevenue7] = useState<RevenueDataPoint[]>([]);
  const [revenue30, setRevenue30] = useState<RevenueDataPoint[]>([]);
  const [stationUsage, setStationUsage] = useState<{ name: string; type: string; totalBookings: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/revenue?days=7'),
      api.get('/dashboard/revenue?days=30'),
      api.get('/dashboard/station-usage'),
    ]).then(([r7, r30, su]) => {
      setRevenue7(r7.data);
      setRevenue30(r30.data);
      setStationUsage(su.data);
      setLoading(false);
    });
  }, []);

  const total30 = revenue30.reduce((s, d) => s + d.revenue, 0);
  const totalBookings30 = revenue30.reduce((s, d) => s + d.bookings, 0);

  const COLORS = ['#7c3aed', '#2563eb', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6'];

  if (loading) return <div className="min-h-screen flex items-center justify-center">
    <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
  </div>;

  return (
    <div>
      <Topbar title="Reports & Analytics" subtitle="Business intelligence dashboard" />
      <div className="p-6 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: '30-Day Revenue', value: formatCurrency(total30) },
            { label: 'Total Sessions', value: totalBookings30, suffix: ' bookings' },
            { label: 'Avg per Session', value: totalBookings30 ? formatCurrency(total30 / totalBookings30) : '₹0' },
            { label: 'Daily Average', value: formatCurrency(total30 / 30) },
          ].map(({ label, value, suffix = '' }) => (
            <div key={label} className="glass-card p-5">
              <div className="text-2xl font-bold text-white">{value}{suffix}</div>
              <div className="text-xs text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* 30-day revenue */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-1">30-Day Revenue Trend</h2>
          <p className="text-xs text-slate-500 mb-5">Daily revenue performance</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenue30}>
              <defs>
                <linearGradient id="grad30" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip formatter={(v: unknown) => [formatCurrency(v as number), 'Revenue']}
                contentStyle={{ background: '#12121e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#f1f5f9' }} />
              <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} fill="url(#grad30)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bookings bar */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-white mb-1">Weekly Bookings</h2>
            <p className="text-xs text-slate-500 mb-5">Sessions per day (last 7 days)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenue7}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  formatter={(v: unknown) => String(v)}
                  contentStyle={{ background: '#12121e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#f1f5f9' }} />
                <Bar dataKey="bookings" radius={[6, 6, 0, 0]}>
                  {revenue7.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Station usage */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-white mb-4">Station Performance</h2>
            <div className="space-y-3">
              {[...stationUsage].sort((a, b) => b.totalBookings - a.totalBookings).map((s, i) => {
                const max = Math.max(...stationUsage.map(x => x.totalBookings)) || 1;
                const pct = (s.totalBookings / max) * 100;
                return (
                  <div key={s.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">{s.name}</span>
                      <span className="text-white font-semibold">{s.totalBookings} sessions</span>
                    </div>
                    <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
