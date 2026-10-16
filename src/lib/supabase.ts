import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Hotel = {
  id: string;
  name: string;
  location: string;
  star_rating: number;
  total_rooms: number;
  created_at: string;
};

export type RoomType = {
  id: string;
  hotel_id: string;
  name: string;
  base_price: number;
  capacity: number;
  amenities: string[];
  total_count: number;
  created_at: string;
};

export type Guest = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  created_at: string;
};

export type BookingStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
export type BookingChannel = 'direct' | 'booking.com' | 'expedia' | 'airbnb';

export type Booking = {
  id: string;
  hotel_id: string;
  room_type_id: string;
  guest_id: string;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  guests_count: number;
  room_rate: number;
  total_amount: number;
  status: BookingStatus;
  booking_channel: BookingChannel;
  created_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  hotel?: Hotel;
  room_type?: RoomType;
  guest?: Guest;
};

export type BookingWithRelations = Booking & {
  hotel: Hotel;
  room_type: RoomType;
  guest: Guest;
};
