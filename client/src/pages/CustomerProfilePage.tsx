import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Star, Clock, Monitor, CreditCard, Activity, 
  MapPin, CheckCircle, Smartphone, Edit3, XCircle, Save,
  AlertTriangle
} from 'lucide-react';
import api from '@/lib/api';
import type { User, Booking, Payment, LoyaltyTransaction } from '@/types';
import { formatDateTime, formatCurrency, formatDuration } from '@/lib/utils';
import Topbar from '@/components/layout/Topbar';

const TierBadge = ({ tier }: { tier?: string }) => {
  const config: Record<string, string> = {
    'Platinum': 'bg-gradient-to-r from-slate-300 to-slate-200 text-slate-800 shadow-[0_0_15px_rgba(203,213,225,0.4)]',
    'Gold': 'bg-gradient-to-r from-yellow-500 to-amber-400 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    'Silver': 'bg-gradient-to-r from-slate-400 to-slate-300 text-slate-900',
    'Bronze': 'bg-gradient-to-r from-orange-400 to-orange-300 text-orange-950',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-md ${tier ? config[tier] : 'bg-slate-800 text-slate-400'}`}>
      {tier || 'Bronze'}
    </span>
  );
};

export default function CustomerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'payments' | 'loyalty'>('timeline');

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', staffNotes: '' });

  const fetchUser = async () => {
    try {
      const { data } = await api.get(`/users/${id}`);
      setUser(data);
      setEditForm({ name: data.name, phone: data.phone || '', staffNotes: data.staffNotes || '' });
    } catch (err) {
      console.error(err);
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { id && fetchUser(); }, [id]);

  const handleSave = async () => {
    try {
      await api.patch(`/users/${id}`, editForm);
      setIsEditing(false);
      fetchUser();
    } catch (err) {
      alert('Failed to save profile');
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500 flex justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return null;

  // Auto-calculate Favorite Station
  const stCount: Record<string, number> = {};
  user.bookings?.forEach(b => {
    if (b.station?.name) {
      stCount[b.station.name] = (stCount[b.station.name] || 0) + 1;
    }
  });
  const favStation = Object.entries(stCount).sort((a,b) => b[1] - a[1])[0]?.[0] || 'Unknown';

  return (
    <div>
      <Topbar title="Customer Record" subtitle={`Detailed profile for ${user.name}`} />
      
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <button onClick={() => navigate('/customers')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-white transition">
           <ArrowLeft size={14} /> Back to Directory
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Profile Card */}
          <div className="space-y-6">
            <div className="glass-card overflow-hidden">
               <div className="p-6 bg-gradient-to-br from-purple-900/40 to-blue-900/20 border-b border-white/5 relative">
                  <div className="absolute top-4 right-4">
                    <TierBadge tier={user.tier} />
                  </div>
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-2xl mb-4">
                    {user.name.substring(0, 2).toUpperCase()}
                  </div>
                  {isEditing ? (
                    <input type="text" className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-lg font-bold text-white mb-2 focus:border-purple-500" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                  ) : (
                    <h1 className="text-2xl font-bold text-white mb-2">{user.name}</h1>
                  )}
                  <p className="text-slate-400 text-sm flex items-center gap-2 mb-1"><MapPin size={12}/> {user.email}</p>
                  
                  {isEditing ? (
                    <div className="flex items-center gap-2 text-sm mt-2">
                       <Smartphone size={12} className="text-slate-500"/>
                       <input type="text" placeholder="Phone..." className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs text-white" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm flex items-center gap-2"><Smartphone size={12}/> {user.phone || 'No phone'}</p>
                  )}
               </div>

               <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Lifetime Spent</span>
                    <span className="font-bold text-emerald-400">{formatCurrency(user.totalSpent)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Total Visits</span>
                    <span className="font-bold text-white">{user.bookings?.length || 0} sessions</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Favorite Station</span>
                    <span className="font-bold text-purple-400 flex items-center gap-1"><Monitor size={12}/> {favStation}</span>
                  </div>
               </div>
            </div>

            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-sm font-bold text-white flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500"/> Staff Notes</h3>
                   {!isEditing && <button onClick={() => setIsEditing(true)} className="text-slate-500 hover:text-white"><Edit3 size={14}/></button>}
                </div>
                {isEditing ? (
                  <textarea 
                     value={editForm.staffNotes} 
                     onChange={e => setEditForm({...editForm, staffNotes: e.target.value})} 
                     className="w-full h-32 bg-[#0a0a0f] border border-white/10 rounded-xl p-3 text-sm text-slate-300 focus:border-purple-500 outline-none" 
                     placeholder="Add internal notes about this customer..."
                  />
                ) : (
                  <div className="min-h-[100px] text-sm text-slate-400 italic">
                    {user.staffNotes || 'No notes added.'}
                  </div>
                )}
                
                {isEditing && (
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => setIsEditing(false)} className="flex-1 py-2 rounded-lg bg-white/5 text-slate-400 text-xs font-bold hover:bg-white/10">Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-2 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 flex items-center justify-center gap-1"><Save size={12}/> Save Profile</button>
                  </div>
                )}
            </div>
            
            <div className="glass-card p-6 border-amber-500/20 bg-gradient-to-b from-[#12121e] to-amber-950/20">
               <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><Star size={16} className="text-amber-400"/> Loyalty Balance</h3>
               <div className="text-4xl font-black text-amber-400 tracking-tighter shadow-amber-400/50 drop-shadow-lg mb-2">
                 {user.loyaltyPoints.toLocaleString()}
               </div>
               <p className="text-[10px] uppercase tracking-widest text-slate-500">Valid Points</p>
            </div>
          </div>

          {/* Right Column: Dynamic Timeline & Logs */}
          <div className="lg:col-span-2 space-y-6">
             <div className="glass-card p-2 flex gap-2">
               {[
                 { id: 'timeline', icon: <Clock size={14}/>, label: 'Session Timeline' },
                 { id: 'payments', icon: <CreditCard size={14}/>, label: 'Payments' },
                 { id: 'loyalty', icon: <Activity size={14}/>, label: 'Loyalty Log' },
               ].map(tab => (
                 <button 
                   key={tab.id} 
                   onClick={() => setActiveTab(tab.id as any)}
                   className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${activeTab === tab.id ? 'bg-white/10 text-white glow-white/20' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
                 >
                   {tab.icon} {tab.label}
                 </button>
               ))}
             </div>

             <div className="glass-card p-6 min-h-[500px]">
                {/* 1. TIMELINE */}
                {activeTab === 'timeline' && (
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-white mb-6">Booking Flow</h3>
                    {user.bookings?.length === 0 ? <p className="text-sm text-slate-500">No sessions recorded.</p> : (
                      <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:left-[11px] before:w-px before:bg-white/10">
                        {user.bookings?.map(b => (
                          <div key={b.id} className="relative">
                             <div className="absolute -left-[31px] bg-[#0a0a0f] p-1 rounded-full text-purple-500 ring-1 ring-purple-500/50">
                                <CheckCircle size={12} />
                             </div>
                             <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:border-purple-500/30 transition">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h4 className="text-sm font-bold text-white flex items-center gap-2"><Monitor size={12}/> {b.station?.name}</h4>
                                    <p className="text-xs text-slate-500">{formatDateTime(b.startTime)}</p>
                                  </div>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : b.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                     {b.status}
                                  </span>
                                </div>
                                <div className="flex gap-4 text-xs font-mono">
                                  <span className="text-slate-400">Dur: <span className="text-white">{b.duration ? formatDuration(b.duration) : '---'}</span></span>
                                  <span className="text-slate-400">Total: <span className="text-emerald-400">{b.totalAmount ? formatCurrency(b.totalAmount) : 'Pending'}</span></span>
                                </div>
                             </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. PAYMENTS */}
                {activeTab === 'payments' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-500 text-[10px] uppercase tracking-widest">
                          <th className="pb-3">Date</th>
                          <th className="pb-3">Amount</th>
                          <th className="pb-3">Method</th>
                          <th className="pb-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {user.payments?.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-slate-500">No payments found.</td></tr>}
                        {user.payments?.map(p => (
                          <tr key={p.id}>
                            <td className="py-4 text-slate-400">{formatDateTime(p.createdAt)}</td>
                            <td className="py-4 font-bold text-emerald-400">{formatCurrency(p.amount)}</td>
                            <td className="py-4 text-slate-300">{p.method}</td>
                            <td className="py-4">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded bg-white/5 ${p.status === 'COMPLETED' ? 'text-emerald-400' : 'text-slate-400'}`}>{p.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 3. LOYALTY LOG */}
                {activeTab === 'loyalty' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-500 text-[10px] uppercase tracking-widest">
                          <th className="pb-3">Date</th>
                          <th className="pb-3">Type</th>
                          <th className="pb-3">Points</th>
                          <th className="pb-3">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {user.loyaltyTransactions?.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-slate-500">No loyalty history.</td></tr>}
                        {user.loyaltyTransactions?.map(lt => (
                          <tr key={lt.id}>
                            <td className="py-4 text-slate-400">{formatDateTime(lt.createdAt).split(' ')[0]}</td>
                            <td className="py-4">
                               <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${lt.type === 'EARN' ? 'bg-amber-500/20 text-amber-400' : lt.type === 'REDEEM' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>{lt.type}</span>
                            </td>
                            <td className={`py-4 font-mono font-bold ${lt.points > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {lt.points > 0 ? '+' : ''}{lt.points}
                            </td>
                            <td className="py-4 text-slate-400 text-xs max-w-xs truncate" title={lt.notes}>{lt.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
             </div>

          </div>
        </div>
      </div>
    </div>
  );
}
