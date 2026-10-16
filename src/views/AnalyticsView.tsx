import { useState, useMemo } from 'react';
import type { BookingWithRelations, Hotel, RoomType } from '@/lib/supabase';
import { formatCurrency, formatPercent, formatNumber, getMonthLabel } from '@/lib/format';
import Card from '@/components/Card';
import BarChart from '@/components/BarChart';
import DonutChart from '@/components/DonutChart';
import LineChart from '@/components/LineChart';
import { TrendingDown, AlertTriangle, Clock, Users } from 'lucide-react';

type Props = {
  bookings: BookingWithRelations[];
  hotels: Hotel[];
  roomTypes: RoomType[];
};

export default function AnalyticsView({ bookings, hotels, roomTypes }: Props) {
  const [timeRange, setTimeRange] = useState<'6m' | '12m' | 'all'>('12m');

  const filteredBookings = useMemo(() => {
    if (timeRange === 'all') return bookings;
    const months = timeRange === '6m' ? 6 : 12;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    return bookings.filter(b => new Date(b.created_at) >= cutoff);
  }, [bookings, timeRange]);

  const monthlyTrends = useMemo(() => {
    const months: { label: string; bookings: number; cancellations: number; revenue: number; cancelRate: number }[] = [];
    const now = new Date();
    const numMonths = timeRange === '6m' ? 6 : timeRange === '12m' ? 12 : 12;
    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const monthBookings = bookings.filter(b => {
        const created = new Date(b.created_at);
        return created >= monthStart && created <= monthEnd;
      });
      const cancelled = monthBookings.filter(b => b.status === 'cancelled').length;
      months.push({
        label: getMonthLabel(d),
        bookings: monthBookings.length,
        cancellations: cancelled,
        revenue: monthBookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + Number(b.total_amount), 0),
        cancelRate: monthBookings.length > 0 ? (cancelled / monthBookings.length) * 100 : 0,
      });
    }
    return months;
  }, [bookings, timeRange]);

  const cancellationReasons = useMemo(() => {
    const reasons: Record<string, number> = {};
    filteredBookings.filter(b => b.status === 'cancelled' && b.cancellation_reason).forEach(b => {
      const r = b.cancellation_reason!;
      reasons[r] = (reasons[r] || 0) + 1;
    });
    const colors = ['#f43f5e', '#fb923c', '#f59e0b', '#a78bfa', '#06b6d4'];
    return Object.entries(reasons).map(([label, value], i) => ({
      label,
      value,
      color: colors[i % colors.length],
    }));
  }, [filteredBookings]);

  const channelStats = useMemo(() => {
    const channels: Record<string, { count: number; revenue: number; cancelled: number }> = {
      direct: { count: 0, revenue: 0, cancelled: 0 },
      'booking.com': { count: 0, revenue: 0, cancelled: 0 },
      expedia: { count: 0, revenue: 0, cancelled: 0 },
      airbnb: { count: 0, revenue: 0, cancelled: 0 },
    };
    filteredBookings.forEach(b => {
      if (channels[b.booking_channel]) {
        channels[b.booking_channel].count++;
        if (b.status !== 'cancelled') channels[b.booking_channel].revenue += Number(b.total_amount);
        if (b.status === 'cancelled') channels[b.booking_channel].cancelled++;
      }
    });
    return Object.entries(channels).map(([channel, stats]) => ({
      channel,
      ...stats,
      cancelRate: stats.count > 0 ? (stats.cancelled / stats.count) * 100 : 0,
    }));
  }, [filteredBookings]);

  const hotelPerformance = useMemo(() => {
    return hotels.map(h => {
      const hBookings = filteredBookings.filter(b => b.hotel_id === h.id);
      const hCancelled = hBookings.filter(b => b.status === 'cancelled').length;
      const hRevenue = hBookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + Number(b.total_amount), 0);
      const hRooms = roomTypes.filter(rt => rt.hotel_id === h.id).reduce((sum, rt) => sum + rt.total_count, 0);
      const hActive = hBookings.filter(b => b.status === 'checked_in' || b.status === 'confirmed').length;
      return {
        name: h.name,
        bookings: hBookings.length,
        cancellations: hCancelled,
        cancelRate: hBookings.length > 0 ? (hCancelled / hBookings.length) * 100 : 0,
        revenue: hRevenue,
        occupancy: hRooms > 0 ? (hActive / hRooms) * 100 : 0,
      };
    });
  }, [hotels, filteredBookings, roomTypes]);

  const guestCountryStats = useMemo(() => {
    const countries: Record<string, number> = {};
    filteredBookings.forEach(b => {
      const c = b.guest?.country ?? 'Unknown';
      countries[c] = (countries[c] || 0) + 1;
    });
    return Object.entries(countries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([country, count]) => ({ label: country, value: count }));
  }, [filteredBookings]);

  const avgLeadTime = useMemo(() => {
    const leadTimes = filteredBookings.map(b => {
      const created = new Date(b.created_at);
      const checkIn = new Date(b.check_in_date);
      return Math.max(0, (checkIn.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    });
    return leadTimes.length > 0 ? leadTimes.reduce((sum, v) => sum + v, 0) / leadTimes.length : 0;
  }, [filteredBookings]);

  const avgStayLength = useMemo(() => {
    const valid = filteredBookings.filter(b => b.status !== 'cancelled');
    return valid.length > 0 ? valid.reduce((sum, b) => sum + b.nights, 0) / valid.length : 0;
  }, [filteredBookings]);

  const totalRevenue = filteredBookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + Number(b.total_amount), 0);
  const totalCancelled = filteredBookings.filter(b => b.status === 'cancelled').length;
  const overallCancelRate = filteredBookings.length > 0 ? (totalCancelled / filteredBookings.length) * 100 : 0;
  const revenueLost = filteredBookings.filter(b => b.status === 'cancelled').reduce((sum, b) => sum + Number(b.total_amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics</h2>
          <p className="text-slate-500 text-sm mt-1">Deep dive into occupancy patterns, cancellation trends, and performance</p>
        </div>
        <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1">
          {(['6m', '12m', 'all'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {range === '6m' ? '6 Months' : range === '12m' ? '12 Months' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-rose-500" />
            <span className="text-xs text-slate-400 font-medium">Cancellation Rate</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatPercent(overallCancelRate)}</p>
          <p className="text-xs text-slate-400 mt-1">{totalCancelled} of {filteredBookings.length} bookings</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-slate-400 font-medium">Revenue Lost</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(revenueLost)}</p>
          <p className="text-xs text-slate-400 mt-1">From cancellations</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-slate-400 font-medium">Avg Lead Time</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{avgLeadTime.toFixed(0)} days</p>
          <p className="text-xs text-slate-400 mt-1">Booking to check-in</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-cyan-500" />
            <span className="text-xs text-slate-400 font-medium">Avg Stay</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{avgStayLength.toFixed(1)} nights</p>
          <p className="text-xs text-slate-400 mt-1">Per reservation</p>
        </div>
      </div>

      {/* Cancellation trend + reasons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card title="Cancellation Rate Trend" subtitle="Monthly cancellation percentage" className="lg:col-span-2">
          <LineChart
            data={monthlyTrends.map(m => ({ label: m.label, value: m.cancelRate }))}
            color="#f43f5e"
            formatValue={(v) => `${v.toFixed(1)}%`}
          />
        </Card>
        <Card title="Cancellation Reasons" subtitle="Why guests cancel">
          {cancellationReasons.length > 0 ? (
            <DonutChart data={cancellationReasons} centerValue={formatNumber(totalCancelled)} centerLabel="Cancelled" />
          ) : (
            <p className="text-slate-400 text-sm text-center py-8">No cancellation data</p>
          )}
        </Card>
      </div>

      {/* Bookings vs cancellations */}
      <Card title="Bookings vs Cancellations" subtitle="Monthly comparison">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
                <span className="w-3 h-3 rounded bg-gradient-to-t from-blue-600 to-cyan-400" /> Bookings
              </span>
              <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
                <span className="w-3 h-3 rounded bg-rose-400" /> Cancellations
              </span>
            </div>
            <BarChart
              data={monthlyTrends.map(m => ({ label: m.label, value: m.bookings }))}
              height={180}
              formatValue={(v) => `${v} bookings`}
            />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">Cancellations per Month</p>
            <BarChart
              data={monthlyTrends.map(m => ({ label: m.label, value: m.cancellations, color: '#f43f5e' }))}
              height={140}
              formatValue={(v) => `${v} cancelled`}
            />
          </div>
        </div>
      </Card>

      {/* Channel performance */}
      <Card title="Channel Performance" subtitle="Bookings, revenue, and cancellation rate by booking source">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Channel</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Bookings</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Revenue</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Cancelled</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Cancel Rate</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 w-32">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {channelStats.map(c => {
                const share = filteredBookings.length > 0 ? (c.count / filteredBookings.length) * 100 : 0;
                return (
                  <tr key={c.channel} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900 capitalize">{c.channel === 'booking.com' ? 'Booking.com' : c.channel}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-700">{c.count}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-600">{formatCurrency(c.revenue)}</td>
                    <td className="px-4 py-3 text-right text-sm text-rose-600">{c.cancelled}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-semibold ${c.cancelRate > 20 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {formatPercent(c.cancelRate)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full" style={{ width: `${share}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 font-medium w-10 text-right">{share.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Hotel performance + Guest origins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Hotel Performance" subtitle="Bookings, revenue, and cancellations by property">
          <div className="space-y-4">
            {hotelPerformance.map((h, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{h.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500">{h.bookings} bookings</span>
                    <span className="text-xs text-slate-500">{formatCurrency(h.revenue)}</span>
                    <span className={`text-xs font-medium ${h.cancelRate > 20 ? 'text-rose-600' : 'text-slate-500'}`}>
                      {h.cancelRate.toFixed(0)}% cancel
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Occupancy</p>
                  <p className="text-sm font-bold text-slate-900">{h.occupancy.toFixed(0)}%</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Guest Origins" subtitle="Top countries by booking count">
          <BarChart
            data={guestCountryStats}
            height={220}
            formatValue={(v) => `${v} guests`}
          />
        </Card>
      </div>

      {/* Revenue trend */}
      <Card title="Revenue Trend" subtitle="Monthly revenue (non-cancelled bookings)">
        <LineChart
          data={monthlyTrends.map(m => ({ label: m.label, value: m.revenue }))}
          color="#10b981"
          formatValue={formatCurrency}
        />
      </Card>
    </div>
  );
}
