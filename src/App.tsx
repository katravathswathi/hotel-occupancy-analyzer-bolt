import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { BookingWithRelations, Hotel, RoomType, Guest, BookingStatus, BookingChannel } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import DashboardView from '@/views/DashboardView';
import BookingsView from '@/views/BookingsView';
import RoomsView from '@/views/RoomsView';
import AnalyticsView from '@/views/AnalyticsView';
import { LayoutDashboard, CalendarCheck, BedDouble, BarChart3, Hotel as HotelIcon } from 'lucide-react';

export type ViewKey = 'dashboard' | 'bookings' | 'rooms' | 'analytics';

export default function App() {
  const [activeView, setActiveView] = useState<ViewKey>('dashboard');
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookingsRes, hotelsRes, roomTypesRes, guestsRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('*, hotel:hotels(*), room_type:room_types(*), guest:guests(*)')
          .order('created_at', { ascending: false }),
        supabase.from('hotels').select('*').order('name'),
        supabase.from('room_types').select('*').order('name'),
        supabase.from('guests').select('*').order('first_name'),
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      if (hotelsRes.error) throw hotelsRes.error;
      if (roomTypesRes.error) throw roomTypesRes.error;
      if (guestsRes.error) throw guestsRes.error;

      setBookings(bookingsRes.data as unknown as BookingWithRelations[]);
      setHotels(hotelsRes.data as Hotel[]);
      setRoomTypes(roomTypesRes.data as RoomType[]);
      setGuests(guestsRes.data as Guest[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateBookingStatus = useCallback(async (bookingId: string, status: BookingStatus) => {
    const updates: Record<string, unknown> = { status };
    if (status === 'cancelled') {
      updates.cancelled_at = new Date().toISOString();
    } else {
      updates.cancelled_at = null;
      updates.cancellation_reason = null;
    }

    const { error: updateError } = await supabase.from('bookings').update(updates).eq('id', bookingId);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await fetchData();
  }, [fetchData]);

  const handleCreateBooking = useCallback(async (data: {
    hotel_id: string;
    room_type_id: string;
    guest_id: string;
    check_in_date: string;
    check_out_date: string;
    guests_count: number;
    booking_channel: BookingChannel;
  }) => {
    const hotel = hotels.find(h => h.id === data.hotel_id);
    const roomType = roomTypes.find(rt => rt.id === data.room_type_id);
    if (!hotel || !roomType) return;

    const checkIn = new Date(data.check_in_date);
    const checkOut = new Date(data.check_out_date);
    const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
    const rate = roomType.base_price;
    const total = rate * nights;

    const { error: insertError } = await supabase.from('bookings').insert({
      hotel_id: data.hotel_id,
      room_type_id: data.room_type_id,
      guest_id: data.guest_id,
      check_in_date: data.check_in_date,
      check_out_date: data.check_out_date,
      nights,
      guests_count: data.guests_count,
      room_rate: rate,
      total_amount: total,
      status: 'confirmed',
      booking_channel: data.booking_channel,
    });

    if (insertError) {
      setError(insertError.message);
      return false;
    }
    await fetchData();
    return true;
  }, [hotels, roomTypes, fetchData]);

  const navItems = [
    { key: 'dashboard' as ViewKey, label: 'Dashboard', icon: LayoutDashboard },
    { key: 'bookings' as ViewKey, label: 'Bookings', icon: CalendarCheck },
    { key: 'rooms' as ViewKey, label: 'Rooms', icon: BedDouble },
    { key: 'analytics' as ViewKey, label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar navItems={navItems} activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 overflow-auto">
        <div className="px-6 py-8 lg:px-10 lg:py-10 max-w-[1600px] mx-auto">
          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-800 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 font-semibold">Dismiss</button>
            </div>
          )}
          {loading && bookings.length === 0 ? (
            <div className="flex items-center justify-center h-[60vh]">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin" />
                <p className="text-slate-500 text-sm font-medium">Loading hotel data…</p>
              </div>
            </div>
          ) : (
            <>
              {activeView === 'dashboard' && <DashboardView bookings={bookings} hotels={hotels} roomTypes={roomTypes} loading={loading} />}
              {activeView === 'bookings' && (
                <BookingsView
                  bookings={bookings}
                  hotels={hotels}
                  roomTypes={roomTypes}
                  guests={guests}
                  onUpdateStatus={handleUpdateBookingStatus}
                  onCreateBooking={handleCreateBooking}
                />
              )}
              {activeView === 'rooms' && <RoomsView hotels={hotels} roomTypes={roomTypes} bookings={bookings} />}
              {activeView === 'analytics' && <AnalyticsView bookings={bookings} hotels={hotels} roomTypes={roomTypes} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
