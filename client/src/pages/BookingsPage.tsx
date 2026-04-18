import { useEffect, useState, useMemo } from 'react';
import { Plus, Clock, CheckCircle2, XCircle, Timer, Printer, Search, Download, Edit3, Monitor, Zap, Calendar, UserPlus } from 'lucide-react';
import Topbar from '@/components/layout/Topbar';
import api from '@/lib/api';
import { Booking, Station, User } from '@/types';
import { formatDateTime, formatCurrency, formatDuration } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { differenceInMinutes, addMinutes } from 'date-fns';
import { socket } from '@/lib/socket';
import { generateThermalReceipt } from '@/lib/receipt';

// ─── Shared UI ────────────────────────────────────────────────────────────────
const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'ACTIVE') return <Clock size={14} className="text-amber-400" />;
  if (status === 'COMPLETED') return <CheckCircle2 size={14} className="text-emerald-400" />;
  return <XCircle size={14} className="text-red-400" />;
};

const LiveTimer = ({ startTime, endTime }: { startTime: string; endTime?: string }) => {
  const calc = () => {
    const now = new Date();
    if (endTime) {
      const remaining = differenceInMinutes(new Date(endTime), now);
      if (remaining < 0) return { text: `Overdue ${Math.abs(remaining)}m`, overdue: true };
      return { text: `${formatDuration(remaining)} left`, overdue: false };
    }
    return { text: formatDuration(differenceInMinutes(now, new Date(startTime))), overdue: false };
  };

  const [state, setState] = useState(calc());

  useEffect(() => {
    const t = setInterval(() => setState(calc()), 30000);
    return () => clearInterval(t);
  }, [startTime, endTime]);

  return (
    <span className={`font-mono font-bold text-xs ${state.overdue ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
      {state.text}
    </span>
  );
};

// ─── Modals ───────────────────────────────────────────────────────────────────

function WalkInModal({ onClose, onComplete, stations, customers }: { onClose: () => void, onComplete: () => void, stations: Station[], customers: User[] }) {
  const [loading, setLoading] = useState(false);
  
  const guestUser = customers.find(c => c.name.toLowerCase().includes('guest')) || customers[0];
  const firstAvailable = stations.find(s => s.status === 'AVAILABLE');

  const startWalkIn = async () => {
    if (!guestUser || !firstAvailable) return;
    setLoading(true);
    try {
      await api.post('/bookings', { userId: guestUser.id, stationId: firstAvailable.id });
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card p-6 w-full max-w-sm border-amber-500/30 glow-amber text-center animate-slide-in">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 glow-amber">
          <Zap size={32} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Fast Walk-in</h2>
        {firstAvailable ? (
          <p className="text-slate-400 text-sm mb-6">Start immediately on {firstAvailable.name} ({firstAvailable.type}) for Guest.</p>
        ) : (
          <p className="text-red-400 text-sm mb-6">No stations available right now.</p>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/[0.05] text-slate-400 hover:bg-white/[0.1]">Cancel</button>
          <button onClick={startWalkIn} disabled={!firstAvailable || loading}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-400 disabled:opacity-50">
            {loading ? 'Starting...' : 'Start Now'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ExtendSessionModal({ booking, onClose, onComplete }: { booking: Booking, onClose: () => void, onComplete: () => void }) {
  const [mins, setMins] = useState(30);
  const [loading, setLoading] = useState(false);

  const handleExtend = async () => {
    setLoading(true);
    try {
      await api.patch(`/bookings/${booking.id}/extend`, { addMinutes: mins });
      onComplete();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to extend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card p-6 w-full max-w-sm border-blue-500/30 animate-slide-in flex flex-col items-center">
        <h2 className="text-xl font-bold text-white mb-2">Extend Session</h2>
        <p className="text-sm text-slate-400 mb-6 text-center">Add more time to {booking.user?.name}'s session on {booking.station?.name}.</p>
        
        <div className="flex gap-2 w-full mb-6 relative">
           <button onClick={() => setMins(m => Math.max(15, m - 15))} className="bg-white/10 px-4 py-2 rounded-xl text-white font-bold hover:bg-white/20">-</button>
           <div className="flex-1 bg-[#0a0a0f] border border-white/10 rounded-xl flex items-center justify-center text-xl font-bold text-blue-400">
              +{mins} min
           </div>
           <button onClick={() => setMins(m => m + 15)} className="bg-white/10 px-4 py-2 rounded-xl text-white font-bold hover:bg-white/20">+</button>
        </div>

        <div className="flex gap-3 w-full">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/[0.05] text-slate-400 hover:text-white transition text-sm">Cancel</button>
          <button onClick={handleExtend} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold text-sm hover:from-blue-500 hover:to-cyan-500 transition">Confirm</button>
        </div>
      </div>
    </div>
  );
}

function FullBookingModal({ onClose, onComplete, stations }: { onClose: () => void, onComplete: () => void, stations: Station[] }) {
  const [form, setForm] = useState({ userId: '', stationId: '', duration: 0, promo: '', startTime: '' });
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      api.get(`/users?role=CUSTOMER&limit=5&search=${search}`).then(r => setCustomers(r.data.users));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Derived state
  const selStation = stations.find(s => s.id === form.stationId);
  const basePrice = (selStation && form.duration > 0) ? (form.duration / 60) * selStation.hourlyRate : 0;
  const isPromoValid = form.promo.toUpperCase() === 'GAMER10';
  const discount = isPromoValid ? basePrice * 0.1 : 0;
  const total = basePrice - discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userId || !form.stationId) return alert('Select customer and station');
    setLoading(true);
    try {
      const payload: any = { userId: form.userId, stationId: form.stationId };
      if (form.startTime) payload.startTime = new Date(form.startTime).toISOString();
      if (form.duration > 0) payload.duration = form.duration;
      await api.post('/bookings', payload);
      onComplete();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Conflict or error creating booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto border-purple-500/30 animate-slide-in">
        <div className="sticky top-0 bg-[#12121e]/90 backdrop-blur pb-4 pt-6 px-6 border-b border-white/10 z-10 flex justify-between items-center">
           <h2 className="text-xl font-bold text-white flex items-center gap-2"><Calendar className="text-purple-400" /> Advanced Booking</h2>
           <button onClick={onClose} className="text-slate-500 hover:text-white"><XCircle size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Station Selection Grid */}
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">1. Select Station</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {stations.map(s => {
                const sel = form.stationId === s.id;
                const occ = s.status === 'OCCUPIED';
                return (
                  <button type="button" key={s.id} onClick={() => setForm({...form, stationId: s.id})}
                    className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center transition-all ${sel ? 'bg-purple-500/20 border-purple-500 glow-purple scale-105' : occ ? 'bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed' : 'bg-white/[0.04] border-white/10 hover:border-white/30 hover:bg-white/10'}`}>
                    <Monitor size={18} className={`mb-1 ${sel ? 'text-purple-400' : 'text-slate-400'}`} />
                    <span className={`text-[10px] font-bold ${sel ? 'text-white' : 'text-slate-400'}`}>{s.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Search */}
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">2. Select Customer</label>
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Type to search..." className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:border-purple-500 transition" />
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                {customers.map(c => (
                  <div key={c.id} onClick={() => setForm({...form, userId: c.id})} className={`p-2 rounded-lg cursor-pointer flex gap-2 items-center text-sm ${form.userId === c.id ? 'bg-purple-500/20 text-purple-300' : 'hover:bg-white/5 text-slate-300'}`}>
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">{c.name[0]}</div>
                    {c.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Time & Duration */}
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">3. Schedule</label>
                <input type="datetime-local" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-purple-500 transition [color-scheme:dark]" />
                <p className="text-[10px] text-slate-500 mt-1">Leave blank to start immediately.</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Duration (Mins)</label>
                <input type="number" step="15" min="0" value={form.duration || ''} placeholder="0 = Open Ended" onChange={e => setForm({...form, duration: parseInt(e.target.value) || 0})} className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-purple-500 transition" />
              </div>
            </div>
          </div>

          {/* Pricing & Promo */}
          {selStation && form.duration > 0 && (
            <div className="bg-[#0a0a0f]/50 p-4 rounded-xl border border-white/5 grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Promo Code</label>
                  <div className="flex gap-2">
                    <input type="text" value={form.promo} onChange={e => setForm({...form, promo: e.target.value})} placeholder="e.g. GAMER10" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white uppercase focus:border-purple-500" />
                  </div>
                  {form.promo && isPromoValid && <p className="text-[10px] text-emerald-400 mt-1">10% Off Applied!</p>}
                  {form.promo && !isPromoValid && <p className="text-[10px] text-red-400 mt-1">Invalid code</p>}
               </div>
               <div className="text-right flex flex-col justify-center">
                  <p className="text-xs text-slate-500 line-through">{formatCurrency(basePrice)}</p>
                  <p className="text-2xl font-black text-white">{formatCurrency(total)}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Estimated Total</p>
               </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-white/5">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/[0.05] text-slate-400 hover:text-white transition">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition disabled:opacity-50">
              {loading ? 'Confirming...' : 'Confirm Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BookingsPage() {
  const { user } = useAuthStore();
  const canManage = user?.role === 'ADMIN' || user?.role === 'STAFF';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [showFullModal, setShowFullModal] = useState(false);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [extendingBooking, setExtendingBooking] = useState<Booking | null>(null);

  // Filters
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/bookings?limit=100'); // Higher limit for local filtering
      setBookings(data.bookings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const refreshData = () => {
      fetchBookings();
      if (canManage) {
        api.get('/stations').then(({ data }) => setStations(data));
        api.get('/users?role=CUSTOMER').then(({ data }) => setCustomers(data.users));
      }
    };
    refreshData();
    socket.on('booking-created', refreshData);
    socket.on('booking-ended', refreshData);
    socket.on('booking-cancelled', refreshData);
    socket.on('booking-extended', refreshData);

    return () => {
      socket.off('booking-created', refreshData);
      socket.off('booking-ended', refreshData);
      socket.off('booking-cancelled', refreshData);
      socket.off('booking-extended', refreshData);
    };
  }, [canManage]);

  const handleEnd = async (id: string) => {
    await api.patch(`/bookings/${id}/end`);
    fetchBookings();
  };

  const handleCancel = async (id: string) => {
    await api.patch(`/bookings/${id}/cancel`);
    fetchBookings();
  };

  const handleExportCSV = () => {
    const headers = ['ID,Player,Station,Start,End,Duration,TotalAmount,Status\n'];
    const rows = filteredHistory.map(b => 
      `${b.id},"${b.user?.name}","${b.station?.name}",${b.startTime},${b.endTime || ''},${b.duration || ''},${b.totalAmount || 0},${b.status}`
    );
    const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-export-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const active = bookings.filter((b) => b.status === 'ACTIVE');
  
  // Apply history filters
  const filteredHistory = useMemo(() => {
    return bookings.filter(b => b.status !== 'ACTIVE').filter(b => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        if (!b.user?.name?.toLowerCase().includes(q) && !b.station?.name?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [bookings, statusFilter, searchFilter]);

  return (
    <div>
      <Topbar 
        title="Session Management" 
        subtitle={`${active.length} active right now`} 
        action={
          canManage && (
            <>
              <button onClick={() => setShowWalkIn(true)} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition"><Zap size={14} /> Walk-in</button>
              <button onClick={() => setShowFullModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold shadow-[0_0_15px_rgba(124,58,237,0.3)] transition hover:shadow-[0_0_20px_rgba(124,58,237,0.5)]"><Plus size={14} /> New Book</button>
            </>
          )
        }
      />
      <div className="p-6 space-y-6">

        {/* Live Arena Grid */}
        {active.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" /> Live Arena
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {active.map((b) => (
                <div key={b.id} className="glass-card p-4 border border-white/10 hover:border-amber-500/30 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Timer size={14} className="text-amber-400" />
                        <LiveTimer startTime={b.startTime} endTime={b.endTime} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{b.station?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-lg transform -rotate-6">
                        {b.user?.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{b.user?.name}</p>
                        <p className="text-[10px] text-slate-500">{formatDateTime(b.startTime)}</p>
                      </div>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex gap-2">
                      <button onClick={() => setExtendingBooking(b)} className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition flex justify-center"><Plus size={14}/></button>
                      <button onClick={() => handleEnd(b.id)} className="flex-[3] py-1.5 text-xs font-bold rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition text-center">END</button>
                      <button onClick={() => handleCancel(b.id)} className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition flex justify-center"><XCircle size={14}/></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History Table */}
        <div className="glass-card overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/[0.06] flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/[0.01]">
            <h2 className="text-base font-bold text-white whitespace-nowrap">Booking Log</h2>
            <div className="flex w-full sm:w-auto items-center gap-3">
               <div className="relative flex-1 sm:w-48">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="text" value={searchFilter} onChange={e=>setSearchFilter(e.target.value)} placeholder="Search..." className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:border-purple-500" />
               </div>
               <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-purple-500">
                  <option value="ALL">All Status</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
               </select>
               <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-xs transition"><Download size={14} /> CSV</button>
            </div>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  {['Player', 'Station', 'Scheduled', 'Duration', 'Amount', 'Status', 'Actions'].map((h) => (
                     <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && bookings.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-slate-500 py-12"><div className="inline-block w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></td></tr>
                ) : filteredHistory.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-slate-500 py-12 text-sm">No records found.</td></tr>
                ) : filteredHistory.map((b) => (
                  <tr key={b.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-slate-300 text-xs font-bold ring-1 ring-white/10">
                          {b.user?.name?.charAt(0)}
                        </div>
                        <span className="text-xs text-white">{b.user?.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">{b.station?.name}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{formatDateTime(b.startTime)}</td>
                    <td className="px-5 py-3 text-xs text-slate-300 font-mono">{b.duration ? formatDuration(b.duration) : '—'}</td>
                    <td className="px-5 py-3 text-xs font-bold text-emerald-400">{b.totalAmount ? formatCurrency(b.totalAmount) : '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <StatusIcon status={b.status} />
                        <span className={`text-[10px] font-bold tracking-wide ${b.status === 'COMPLETED' ? 'text-emerald-400' : 'text-red-400'}`}>{b.status}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {b.status === 'COMPLETED' && (
                        <button onClick={() => generateThermalReceipt(b)} className="text-slate-500 hover:text-white transition" title="Print Receipt">
                          <Printer size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {showFullModal && <FullBookingModal onClose={() => setShowFullModal(false)} onComplete={() => { setShowFullModal(false); fetchBookings(); }} stations={stations} />}
      {showWalkIn && <WalkInModal onClose={() => setShowWalkIn(false)} onComplete={() => { setShowWalkIn(false); fetchBookings(); }} stations={stations} customers={customers} />}
      {extendingBooking && <ExtendSessionModal booking={extendingBooking} onClose={() => setExtendingBooking(null)} onComplete={() => { setExtendingBooking(null); fetchBookings(); }} />}
    </div>
  );
}
