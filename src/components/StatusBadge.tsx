import { statusColors, statusLabel } from '@/lib/format';

type Props = {
  status: string;
  size?: 'sm' | 'md';
};

export default function StatusBadge({ status, size = 'sm' }: Props) {
  const colors = statusColors(status);
  const padding = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  return (
    <span className={`inline-flex items-center gap-1.5 ${padding} font-semibold rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {statusLabel(status)}
    </span>
  );
}
