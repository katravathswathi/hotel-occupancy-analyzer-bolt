import { useState, useMemo } from 'react';
import type { BookingWithRelations, Hotel, RoomType, Guest, BookingStatus, BookingChannel } from '@/lib/supabase';
import { formatCurrencyDetailed, formatDate, channelLabel } from '@/lib/format';
import StatusBadge from '@/components/StatusBadge';
import { Search, Plus, X, Filter, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

type Props = {
  bookings: BookingWithRelations[];
  hotels: Hotel[];
  roomTypes: RoomType[];
  guests: Guest[];
  onUpdateStatus: (bookingId: string, status: BookingStatus) => void;
  onCreateBooking: (data: {
    hotel_id: string;
    room_type_id: string;
    guest_id: string;
    check_in_date: string;
    check_out_date: string;
    guests_count: number;
    booking_channel: BookingChannel;
  }) => Promise<boolean | void>;
};

const PAGE_SIZE = 12;

export default function BookingsView({ bookings, hotels, roomTypes, guests, onUpdateStatus, onCreateBooking }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [hotelFilter, setHotelFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  // Create form state
  const [form, setForm] = useState({
    hotel_id: '',
    room_type_id: '',
    guest_id: '',
    check_in_date: '',
    check_out_date: '',
    guests_count: 2,
    booking_channel: 'direct' as BookingChannel,
  });

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch =
        !search ||
        `${b.guest?.first_name} ${b.guest?.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        b.hotel?.name.toLowerCase().includes(search.toLowerCase()) ||
        b.room_type?.name.toLowerCase().includes(search.toLowerCase()) ||
        b.guest?.email?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      const matchesHotel = hotelFilter === 'all' || b.hotel_id === hotelFilter;

      return matchesSearch && matchesStatus && matchesHotel;
    });
  }, [bookings, search, statusFilter, hotelFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const filteredRoomTypes = useMemo(() => {
    return roomTypes.filter(rt => rt.hotel_id === form.hotel_id);
  }, [roomTypes, form.hotel_id]);

  const handleCreate = async () => {
    if (!form.hotel_id || !form.room_type_id || !form.guest_id || !form.check_in_date || !form.check_out_date) return;
    const success = await onCreateBooking(form);
    if (success) {
      setShowCreate(false);
      setForm({ hotel_id: '', room_type_id: '', guest_id: '', check_in_date: '', check_out_date: '', guests_count: 2, booking_channel: 'direct' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Bookings</h2>
          <p className="text-slate-500 text-sm mt-1">Manage all reservations across your properties</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Booking
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by guest, hotel, or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={hotelFilter}
            onChange={(e) => { setHotelFilter(e.target.value); setPage(0); }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400"
          >
            <option value="all">All Hotels</option>
            {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-700">{paginated.length}</span> of{' '}
          <span className="font-semibold text-slate-700">{filtered.length}</span> bookings
        </p>
        {(search || statusFilter !== 'all' || hotelFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('all'); setHotelFilter('all'); setPage(0); }}
            className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Guest</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Hotel / Room</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Check In</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Check Out</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Channel</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Amount</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map(b => (
                <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                        {b.guest?.first_name?.[0]}{b.guest?.last_name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{b.guest?.first_name} {b.guest?.last_name}</p>
                        <p className="text-xs text-slate-400 truncate">{b.guest?.country}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-700 truncate">{b.hotel?.name}</p>
                    <p className="text-xs text-slate-400">{b.room_type?.name} • {b.nights} nights</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatDate(b.check_in_date)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatDate(b.check_out_date)}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{channelLabel(b.booking_channel)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-slate-900">{formatCurrencyDetailed(Number(b.total_amount))}</span>
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={b.status} /></td>
                  <td className="px-6 py-4 relative">
                    <button
                      onClick={() => setActionMenu(actionMenu === b.id ? null : b.id)}
                      className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
                    >
                      <Filter className="w-4 h-4" />
                    </button>
                    {actionMenu === b.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} />
                        <div className="absolute right-6 top-full mt-1 z-20 w-44 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5">
                          {b.status !== 'checked_in' && (
                            <button onClick={() => { onUpdateStatus(b.id, 'checked_in'); setActionMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700">
                              Check In
                            </button>
                          )}
                          {b.status !== 'checked_out' && b.status !== 'cancelled' && (
                            <button onClick={() => { onUpdateStatus(b.id, 'checked_out'); setActionMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                              Check Out
                            </button>
                          )}
                          {b.status !== 'cancelled' && b.status !== 'checked_out' && (
                            <button onClick={() => { onUpdateStatus(b.id, 'cancelled'); setActionMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50">
                              Cancel Booking
                            </button>
                          )}
                          {b.status === 'cancelled' && (
                            <button onClick={() => { onUpdateStatus(b.id, 'confirmed'); setActionMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50">
                              Reinstate
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <p className="text-slate-400 text-sm">No bookings match your filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">Page {page + 1} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Booking Modal */}
      {showCreate && (
        <>
          <div className="fixed inset-0 bg-slate-900/50 z-40" onClick={() => setShowCreate(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg">
            <div className="bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">New Booking</h3>
                  <p className="text-sm text-slate-400">Create a new reservation</p>
                </div>
                <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Hotel</label>
                  <select
                    value={form.hotel_id}
                    onChange={(e) => setForm({ ...form, hotel_id: e.target.value, room_type_id: '' })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400"
                  >
                    <option value="">Select a hotel…</option>
                    {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Room Type</label>
                  <select
                    value={form.room_type_id}
                    onChange={(e) => setForm({ ...form, room_type_id: e.target.value })}
                    disabled={!form.hotel_id}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400 disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">Select a room type…</option>
                    {filteredRoomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name} — ${rt.base_price}/night</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Guest</label>
                  <select
                    value={form.guest_id}
                    onChange={(e) => setForm({ ...form, guest_id: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400"
                  >
                    <option value="">Select a guest…</option>
                    {guests.map(g => <option key={g.id} value={g.id}>{g.first_name} {g.last_name} — {g.country}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Check In</label>
                    <input
                      type="date"
                      value={form.check_in_date}
                      onChange={(e) => setForm({ ...form, check_in_date: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Check Out</label>
                    <input
                      type="date"
                      value={form.check_out_date}
                      min={form.check_in_date}
                      onChange={(e) => setForm({ ...form, check_out_date: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Guests</label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={form.guests_count}
                      onChange={(e) => setForm({ ...form, guests_count: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Channel</label>
                    <select
                      value={form.booking_channel}
                      onChange={(e) => setForm({ ...form, booking_channel: e.target.value as BookingChannel })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400"
                    >
                      <option value="direct">Direct</option>
                      <option value="booking.com">Booking.com</option>
                      <option value="expedia">Expedia</option>
                      <option value="airbnb">Airbnb</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100">
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!form.hotel_id || !form.room_type_id || !form.guest_id || !form.check_in_date || !form.check_out_date}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Calendar className="w-4 h-4" />
                  Create Booking
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
