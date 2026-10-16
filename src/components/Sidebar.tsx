import { Hotel, X } from 'lucide-react';
import { useState } from 'react';

type NavItem = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type Props = {
  navItems: NavItem[];
  activeView: string;
  onViewChange: (view: any) => void;
};

export default function Sidebar({ navItems, activeView, onViewChange }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-lg"
        aria-label="Open menu"
      >
        <Hotel className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-slate-900/50 z-40" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen w-72 bg-slate-900 flex flex-col z-40
          transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg">
              <Hotel className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">StayMetrics</h1>
              <p className="text-slate-400 text-xs">Hotel Analytics</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Menu</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onViewChange(item.key);
                  setMobileOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-white border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'}
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : ''}`} />
                {item.label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />}
              </button>
            );
          })}
        </nav>

        {/* Footer card */}
        <div className="px-4 py-4 border-t border-slate-800">
          <div className="rounded-xl bg-slate-800/50 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">SM</span>
              </div>
              <div>
                <p className="text-white text-sm font-semibold">StayMetrics Pro</p>
                <p className="text-slate-500 text-xs">All features unlocked</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
