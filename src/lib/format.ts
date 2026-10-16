export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyDetailed(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short' });
}

export function statusColors(status: string): { bg: string; text: string; border: string; dot: string } {
  switch (status) {
    case 'confirmed':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' };
    case 'checked_in':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
    case 'checked_out':
      return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' };
    case 'cancelled':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' };
  }
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'confirmed': return 'Confirmed';
    case 'checked_in': return 'Checked In';
    case 'checked_out': return 'Checked Out';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
}

export function channelLabel(channel: string): string {
  switch (channel) {
    case 'booking.com': return 'Booking.com';
    case 'expedia': return 'Expedia';
    case 'airbnb': return 'Airbnb';
    case 'direct': return 'Direct';
    default: return channel;
  }
}
