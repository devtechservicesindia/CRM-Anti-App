import { useEffect, useState } from 'react';
import { Plus, Star, Gamepad2, Trash2 } from 'lucide-react';
import Topbar from '@/components/layout/Topbar';
import api from '@/lib/api';
import { Game } from '@/types';
import { useAuthStore } from '@/store/auth.store';

const platformColor = (p: string) => {
  if (p.includes('VR')) return 'bg-cyan-500/10 text-cyan-400';
  if (p.includes('Console')) return 'bg-blue-500/10 text-blue-400';
  if (p.includes('PC')) return 'bg-purple-500/10 text-purple-400';
  return 'bg-slate-500/10 text-slate-400';
};

const genreEmoji: Record<string, string> = {
  FPS: '🎯', Sports: '⚽', Racing: '🏎️', Action: '💥', Rhythm: '🎵',
  Sandbox: '🧱', 'Battle Royale': '🔫', 'Action-Adventure': '⚔️',
};

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [form, setForm] = useState({ name: '', genre: '', platform: 'PC', description: '', rating: '' });

  const fetchGames = async () => {
    setLoading(true);
    const { data } = await api.get('/games');
    setGames(data);
    setLoading(false);
  };

  useEffect(() => { fetchGames(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/games', { ...form, rating: parseFloat(form.rating) });
    setShowAdd(false);
    setForm({ name: '', genre: '', platform: 'PC', description: '', rating: '' });
    fetchGames();
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/games/${id}`);
    fetchGames();
  };

  return (
    <div>
      <Topbar title="Game Library" subtitle={`${games.length} games available`} />
      <div className="p-6 space-y-6">

        {isAdmin && (
          <div className="flex justify-end">
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-purple-500 hover:to-blue-500 glow-purple transition"
            >
              <Plus size={16} /> Add Game
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {games.map((g) => (
              <div key={g.id} className="glass-card p-5 hover:scale-[1.02] transition-all group">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/30 to-blue-600/30 border border-purple-500/20 flex items-center justify-center text-2xl mb-4">
                  {genreEmoji[g.genre] || '🎮'}
                </div>

                <h3 className="text-base font-bold text-white mb-1">{g.name}</h3>
                <p className="text-xs text-slate-500 mb-3">{g.genre}</p>

                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${platformColor(g.platform)}`}>
                    {g.platform}
                  </span>
                  {g.rating && (
                    <div className="flex items-center gap-1">
                      <Star size={11} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs text-amber-400 font-bold">{g.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {g.description && (
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">{g.description}</p>
                )}

                {isAdmin && (
                  <button
                    onClick={() => handleDelete(g.id)}
                    className="mt-3 opacity-0 group-hover:opacity-100 w-full py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition flex items-center justify-center gap-1"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="glass-card p-6 w-full max-w-md animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Gamepad2 size={20} className="text-purple-400" /> Add Game
            </h2>
            <form onSubmit={handleAdd} className="space-y-4">
              {[
                { label: 'Game Name', key: 'name', placeholder: 'e.g. Cyberpunk 2077' },
                { label: 'Genre', key: 'genre', placeholder: 'e.g. RPG' },
                { label: 'Rating (0-5)', key: 'rating', placeholder: '4.5', type: 'number' },
                { label: 'Description', key: 'description', placeholder: 'Short description...' },
              ].map(({ label, key, placeholder, type = 'text' }) => (
                <div key={key}>
                  <label className="text-xs text-slate-400 uppercase tracking-wider">{label}</label>
                  <input type={type} value={(form as Record<string, string>)[key]} required={key !== 'description'}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder} step={type === 'number' ? '0.1' : undefined} min={type === 'number' ? '0' : undefined} max={type === 'number' ? '5' : undefined}
                    className="mt-1.5 w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm outline-none focus:border-purple-500/50 transition" />
                </div>
              ))}
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider">Platform</label>
                <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}
                  className="mt-1.5 w-full bg-[#1a1a2e] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-purple-500/50 transition">
                  {['PC', 'Console', 'VR', 'PC, Console', 'PC, Console, VR'].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl bg-white/[0.05] text-slate-400 hover:text-white transition text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-sm hover:from-purple-500 hover:to-blue-500 transition">Add Game</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
