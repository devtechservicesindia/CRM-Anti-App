import { useEffect, useState } from 'react';
import { CreditCard, DollarSign, CheckCircle2, Clock, Printer } from 'lucide-react';
import Topbar from '@/components/layout/Topbar';
import api from '@/lib/api';
import { Payment } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { generateThermalReceipt } from '@/lib/receipt';
import { Booking } from '@/types';

const methodConfig = {
  CASH: { label: 'Cash', color: 'emerald' },
  CARD: { label: 'Card', color: 'blue' },
  UPI: { label: 'UPI', color: 'purple' },
  WALLET: { label: 'Wallet', color: 'amber' },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState({ today: 0, month: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [p, s] = await Promise.all([
        api.get('/payments?limit=30'),
        api.get('/payments/stats'),
      ]);
      setPayments(p.data.payments);
      setStats(s.data);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div>
      <Topbar title="Payments" subtitle="Revenue & transaction records" />
      <div className="p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Today's Revenue", value: formatCurrency(stats.today), icon: DollarSign, color: 'emerald' },
            { label: "This Month", value: formatCurrency(stats.month), icon: CreditCard, color: 'blue' },
            { label: "All Time", value: formatCurrency(stats.total), icon: CheckCircle2, color: 'purple' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass-card p-5">
              <div className={`w-10 h-10 rounded-xl bg-${color}-500/20 flex items-center justify-center mb-3`}>
                <Icon size={18} className={`text-${color}-400`} />
              </div>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h2 className="text-base font-bold text-white">Transaction History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  {['Reference', 'Customer', 'Station', 'Amount', 'Method', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center text-slate-500 py-12">
                    <div className="inline-block w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  </td></tr>
                ) : payments.map((p) => {
                  const method = methodConfig[p.method] || { label: p.method, color: 'slate' };
                  return (
                    <tr key={p.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition">
                      <td className="px-5 py-3 text-xs text-slate-500 font-mono">{p.id.slice(0, 8)}…</td>
                      <td className="px-5 py-3 text-sm text-white">{p.user?.name || '—'}</td>
                      <td className="px-5 py-3 text-sm text-slate-400">{p.booking?.station?.name || '—'}</td>
                      <td className="px-5 py-3 text-sm font-bold text-emerald-400">{formatCurrency(p.amount)}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full bg-${method.color}-500/10 text-${method.color}-400 border border-${method.color}-500/20`}>
                          {method.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          {p.status === 'COMPLETED'
                            ? <CheckCircle2 size={13} className="text-emerald-400" />
                            : <Clock size={13} className="text-amber-400" />}
                          <span className={`text-xs font-medium ${p.status === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {p.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">{formatDateTime(p.createdAt)}</td>
                      <td className="px-5 py-3">
                        {p.status === 'COMPLETED' && p.booking && (
                          <button
                            onClick={() => {
                              const b = { ...p.booking, user: p.user, totalAmount: p.amount, createdAt: p.createdAt } as unknown as Booking;
                              generateThermalReceipt(b);
                            }}
                            className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] transition text-slate-400 hover:text-white"
                            title="Print Receipt"
                          >
                            <Printer size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
