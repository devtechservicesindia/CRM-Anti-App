import { useEffect, useState } from 'react';
import { Star, Clock, Trophy, MapPin, Gamepad2, Ticket, ChevronRight, Activity } from 'lucide-react';
import Topbar from '@/components/layout/Topbar';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { User, Booking } from '@/types';
import { formatDateTime, formatDuration, formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const TierBadge = ({ tier }: { tier?: string }) => {
  const config = {
    'Platinum': 'bg-gradient-to-r from-slate-300 to-slate-200 text-slate-800 shadow-[0_0_15px_rgba(203,213,225,0.4)]',
    'Gold': 'bg-gradient-to-r from-yellow-500 to-amber-400 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    'Silver': 'bg-gradient-to-r from-slate-400 to-slate-300 text-slate-900',
    'Bronze': 'bg-gradient-to-r from-orange-400 to-orange-300 text-orange-950',
  }[tier || 'Bronze'] || 'bg-slate-800 text-slate-400';

  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-md ${config}`}>
      {tier || 'Bronze'}
    </span>
  );
};

export default function CustomerDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const { data } = await api.get(`/users/${user?.id}`); // Assuming /users/:id can be fetched by the user themselves
        setProfile(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchMe();
  }, [user]);

  if (loading) return <div className="p-12 text-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>;
  if (!profile) return null;

  const activeBooking = profile.bookings?.find(b => b.status === 'ACTIVE');
  const pastBookings = profile.bookings?.filter(b => b.status !== 'ACTIVE').slice(0, 5) || [];

  // Goal calculation for next tier
  const tiers = [{n:'Bronze',v:0}, {n:'Silver',v:2000}, {n:'Gold',v:5000}, {n:'Platinum',v:10000}];
  const currentLevelIndex = tiers.findIndex(t => t.n === profile.tier);
  const nextLevel = tiers[currentLevelIndex + 1];
  const progressToNext = nextLevel ? ((profile.totalSpent) / nextLevel.v) * 100 : 100;

  return (
    <div>
      <Topbar title="My Portal" subtitle={`Welcome back, ${profile.name.split(' ')[0]}!`} />
      
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Tier & Points Header */}
        <div className="glass-card p-6 bg-gradient-to-br from-purple-900/30 to-[#12121e] border-t-2 border-amber-500/50">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                   <Trophy size={32} />
                </div>
                <div>
                   <div className="flex gap-3 items-center mb-1">
                     <h2 className="text-2xl font-black text-white">{profile.name}</h2>
                     <TierBadge tier={profile.tier} />
                   </div>
                   <p className="text-slate-400 text-sm">Lifetime Spent: <span className="font-bold text-white">{formatCurrency(profile.totalSpent)}</span></p>
                </div>
              </div>
              
              <div className="text-center bg-black/30 p-4 rounded-2xl border border-white/5 min-w-[150px]">
                 <div className="flex items-center justify-center gap-2 mb-1">
                   <Star size={16} className="text-amber-400" />
                   <span className="text-3xl font-black text-amber-400 drop-shadow-lg">{profile.loyaltyPoints}</span>
                 </div>
                 <p className="text-[10px] uppercase tracking-widest text-slate-500">Available Points</p>
              </div>
           </div>

           {nextLevel && (
             <div className="mt-8">
                <div className="flex justify-between text-xs mb-2">
                   <span className="text-slate-400">Next Tier: <span className="font-bold text-white">{nextLevel.n}</span></span>
                   <span className="text-slate-500">{formatCurrency(profile.totalSpent)} / {formatCurrency(nextLevel.v)}</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full" style={{ width: `${Math.min(100, Math.max(0, progressToNext))}%` }}></div>
                </div>
             </div>
           )}
        </div>

        {/* Live / Active Section */}
        {activeBooking && (
          <div className="glass-card p-6 border-emerald-500/30 bg-emerald-900/10 glow-emerald animate-pulse relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 -mr-4 -mt-4 opacity-10"><Gamepad2 size={120} /></div>
            <h3 className="text-base font-bold text-emerald-400 mb-4 flex items-center gap-2"><Activity size={16} /> LIVE SESSION PLAYING</h3>
            <div className="flex justify-between items-end">
               <div>
                 <p className="text-2xl font-black text-white">{activeBooking.station?.name}</p>
                 <p className="text-sm text-slate-400 mt-1">Started at {formatDateTime(activeBooking.startTime)}</p>
               </div>
               <div className="text-right">
                 <p className="text-xs text-slate-500 uppercase tracking-widest">Running Time</p>
                 <p className="text-xl font-mono text-emerald-400 font-bold">In Progress</p>
               </div>
            </div>
          </div>
        )}

        {/* Grid Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Recent Bookings */}
           <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-sm font-bold text-white flex gap-2 items-center"><Clock size={16} className="text-blue-400"/> Recent Sessions</h3>
              </div>
              <div className="space-y-4">
                 {pastBookings.length === 0 && <p className="text-sm text-slate-500">No recent sessions.</p>}
                 {pastBookings.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                       <div>
                         <p className="font-bold text-white text-sm">{b.station?.name}</p>
                         <p className="text-[10px] text-slate-500">{formatDateTime(b.startTime)}</p>
                       </div>
                       <div className="text-right">
                         <p className="text-xs font-mono text-emerald-400 font-bold">{formatCurrency(b.totalAmount || 0)}</p>
                         <p className="text-[10px] text-slate-500">{formatDuration(b.duration || 0)}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Rewards Teaser / Loyalty logs */}
           <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-sm font-bold text-white flex gap-2 items-center"><Ticket size={16} className="text-purple-400"/> Recent Rewards & Points</h3>
              </div>
              <div className="space-y-4">
                 {profile.loyaltyTransactions?.slice(0, 5).map(lt => (
                    <div key={lt.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                       <div className="flex gap-3 items-center">
                          <div className={`p-2 rounded-lg ${lt.points > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {lt.points > 0 ? <Star size={14}/> : <Ticket size={14}/>}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{lt.type}</p>
                            <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{lt.notes}</p>
                          </div>
                       </div>
                       <div className={`font-mono text-xs font-bold ${lt.points > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {lt.points > 0 ? '+' : ''}{lt.points}
                       </div>
                    </div>
                 ))}
                 {(profile.loyaltyTransactions?.length || 0) === 0 && <p className="text-sm text-slate-500">No points history yet. Play games to earn points!</p>}
              </div>
              <button className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-bold shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] transition flex items-center justify-center gap-2">
                Browse Rewards Store <ChevronRight size={14}/>
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}
