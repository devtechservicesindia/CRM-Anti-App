import { useEffect, useState } from 'react';
import { Gift, Star, Clock, CheckCircle2, XCircle, Plus } from 'lucide-react';
import Topbar from '@/components/layout/Topbar';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { formatDateTime } from '@/lib/utils';
import { Reward, RewardRedemption } from '@/types';

export default function RewardsPage() {
  const { user, updateUser } = useAuthStore();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'STAFF';

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', pointsCost: '', description: '', imageUrl: '', stock: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: rwds } = await api.get('/rewards');
      setRewards(rwds);

      if (isStaff) {
        const { data: rdms } = await api.get('/rewards/redemptions');
        setRedemptions(rdms);
      }
      
      // Refresh current user to get updated loyalty points
      if (user) {
        const { data: me } = await api.get('/auth/me');
        updateUser(me);
      }
    } catch (err) {
      console.error('Failed to fetch rewards data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isStaff]);

  const handleAddReward = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/rewards', form);
    setShowAdd(false);
    setForm({ name: '', pointsCost: '', description: '', imageUrl: '', stock: '' });
    fetchData();
  };

  const handleRedeem = async (rewardId: string, cost: number) => {
    if (!user || user.loyaltyPoints < cost) {
      alert("Not enough points!");
      return;
    }
    try {
      await api.post(`/rewards/${rewardId}/redeem`);
      fetchData();
      alert("Redemption requested successfully! Please see staff at the counter.");
    } catch (err: any) {
      alert(err.response?.data?.message || "Redemption failed");
    }
  };

  const handleUpdateRedemption = async (id: string, status: string) => {
    try {
      await api.patch(`/rewards/redemptions/${id}`, { status });
      fetchData();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  return (
    <div>
      <Topbar title="Loyalty Rewards" subtitle={isStaff ? "Manage catalog and fulfillments" : "Spend your points on awesome gear and snacks"} />
      
      <div className="p-6 space-y-6">
        {/* Customer Balance Banner */}
        {!isStaff && user && (
          <div className="glass-card p-6 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Your Loyalty Points</h2>
              <p className="text-sm text-slate-300">Earn 1 point for every ₹10 spent on sessions</p>
            </div>
            <div className="flex items-center gap-3 bg-black/30 px-6 py-3 rounded-2xl border border-white/10">
              <Star className="text-amber-400 fill-amber-400" size={28} />
              <span className="text-4xl font-bold text-white">{user.loyaltyPoints}</span>
            </div>
          </div>
        )}

        {/* Staff Add Button */}
        {user?.role === 'ADMIN' && (
          <div className="flex justify-end">
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-purple-500 hover:to-blue-500 transition glow-purple"
            >
              <Plus size={16} /> Add Reward
            </button>
          </div>
        )}

        {/* Rewards Catalog */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Gift className="text-purple-400" size={20} /> Rewards Catalog
          </h2>
          
          {loading ? (
             <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {rewards.map((r) => (
                <div key={r.id} className="glass-card overflow-hidden group">
                  <div className="h-40 bg-white/5 relative overflow-hidden">
                    {r.imageUrl ? (
                      <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">No Image</div>
                    )}
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-amber-400">{r.pointsCost}</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-white text-lg mb-1">{r.name}</h3>
                    <p className="text-xs text-slate-400 mb-4 line-clamp-2">{r.description || 'No description available.'}</p>
                    
                    {!isStaff ? (
                      <button 
                        onClick={() => handleRedeem(r.id, r.pointsCost)}
                        disabled={user!.loyaltyPoints < r.pointsCost || r.stock <= 0}
                        className={`w-full py-2.5 rounded-xl text-sm font-bold transition ${
                          user!.loyaltyPoints >= r.pointsCost && r.stock > 0
                            ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]'
                            : 'bg-white/5 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {r.stock <= 0 ? 'Out of Stock' : 'Redeem Now'}
                      </button>
                    ) : (
                      <div className="text-xs font-mono text-slate-500">Stock: {r.stock}</div>
                    )}
                  </div>
                </div>
              ))}
              {rewards.length === 0 && <div className="text-slate-500 text-sm">No rewards available yet in the catalog.</div>}
            </div>
          )}
        </div>

        {/* Staff Redemptions Queue */}
        {isStaff && (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="text-amber-400" size={20} /> Fulfillment Queue
            </h2>
            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    {['Date', 'Customer', 'Reward', 'Cost', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {redemptions.map(r => (
                    <tr key={r.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="px-5 py-3 text-xs text-slate-400">{formatDateTime(r.createdAt)}</td>
                      <td className="px-5 py-3 text-sm text-white font-medium">{r.user?.name}</td>
                      <td className="px-5 py-3 text-sm text-white">{r.reward?.name}</td>
                      <td className="px-5 py-3 text-sm text-amber-400 font-semibold">{r.reward?.pointsCost} pts</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2.5 py-1 font-semibold rounded-full ${
                          r.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          r.status === 'FULFILLED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {r.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleUpdateRedemption(r.id, 'FULFILLED')} className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400" title="Mark Fulfilled"><CheckCircle2 size={16} /></button>
                            <button onClick={() => handleUpdateRedemption(r.id, 'REJECTED')} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400" title="Reject & Refund"><XCircle size={16} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {redemptions.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500 text-sm">No redemption requests yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Reward Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="glass-card p-6 w-full max-w-md animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-6">Add New Reward</h2>
            <form onSubmit={handleAddReward} className="space-y-4">
              {[
                { label: 'Name', key: 'name', type: 'text', placeholder: 'e.g. Free 1 Hour Session' },
                { label: 'Points Cost', key: 'pointsCost', type: 'number', placeholder: '100' },
                { label: 'Stock', key: 'stock', type: 'number', placeholder: '999' },
                { label: 'Image URL', key: 'imageUrl', type: 'url', placeholder: 'https://...' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="text-xs text-slate-400 uppercase tracking-wider">{label}</label>
                  <input
                    type={type}
                    required={key === 'name' || key === 'pointsCost'}
                    value={(form as Record<string, string>)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="mt-1.5 w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm outline-none focus:border-purple-500/50 transition"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Redeem this for one hour of free gameplay..."
                  className="mt-1.5 w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm outline-none focus:border-purple-500/50 transition"
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl bg-white/[0.05] text-slate-400 hover:text-white transition text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-sm hover:from-purple-500 hover:to-blue-500 transition">Add Reward</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
