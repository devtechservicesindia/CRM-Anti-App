import { useEffect, useState } from 'react';
import { Plus, Monitor, Gamepad2, Headset, Car, Wrench, Zap } from 'lucide-react';
import Topbar from '@/components/layout/Topbar';
import api from '@/lib/api';
import { Station } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { socket } from '@/lib/socket';

const typeConfig = {
  PC: { icon: Monitor, color: 'from-purple-600 to-purple-800', label: 'Gaming PC' },
  CONSOLE: { icon: Gamepad2, color: 'from-blue-600 to-blue-800', label: 'Console' },
  VR: { icon: Headset, color: 'from-cyan-600 to-cyan-800', label: 'VR Zone' },
  SIMULATOR: { icon: Car, color: 'from-amber-600 to-amber-700', label: 'Simulator' },
};

const statusConfig = {
  AVAILABLE: { label: 'Available', cls: 'status-available' },
  OCCUPIED: { label: 'Occupied', cls: 'status-occupied' },
  MAINTENANCE: { label: 'Maintenance', cls: 'status-maintenance' },
};

const StationCard = ({ station, onUpdate }: { station: Station; onUpdate: () => void }) => {
  const { user } = useAuthStore();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const cfg = typeConfig[station.type] || typeConfig.PC;
  const status = statusConfig[station.status];
  const Icon = cfg.icon;
  const activeBooking = station.bookings?.[0];

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.patch(`/stations/${station.id}`, { status: newStatus });
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`glass-card p-5 transition-all hover:scale-[1.01]
      ${station.status === 'OCCUPIED' ? 'border-amber-500/30' :
        station.status === 'MAINTENANCE' ? 'border-red-500/30' : 'border-white/[0.08]'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center`}>
          <Icon size={22} className="text-white" />
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.cls}`}>
          {status.label}
        </span>
      </div>

      {/* Info */}
      <h3 className="text-base font-bold text-white mb-1">{station.name}</h3>
      <p className="text-xs text-slate-500 mb-3">{cfg.label}</p>

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-lg font-bold text-white">{formatCurrency(station.hourlyRate)}<span className="text-xs text-slate-500">/hr</span></p>
        </div>
        {station.status === 'OCCUPIED' && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-xs text-amber-400 font-medium">Live</span>
          </div>
        )}
      </div>

      {/* Active user */}
      {activeBooking?.user && (
        <div className="mb-4 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-xs text-amber-400 font-medium">Current Player</p>
          <p className="text-sm text-white">{activeBooking.user.name}</p>
        </div>
      )}

      {/* Specs */}
      {station.specs && (
        <div className="space-y-1 mb-4">
          {Object.entries(station.specs).slice(0, 2).map(([k, v]) => (
            <div key={k} className="flex justify-between text-xs">
              <span className="text-slate-500 capitalize">{k}</span>
              <span className="text-slate-300">{String(v)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {canEdit && (
        <div className="grid grid-cols-2 gap-2">
          {station.status !== 'AVAILABLE' && (
            <button
              onClick={() => handleStatusChange('AVAILABLE')}
              className="py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition"
            >
              Set Available
            </button>
          )}
          {station.status !== 'MAINTENANCE' && (
            <button
              onClick={() => handleStatusChange('MAINTENANCE')}
              className="py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition flex items-center justify-center gap-1"
            >
              <Wrench size={11} /> Maintain
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const { user } = useAuthStore();
  const [form, setForm] = useState({ name: '', type: 'PC', hourlyRate: '' });

  const fetchStations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/stations');
      setStations(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
    socket.on('station-updated', fetchStations);
    socket.on('station-created', fetchStations);
    socket.on('station-deleted', fetchStations);
    socket.on('booking-created', fetchStations);
    socket.on('booking-ended', fetchStations);
    socket.on('booking-cancelled', fetchStations);

    return () => {
      socket.off('station-updated', fetchStations);
      socket.off('station-created', fetchStations);
      socket.off('station-deleted', fetchStations);
      socket.off('booking-created', fetchStations);
      socket.off('booking-ended', fetchStations);
      socket.off('booking-cancelled', fetchStations);
    };
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/stations', { ...form, hourlyRate: parseFloat(form.hourlyRate) });
    setShowAdd(false);
    setForm({ name: '', type: 'PC', hourlyRate: '' });
    fetchStations();
  };

  const available = stations.filter((s) => s.status === 'AVAILABLE').length;
  const occupied = stations.filter((s) => s.status === 'OCCUPIED').length;
  const maintenance = stations.filter((s) => s.status === 'MAINTENANCE').length;

  return (
    <div>
      <Topbar title="Stations" subtitle={`${stations.length} stations total`} />
      <div className="p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Available', value: available, color: 'emerald' },
            { label: 'Occupied', value: occupied, color: 'amber' },
            { label: 'Maintenance', value: maintenance, color: 'red' },
          ].map(({ label, value, color }) => (
            <div key={label} className="glass-card p-4 text-center">
              <div className={`text-3xl font-bold text-${color}-400`}>{value}</div>
              <div className="text-xs text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Add Button */}
        {user?.role === 'ADMIN' && (
          <div className="flex justify-end">
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-purple-500 hover:to-blue-500 transition glow-purple"
            >
              <Plus size={16} /> Add Station
            </button>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stations.map((s) => <StationCard key={s.id} station={s} onUpdate={fetchStations} />)}
          </div>
        )}
      </div>

      {/* Add Station Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="glass-card p-6 w-full max-w-md animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Zap size={20} className="text-purple-400" /> Add New Station
            </h2>
            <form onSubmit={handleAdd} className="space-y-4">
              {[
                { label: 'Station Name', key: 'name', placeholder: 'e.g. Alpha-4 (PC)', type: 'text' },
                { label: 'Hourly Rate (₹)', key: 'hourlyRate', placeholder: '80', type: 'number' },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="text-xs text-slate-400 uppercase tracking-wider">{label}</label>
                  <input
                    type={type}
                    required
                    value={(form as Record<string, string>)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="mt-1.5 w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm outline-none focus:border-purple-500/50 transition"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="mt-1.5 w-full bg-[#1a1a2e] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-purple-500/50 transition"
                >
                  {['PC', 'CONSOLE', 'VR', 'SIMULATOR'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl bg-white/[0.05] text-slate-400 hover:text-white transition text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-sm hover:from-purple-500 hover:to-blue-500 transition">Add Station</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
