/*
# Create events and bookings tables for Event Management System

1. New Tables
- `events`
  - id (uuid, primary key)
  - title (text, not null)
  - description (text, not null)
  - event_date (date, not null)
  - event_time (text, not null)
  - location (text, not null)
  - category (text, not null) - Tech, Cultural, Workshop, Sports
  - total_capacity (int, not null)
  - available_seats (int, not null)
  - price (numeric, not null, default 0)
  - banner_image (text) - URL
  - created_by (text) - email of creator (admin)
  - created_at (timestamptz)
- `bookings`
  - id (uuid, primary key)
  - event_id (uuid, fk to events, on delete cascade)
  - user_email (text, not null)
  - user_name (text, not null)
  - user_role (text, not null) - admin or attendee
  - booking_code (text, unique, not null) - generated ticket code
  - status (text, not null default 'active') - active or cancelled
  - booked_at (timestamptz)

2. Security
- Enable RLS on both tables.
- Grant CRUD to anon + authenticated (single-tenant shared data; auth is simulated client-side via mock JWT in localStorage).
- Allow full CRUD for anon + authenticated since the app simulates JWT auth on the frontend.
- Add index on bookings.event_id and bookings.user_email for fast lookups.

3. Notes
- The Event Management System simulates JWT authentication in the browser with localStorage mock tokens. Supabase stores the shared event/booking data. The demo includes Admin and Attendee roles determined by the client-side mock token.
- Atomic seat decrement is handled via an RPC function `book_seat` to prevent overbooking.
*/

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  event_date date NOT NULL,
  event_time text NOT NULL,
  location text NOT NULL,
  category text NOT NULL CHECK (category IN ('Tech', 'Cultural', 'Workshop', 'Sports')),
  total_capacity int NOT NULL CHECK (total_capacity > 0),
  available_seats int NOT NULL DEFAULT 0,
  price numeric(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  banner_image text,
  created_by text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  user_name text NOT NULL,
  user_role text NOT NULL,
  booking_code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  booked_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_email ON bookings(user_email);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON events TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON bookings TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_events" ON events;
CREATE POLICY "anon_select_events" ON events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_events" ON events;
CREATE POLICY "anon_insert_events" ON events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_events" ON events;
CREATE POLICY "anon_update_events" ON events FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_events" ON events;
CREATE POLICY "anon_delete_events" ON events FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_bookings" ON bookings;
CREATE POLICY "anon_select_bookings" ON bookings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_bookings" ON bookings;
CREATE POLICY "anon_update_bookings" ON bookings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_bookings" ON bookings;
CREATE POLICY "anon_delete_bookings" ON bookings FOR DELETE
  TO anon, authenticated USING (true);

-- RPC function to atomically book a seat and prevent overbooking
CREATE OR REPLACE FUNCTION book_seat(
  p_event_id uuid,
  p_user_email text,
  p_user_name text,
  p_user_role text,
  p_booking_code text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available int;
  v_event_title text;
  v_event_date date;
  v_event_time text;
  v_existing int;
BEGIN
  SELECT available_seats, title, event_date, event_time
    INTO v_available, v_event_title, v_event_date, v_event_time
    FROM events WHERE id = p_event_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event not found');
  END IF;

  -- Prevent duplicate active booking by same user for same event
  SELECT count(*) INTO v_existing FROM bookings
    WHERE event_id = p_event_id AND user_email = p_user_email AND status = 'active';

  IF v_existing > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already booked this event');
  END IF;

  IF v_available <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sorry, this event is sold out');
  END IF;

  UPDATE events SET available_seats = available_seats - 1 WHERE id = p_event_id;

  INSERT INTO bookings (event_id, user_email, user_name, user_role, booking_code, status)
    VALUES (p_event_id, p_user_email, p_user_name, p_user_role, p_booking_code, 'active');

  RETURN jsonb_build_object(
    'success', true,
    'booking_code', p_booking_code,
    'event_title', v_event_title,
    'event_date', v_event_date,
    'event_time', v_event_time
  );
END;
$$;

-- RPC to cancel a booking and restore a seat atomically
CREATE OR REPLACE FUNCTION cancel_booking(
  p_booking_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id uuid;
  v_status text;
BEGIN
  SELECT event_id, status INTO v_event_id, v_status FROM bookings WHERE id = p_booking_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking not found');
  END IF;

  IF v_status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking already cancelled');
  END IF;

  UPDATE bookings SET status = 'cancelled' WHERE id = p_booking_id;
  UPDATE events SET available_seats = available_seats + 1 WHERE id = v_event_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION book_seat(uuid, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION book_seat(uuid, text, text, text, text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION cancel_booking(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION cancel_booking(uuid) TO anon, authenticated;
