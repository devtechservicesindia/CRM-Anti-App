import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, Gamepad2, Lock, Mail, User, Phone, Shield, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

const DEMO_CREDENTIALS = [
  { label: 'Admin', role: 'ADMIN', email: 'admin@gameparlour.com', password: 'admin123', color: 'red' },
  { label: 'Staff', role: 'STAFF', email: 'staff@gameparlour.com', password: 'staff123', color: 'blue' },
  { label: 'Customer', role: 'CUSTOMER', email: 'arjun@example.com', password: 'customer123', color: 'emerald' },
] as const;

const roleColors = {
  ADMIN: 'from-red-500 to-rose-600',
  STAFF: 'from-blue-500 to-indigo-600',
  CUSTOMER: 'from-emerald-500 to-teal-600',
} as const;

export default function LoginPage() {
  const { isAuthenticated, setAuth } = useAuthStore();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, name: form.name, phone: form.phone };

      const { data } = await api.post(endpoint, payload);
      setAuth(data.user, data.accessToken);
      navigate('/');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email: string, password: string) => {
    setForm({ ...form, email, password });
    setError('');
  };

  const inputClass = (field: string) =>
    `w-full bg-white/[0.04] border rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm outline-none transition-all duration-300 ${
      focusedField === field
        ? 'border-purple-500/70 bg-purple-500/[0.06] shadow-[0_0_20px_rgba(124,58,237,0.15)]'
        : 'border-white/[0.08] hover:border-white/[0.15]'
    }`;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/8 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-600/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(124,58,237,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-in">
        {/* Logo header */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center mb-5">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl blur-xl opacity-50" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.4)]">
              <Zap size={28} className="text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-display font-black text-white tracking-widest">
            GAME<span className="text-gradient">ZONE</span>
          </h1>
          <p className="text-slate-500 text-xs mt-2 tracking-[0.3em] uppercase">CRM · Esports Management Platform</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {/* Tab switcher */}
          <div className="flex rounded-xl bg-black/30 border border-white/[0.06] p-1 mb-7">
            {[{ label: 'Sign In', value: true }, { label: 'Create Account', value: false }].map(({ label, value }) => (
              <button
                key={label}
                onClick={() => { setIsLogin(value); setError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  isLogin === value
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name — register only */}
            {!isLogin && (
              <div>
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-[0.15em] flex items-center gap-1.5 mb-2">
                  <User size={10} /> Full Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Arjun Sharma"
                  className={inputClass('name')}
                />
              </div>
            )}

            <div>
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-[0.15em] flex items-center gap-1.5 mb-2">
                <Mail size={10} /> Email Address
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="you@example.com"
                className={inputClass('email')}
                autoComplete="email"
              />
            </div>

            {/* Phone — register only */}
            {!isLogin && (
              <div>
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-[0.15em] flex items-center gap-1.5 mb-2">
                  <Phone size={10} /> Phone <span className="text-slate-600">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="+91 9876543210"
                  className={inputClass('phone')}
                />
              </div>
            )}

            <div>
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-[0.15em] flex items-center gap-1.5 mb-2">
                <Lock size={10} /> Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className={`${inputClass('password')} pr-12`}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-purple-400 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm animate-slide-in">
                <AlertCircle size={15} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold
                         hover:from-purple-500 hover:to-blue-500 transition-all duration-300 mt-2
                         shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]
                         disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm tracking-wide"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <Gamepad2 size={16} />
                  {isLogin ? 'Enter the Arena' : 'Join the Crew'}
                </>
              )}
            </button>
          </form>

          {/* Demo credentials — login mode only */}
          {isLogin && (
            <div className="mt-6 pt-6 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={12} className="text-slate-600" />
                <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-[0.2em]">Demo Credentials</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_CREDENTIALS.map(({ label, role, email, password, color }) => (
                  <button
                    key={label}
                    onClick={() => fillDemo(email, password)}
                    className={`flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl border transition-all duration-200
                      ${form.email === email 
                        ? `bg-${color}-500/15 border-${color}-500/40 shadow-[0_0_10px_rgba(var(--${color}),0.1)]` 
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.12]'
                      }`}
                  >
                    <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${roleColors[role]} flex items-center justify-center text-[8px] font-bold text-white`}>
                      {label[0]}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">{label}</span>
                  </button>
                ))}
              </div>
              {form.email && (
                <p className="text-[10px] text-slate-600 mt-2 text-center">
                  Click &quot;Enter the Arena&quot; to sign in as <span className="text-purple-400">
                    {DEMO_CREDENTIALS.find(d => d.email === form.email)?.role ?? 'user'}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-slate-700 mt-6 tracking-wider">
          GAMEZONE CRM • PREMIUM ESPORTS MANAGEMENT
        </p>
      </div>
    </div>
  );
}
