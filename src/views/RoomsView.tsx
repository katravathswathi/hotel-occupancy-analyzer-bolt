import { useState, useMemo } from 'react';
import type { Hotel, RoomType, BookingWithRelations } from '@/lib/supabase';
import { formatCurrency, formatNumber } from '@/lib/format';
import Card from '@/components/Card';
import { Star, Users, Wifi, Wind, Coffee, Bath, Mountain, Waves, Flame, Dumbbell } from 'lucide-react';

type Props = {
  hotels: Hotel[];
  roomTypes: RoomType[];
  bookings: BookingWithRelations[];
};

function amenityIcon(amenity: string) {
  const a = amenity.toLowerCase();
  if (a.includes('wifi')) return Wifi;
  if (a.includes('ac') || a.includes('air')) return Wind;
  if (a.includes('minibar') || a.includes('kitchenette')) return Coffee;
  if (a.includes('jacuzzi') || a.includes('hot tub') || a.includes('bath')) return Bath;
  if (a.includes('mountain')) return Mountain;
  if (a.includes('ocean') || a.includes('bay') || a.includes('sea')) return Waves;
  if (a.includes('fireplace') || a.includes('fire')) return Flame;
  if (a.includes('gym') || a.includes('fitness')) return Dumbbell;
  return Users;
}

export default function RoomsView({ hotels, roomTypes, bookings }: Props) {
  const [selectedHotel, setSelectedHotel] = useState<string>(hotels[0]?.id ?? '');

  const hotelRoomTypes = useMemo(() => {
    return roomTypes.filter(rt => rt.hotel_id === selectedHotel);
  }, [roomTypes, selectedHotel]);

  const selectedHotelData = hotels.find(h => h.id === selectedHotel);

  const roomStats = useMemo(() => {
    return hotelRoomTypes.map(rt => {
      const rtBookings = bookings.filter(b => b.room_type_id === rt.id);
      const activeCount = rtBookings.filter(b => b.status === 'checked_in' || b.status === 'confirmed').length;
      const cancelledCount = rtBookings.filter(b => b.status === 'cancelled').length;
      const revenue = rtBookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + Number(b.total_amount), 0);
      const occupancy = rt.total_count > 0 ? Math.min((activeCount / rt.total_count) * 100, 100) : 0;
      return {
        roomType: rt,
        totalBookings: rtBookings.length,
        activeCount,
        cancelledCount,
        revenue,
        occupancy,
      };
    });
  }, [hotelRoomTypes, bookings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Rooms</h2>
          <p className="text-slate-500 text-sm mt-1">Room types, availability, and performance by hotel</p>
        </div>
        <select
          value={selectedHotel}
          onChange={(e) => setSelectedHotel(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400"
        >
          {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </div>

      {/* Hotel summary card */}
      {selectedHotelData && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 lg:p-8 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold">{selectedHotelData.name}</h3>
                <div className="flex gap-0.5">
                  {Array.from({ length: selectedHotelData.star_rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              <p className="text-slate-400 text-sm">{selectedHotelData.location}</p>
            </div>
            <div className="flex gap-8">
              <div>
                <p className="text-slate-400 text-xs font-medium">Total Rooms</p>
                <p className="text-2xl font-bold">{selectedHotelData.total_rooms}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Room Types</p>
                <p className="text-2xl font-bold">{hotelRoomTypes.length}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Revenue</p>
                <p className="text-2xl font-bold text-cyan-400">
                  {formatCurrency(roomStats.reduce((sum, r) => sum + r.revenue, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Room type cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {roomStats.map(({ roomType: rt, totalBookings, activeCount, cancelledCount, revenue, occupancy }) => (
          <div key={rt.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:shadow-slate-200/50 transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-bold text-slate-900">{rt.name}</h4>
                <p className="text-sm text-slate-400">{formatCurrency(rt.base_price)} / night</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                occupancy > 75 ? 'bg-emerald-50 text-emerald-600' :
                occupancy > 40 ? 'bg-blue-50 text-blue-600' :
                'bg-amber-50 text-amber-600'
              }`}>
                {occupancy.toFixed(0)}% occupied
              </span>
            </div>

            {/* Occupancy bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span>{activeCount} active of {rt.total_count} rooms</span>
                <span>{rt.total_count - activeCount} available</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${occupancy}%`,
                    background: occupancy > 75 ? 'linear-gradient(90deg, #10b981, #059669)' : occupancy > 40 ? 'linear-gradient(90deg, #0891b2, #2563eb)' : 'linear-gradient(90deg, #f59e0b, #d97706)',
                  }}
                />
              </div>
            </div>

            {/* Details */}
            <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
              <span className="inline-flex items-center gap-1.5"><Users className="w-4 h-4" /> {rt.capacity} guests</span>
              <span>{rt.total_count} rooms</span>
            </div>

            {/* Amenities */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {rt.amenities.map((a, i) => {
                const Icon = amenityIcon(a);
                return (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 text-slate-600 text-xs font-medium">
                    <Icon className="w-3 h-3" />
                    {a}
                  </span>
                );
              })}
            </div>

            {/* Footer stats */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-400">Bookings</p>
                <p className="text-sm font-bold text-slate-900">{formatNumber(totalBookings)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Cancelled</p>
                <p className="text-sm font-bold text-rose-600">{cancelledCount}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Revenue</p>
                <p className="text-sm font-bold text-emerald-600">{formatCurrency(revenue)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* All hotels overview */}
      <Card title="All Hotels Overview" subtitle="Room inventory across all properties">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Hotel</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Location</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Stars</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Rooms</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Room Types</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Active</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hotels.map(h => {
                const hRoomTypes = roomTypes.filter(rt => rt.hotel_id === h.id);
                const hRooms = hRoomTypes.reduce((sum, rt) => sum + rt.total_count, 0);
                const hActive = bookings.filter(b => b.hotel_id === h.id && (b.status === 'checked_in' || b.status === 'confirmed')).length;
                const hRevenue = bookings.filter(b => b.hotel_id === h.id && b.status !== 'cancelled').reduce((sum, b) => sum + Number(b.total_amount), 0);
                return (
                  <tr key={h.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{h.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{h.location}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-0.5 justify-center">
                        {Array.from({ length: h.star_rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-700">{hRooms}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">{hRoomTypes.length}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-cyan-600">{hActive}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-emerald-600">{formatCurrency(hRevenue)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
