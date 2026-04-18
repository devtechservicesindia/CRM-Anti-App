import Topbar from '@/components/layout/Topbar';
import { Settings, Bell, Shield, Database, Palette } from 'lucide-react';

const SettingSection = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
  <div className="glass-card p-6">
    <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
      <Icon size={16} className="text-purple-400" /> {title}
    </h2>
    {children}
  </div>
);

const Toggle = ({ label, desc, defaultOn = false }: { label: string; desc: string; defaultOn?: boolean }) => (
  <div className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
    <div>
      <p className="text-sm text-white font-medium">{label}</p>
      <p className="text-xs text-slate-500">{desc}</p>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" defaultChecked={defaultOn} className="sr-only peer" />
      <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
    </label>
  </div>
);

export default function SettingsPage() {
  return (
    <div>
      <Topbar title="Settings" subtitle="System configuration" />
      <div className="p-6 max-w-2xl space-y-6">

        <SettingSection icon={Bell} title="Notifications">
          <Toggle label="Session Alerts" desc="Notify when a session exceeds 2 hours" defaultOn />
          <Toggle label="Payment Confirmations" desc="Email receipt after payment" defaultOn />
          <Toggle label="Daily Summary" desc="Daily revenue report email" />
        </SettingSection>

        <SettingSection icon={Shield} title="Security">
          <Toggle label="Two-Factor Auth" desc="Require 2FA for admin accounts" />
          <Toggle label="Session Timeout" desc="Auto-logout after 30 minutes of inactivity" defaultOn />
          <Toggle label="Login Alerts" desc="Email on new login from unknown device" defaultOn />
        </SettingSection>

        <SettingSection icon={Database} title="Data & Backup">
          <Toggle label="Auto Backup" desc="Daily database backup at midnight" defaultOn />
          <Toggle label="Data Analytics" desc="Share anonymized usage data to improve the app" />
          <div className="pt-3">
            <button className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-300 hover:border-purple-500/30 hover:text-white transition">
              Export All Data (CSV)
            </button>
          </div>
        </SettingSection>

        <SettingSection icon={Palette} title="Appearance">
          <div className="space-y-3">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Theme</p>
            <div className="flex gap-3">
              {['Dark (Default)', 'OLED Black', 'Cyberpunk'].map((t, i) => (
                <button key={t} className={`px-4 py-2 rounded-xl text-sm transition ${i === 0 ? 'bg-purple-600 text-white' : 'bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-white'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </SettingSection>

        <div className="glass-card p-6">
          <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <Settings size={16} className="text-purple-400" /> About
          </h2>
          <div className="space-y-2 mt-3">
            {[['App Version', '1.0.0'], ['Backend', 'Node.js + Express'], ['Database', 'PostgreSQL + Prisma'], ['Frontend', 'React + Vite + TypeScript']].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-slate-500">{k}</span>
                <span className="text-slate-300 font-mono">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
