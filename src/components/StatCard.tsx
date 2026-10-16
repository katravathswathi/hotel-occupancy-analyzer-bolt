import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type Props = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  trend?: { value: string; positive: boolean };
  subtitle?: string;
};

export default function StatCard({ label, value, icon: Icon, iconColor, iconBg, trend, subtitle }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:shadow-slate-200/50 transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${trend.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
      {subtitle && <p className="text-slate-400 text-xs mt-1.5">{subtitle}</p>}
    </div>
  );
}
