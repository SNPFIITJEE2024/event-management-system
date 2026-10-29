import { CalendarDays, MapPin, Ticket, Clock, Tag, Users, IndianRupee } from 'lucide-react';
import type { EventRow } from '@/lib/supabase';

export function formatDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatPrice(p: number): string {
  if (p === 0) return 'Free';
  return `₹${p.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export const categoryColors: Record<string, { bg: string; text: string; dot: string }> = {
  Tech: { bg: 'bg-sky-100', text: 'text-sky-700', dot: 'bg-sky-500' },
  Cultural: { bg: 'bg-rose-100', text: 'text-rose-700', dot: 'bg-rose-500' },
  Workshop: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  Sports: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

export function categoryIcon(cat: string) {
  // returns nothing special; kept for potential future use
  return cat;
}

export function seatsColor(available: number, total: number): string {
  const ratio = available / total;
  if (ratio <= 0.2) return 'text-rose-600';
  if (ratio <= 0.5) return 'text-amber-600';
  return 'text-emerald-600';
}

export { CalendarDays, MapPin, Ticket, Clock, Tag, Users, IndianRupee };
