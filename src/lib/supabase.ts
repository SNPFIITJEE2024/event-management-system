import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export type EventRow = {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  category: 'Tech' | 'Cultural' | 'Workshop' | 'Sports';
  total_capacity: number;
  available_seats: number;
  price: number;
  banner_image: string | null;
  created_by: string | null;
  created_at: string;
};

export type BookingRow = {
  id: string;
  event_id: string;
  user_email: string;
  user_name: string;
  user_role: string;
  booking_code: string;
  status: 'active' | 'cancelled';
  booked_at: string;
};

export type BookingWithEvent = BookingRow & {
  events: EventRow | null;
};

export const CATEGORIES = ['Tech', 'Cultural', 'Workshop', 'Sports'] as const;
export type Category = (typeof CATEGORIES)[number];
