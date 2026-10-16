import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function Card({ title, subtitle, action, children, className = '' }: Props) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-slate-900 font-bold text-base">{title}</h3>
          {subtitle && <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
