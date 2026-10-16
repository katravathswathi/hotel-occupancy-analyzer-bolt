import { useMemo } from 'react';
import type { BookingWithRelations, Hotel, RoomType } from '@/lib/supabase';
import { formatCurrency, formatPercent, formatNumber, getMonthLabel } from '@/lib/format';
import StatCard from '@/components/StatCard';
import Card from '@/components/Card';
import BarChart from '@/components/BarChart';
import DonutChart from '@/components/DonutChart';
import LineChart from '@/components/LineChart';
import StatusBadge from '@/components/StatusBadge';
import { TrendingUp, TrendingDown, CalendarCheck, DollarSign, BedDouble, XCircle, Users } from 'lucide-react';

type Props = {
  bookings: BookingWithRelations[];
  hotels: Hotel[];
  roomTypes: RoomType[];
  loading: boolean;
};

export default function DashboardView({ bookings, hotels, roomTypes, loading }: Props) {
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'checked_in');
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
    const totalRevenue = bookings
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + Number(b.total_amount), 0);
    const revenueLost = cancelledBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);

    const currentlyInHouse = bookings.filter(b => {
      const checkIn = b.check_in_date;
      const checkOut = b.check_out_date;
      return b.status === 'checked_in' && checkIn <= todayStr && checkOut > todayStr;
    });

    const totalRooms = roomTypes.reduce((sum, rt) => sum + rt.total_count, 0);
    const occupancyRate = totalRooms > 0 ? (currentlyInHouse.length / totalRooms) * 100 : 0;
    const cancellationRate = bookings.length > 0 ? (cancelledBookings.length / bookings.length) * 100 : 0;
    const avgNightlyRate = bookings.length > 0
      ? bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + Number(b.room_rate), 0) / Math.max(bookings.filter(b => b.status !== 'cancelled').length, 1)
      : 0;

    return {
      totalBookings: bookings.length,
      activeBookings: activeBookings.length,
      totalRevenue,
      revenueLost,
      currentlyInHouse: currentlyInHouse.length,
      totalRooms,
      occupancyRate,
      cancellationRate,
      cancelledCount: cancelledBookings.length,
      avgNightlyRate,
      totalGuests: new Set(bookings.map(b => b.guest_id)).size,
    };
  }, [bookings, roomTypes]);

  const monthlyData = useMemo(() => {
    const months: { label: string; bookings: number; cancellations: number; revenue: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const monthBookings = bookings.filter(b => {
        const created = new Date(b.created_at);
        return created >= monthStart && created <= monthEnd;
      });
      months.push({
        label: getMonthLabel(d),
        bookings: monthBookings.length,
        cancellations: monthBookings.filter(b => b.status === 'cancelled').length,
        revenue: monthBookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + Number(b.total_amount), 0),
      });
    }
    return months;
  }, [bookings]);

  const statusBreakdown = useMemo(() => {
    const counts = { confirmed: 0, checked_in: 0, checked_out: 0, cancelled: 0 };
    bookings.forEach(b => { counts[b.status]++; });
    return [
      { label: 'Checked Out', value: counts.checked_out, color: '#94a3b8' },
      { label: 'Confirmed', value: counts.confirmed, color: '#3b82f6' },
      { label: 'Cancelled', value: counts.cancelled, color: '#f43f5e' },
      { label: 'Checked In', value: counts.checked_in, color: '#10b981' },
    ];
  }, [bookings]);

  const channelBreakdown = useMemo(() => {
    const channels: Record<string, number> = { direct: 0, 'booking.com': 0, expedia: 0, airbnb: 0 };
    bookings.forEach(b => { channels[b.booking_channel]++; });
    return [
      { label: 'Direct', value: channels.direct, color: '#0891b2' },
      { label: 'Booking.com', value: channels['booking.com'], color: '#2563eb' },
      { label: 'Expedia', value: channels.expedia, color: '#f59e0b' },
      { label: 'Airbnb', value: channels.airbnb, color: '#ec4899' },
    ];
  }, [bookings]);

  const recentBookings = useMemo(() => bookings.slice(0, 6), [bookings]);

  const hotelOccupancy = useMemo(() => {
    return hotels.map(h => {
      const hotelRoomTypes = roomTypes.filter(rt => rt.hotel_id === h.id);
      const hotelRooms = hotelRoomTypes.reduce((sum, rt) => sum + rt.total_count, 0);
      const activeCount = bookings.filter(b =>
        b.hotel_id === h.id && (b.status === 'checked_in' || b.status === 'confirmed')
      ).length;
      return {
        name: h.name,
        occupancy: hotelRooms > 0 ? Math.min((activeCount / hotelRooms) * 100, 100) : 0,
        rooms: hotelRooms,
      };
    });
  }, [hotels, roomTypes, bookings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h2>
          <p className="text-slate-500 text-sm mt-1">Real-time view of occupancy, revenue, and cancellations across all properties</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <CalendarCheck className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          trend={{ value: '+12.5%', positive: true }}
          subtitle={`${formatCurrency(stats.avgNightlyRate)} avg nightly rate`}
        />
        <StatCard
          label="Total Bookings"
          value={formatNumber(stats.totalBookings)}
          icon={CalendarCheck}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          trend={{ value: '+8.2%', positive: true }}
          subtitle={`${stats.activeBookings} active reservations`}
        />
        <StatCard
          label="Occupancy Rate"
          value={formatPercent(stats.occupancyRate)}
          icon={BedDouble}
          iconColor="text-cyan-600"
          iconBg="bg-cyan-50"
          trend={{ value: stats.occupancyRate > 50 ? 'Above target' : 'Below target', positive: stats.occupancyRate > 50 }}
          subtitle={`${stats.currentlyInHouse} rooms occupied of ${stats.totalRooms}`}
        />
        <StatCard
          label="Cancellation Rate"
          value={formatPercent(stats.cancellationRate)}
          icon={XCircle}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
          trend={{ value: stats.cancellationRate < 20 ? 'Healthy' : 'High', positive: stats.cancellationRate < 20 }}
          subtitle={`${formatCurrency(stats.revenueLost)} revenue lost`}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card title="Booking Trends" subtitle="Last 12 months" className="lg:col-span-2">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-400 font-medium mb-2">Monthly Bookings</p>
              <LineChart data={monthlyData.map(m => ({ label: m.label, value: m.bookings }))} />
            </div>
          </div>
        </Card>

        <Card title="Booking Status" subtitle="Distribution by status">
          <DonutChart
            data={statusBreakdown}
            centerValue={formatNumber(stats.totalBookings)}
            centerLabel="Total"
          />
        </Card>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card title="Booking Channels" subtitle="Reservations by source">
          <DonutChart data={channelBreakdown} centerValue={formatNumber(stats.totalBookings)} centerLabel="Bookings" />
        </Card>

        <Card title="Monthly Revenue" subtitle="Revenue per month (non-cancelled)" className="lg:col-span-2">
          <BarChart
            data={monthlyData.map(m => ({ label: m.label, value: m.revenue }))}
            height={200}
            formatValue={formatCurrency}
          />
        </Card>
      </div>

      {/* Hotel occupancy + recent bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Hotel Occupancy" subtitle="Active reservations vs. total rooms">
          <div className="space-y-4">
            {hotelOccupancy.map((h, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-700 truncate">{h.name}</span>
                  <span className="text-sm font-semibold text-slate-900">{h.occupancy.toFixed(0)}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${h.occupancy}%`,
                      background: h.occupancy > 75
                        ? 'linear-gradient(90deg, #10b981, #059669)'
                        : h.occupancy > 40
                        ? 'linear-gradient(90deg, #0891b2, #2563eb)'
                        : 'linear-gradient(90deg, #f59e0b, #d97706)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Recent Bookings" subtitle="Latest reservations across all hotels">
          <div className="space-y-3">
            {recentBookings.map(b => (
              <div key={b.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {b.guest?.first_name} {b.guest?.last_name}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {b.hotel?.name} • {b.room_type?.name}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-slate-700">{formatCurrency(Number(b.total_amount))}</span>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick stats footer */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Guests</p>
            <p className="text-lg font-bold text-slate-900">{formatNumber(stats.totalGuests)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Revenue / Booking</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(stats.totalRevenue / Math.max(stats.totalBookings - stats.cancelledCount, 1))}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Cancellations</p>
            <p className="text-lg font-bold text-slate-900">{stats.cancelledCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
            <BedDouble className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Rooms</p>
            <p className="text-lg font-bold text-slate-900">{formatNumber(stats.totalRooms)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
