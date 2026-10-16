/*
# Hotel Occupancy & Cancellation Database Schema

## Overview
Creates a single-tenant (no auth) schema for a hotel management dashboard
focused on tracking room occupancy and booking cancellations.

## New Tables

### hotels
- `id` (uuid, primary key)
- `name` (text) - hotel name
- `location` (text) - city/location
- `star_rating` (int) - 1-5 star rating
- `total_rooms` (int) - total room count
- `created_at` (timestamptz)

### room_types
- `id` (uuid, primary key)
- `hotel_id` (uuid, FK → hotels)
- `name` (text) - e.g. "Standard", "Deluxe", "Suite"
- `base_price` (numeric) - nightly rate
- `capacity` (int) - max guests
- `amenities` (text[]) - list of amenities
- `total_count` (int) - how many rooms of this type

### guests
- `id` (uuid, primary key)
- `first_name` (text)
- `last_name` (text)
- `email` (text, unique)
- `phone` (text)
- `country` (text)
- `created_at` (timestamptz)

### bookings
- `id` (uuid, primary key)
- `hotel_id` (uuid, FK → hotels)
- `room_type_id` (uuid, FK → room_types)
- `guest_id` (uuid, FK → guests)
- `check_in_date` (date)
- `check_out_date` (date)
- `nights` (int) - computed stay length
- `guests_count` (int) - number of guests
- `room_rate` (numeric) - nightly rate at booking
- `total_amount` (numeric) - nights * rate
- `status` (text) - 'confirmed', 'checked_in', 'checked_out', 'cancelled'
- `booking_channel` (text) - 'direct', 'booking.com', 'expedia', 'airbnb'
- `created_at` (timestamptz)
- `cancelled_at` (timestamptz, nullable)
- `cancellation_reason` (text, nullable)

## Security
- RLS enabled on all tables.
- All policies use `TO anon, authenticated` with `USING (true)` since this is a
  single-tenant dashboard app with no sign-in screen — data is intentionally shared.
*/

-- Hotels
CREATE TABLE IF NOT EXISTS hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  star_rating int NOT NULL DEFAULT 3 CHECK (star_rating BETWEEN 1 AND 5),
  total_rooms int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_hotels" ON hotels;
CREATE POLICY "anon_select_hotels" ON hotels FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_hotels" ON hotels;
CREATE POLICY "anon_insert_hotels" ON hotels FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_hotels" ON hotels;
CREATE POLICY "anon_update_hotels" ON hotels FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_hotels" ON hotels;
CREATE POLICY "anon_delete_hotels" ON hotels FOR DELETE TO anon, authenticated USING (true);

-- Room types
CREATE TABLE IF NOT EXISTS room_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name text NOT NULL,
  base_price numeric(10,2) NOT NULL DEFAULT 0,
  capacity int NOT NULL DEFAULT 2,
  amenities text[] DEFAULT '{}',
  total_count int NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_room_types" ON room_types;
CREATE POLICY "anon_select_room_types" ON room_types FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_room_types" ON room_types;
CREATE POLICY "anon_insert_room_types" ON room_types FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_room_types" ON room_types;
CREATE POLICY "anon_update_room_types" ON room_types FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_room_types" ON room_types;
CREATE POLICY "anon_delete_room_types" ON room_types FOR DELETE TO anon, authenticated USING (true);

-- Guests
CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE,
  phone text,
  country text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_guests" ON guests;
CREATE POLICY "anon_select_guests" ON guests FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_guests" ON guests;
CREATE POLICY "anon_insert_guests" ON guests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_guests" ON guests;
CREATE POLICY "anon_update_guests" ON guests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_guests" ON guests;
CREATE POLICY "anon_delete_guests" ON guests FOR DELETE TO anon, authenticated USING (true);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_type_id uuid NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  nights int NOT NULL DEFAULT 1,
  guests_count int NOT NULL DEFAULT 1,
  room_rate numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','checked_in','checked_out','cancelled')),
  booking_channel text NOT NULL DEFAULT 'direct' CHECK (booking_channel IN ('direct','booking.com','expedia','airbnb')),
  created_at timestamptz DEFAULT now(),
  cancelled_at timestamptz,
  cancellation_reason text
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_bookings" ON bookings;
CREATE POLICY "anon_select_bookings" ON bookings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_bookings" ON bookings;
CREATE POLICY "anon_update_bookings" ON bookings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_bookings" ON bookings;
CREATE POLICY "anon_delete_bookings" ON bookings FOR DELETE TO anon, authenticated USING (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_hotel_id ON bookings(hotel_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in ON bookings(check_in_date);
CREATE INDEX IF NOT EXISTS idx_bookings_room_type ON bookings(room_type_id);
CREATE INDEX IF NOT EXISTS idx_room_types_hotel ON room_types(hotel_id);
