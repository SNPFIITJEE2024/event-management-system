import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from '@/lib/router';
import {
  CalendarDays, MapPin, Users, IndianRupee, Clock, Tag, ArrowLeft, Loader2,
  Ticket as TicketIcon, CheckCircle2, AlertCircle, ShieldCheck
} from 'lucide-react';
import { supabase, type EventRow } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatDate, formatPrice, categoryColors, seatsColor } from '@/lib/format';
import { generateBookingCode } from '@/lib/qr';
import TicketPass from '@/components/TicketPass';

type BookingResult = {
  success: boolean;
  booking_code?: string;
  event_title?: string;
  error?: string;
};

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [confirmed, setConfirmed] = useState<{ code: string } | null>(null);
  const [existingBooking, setExistingBooking] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
      if (cancelled) return;
      if (data) setEvent(data as EventRow);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Check for existing active booking by this user
  useEffect(() => {
    if (!id || !user) { setExistingBooking(null); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('bookings')
        .select('booking_code')
        .eq('event_id', id)
        .eq('user_email', user.email)
        .eq('status', 'active')
        .maybeSingle();
      if (cancelled) return;
      setExistingBooking(data?.booking_code ?? null);
    })();
    return () => { cancelled = true; };
  }, [id, user]);

  const handleBook = async () => {
    if (!user) {
      toast('Please sign in to book a ticket', 'warning');
      navigate('/login');
      return;
    }
    if (!event) return;
    if (event.available_seats <= 0) {
      toast('This event is sold out', 'error');
      return;
    }
    setBooking(true);
    const bookingCode = generateBookingCode();
    const { data, error } = await supabase.rpc('book_seat', {
      p_event_id: event.id,
      p_user_email: user.email,
      p_user_name: user.name,
      p_user_role: user.role,
      p_booking_code: bookingCode,
    });
    setBooking(false);
    if (error) {
      toast(error.message || 'Booking failed', 'error');
      return;
    }
    const result = data as BookingResult;
    if (!result?.success) {
      toast(result?.error || 'Booking failed', 'error');
      return;
    }
    toast(`Ticket booked! Code: ${result.booking_code}`, 'success');
    setConfirmed({ code: result.booking_code! });
    setExistingBooking(result.booking_code!);
    // refresh event seats
    const { data: fresh } = await supabase.from('events').select('*').eq('id', event.id).maybeSingle();
    if (fresh) setEvent(fresh as EventRow);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p className="text-sm">Loading event...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-1">Event not found</h2>
        <p className="text-sm text-slate-500 mb-6">This event may have been removed.</p>
        <Link to="/" className="btn-primary"><ArrowLeft className="w-4 h-4" /> Back to Events</Link>
      </div>
    );
  }

  const cat = categoryColors[event.category] ?? categoryColors.Tech;
  const soldOut = event.available_seats <= 0;
  const seatPct = Math.round(((event.total_capacity - event.available_seats) / event.total_capacity) * 100);
  const isPast = new Date(event.event_date + 'T23:59:59') < new Date();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-medium mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to all events
      </Link>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left: details */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl overflow-hidden bg-slate-100 h-64 sm:h-80 mb-6">
            {event.banner_image ? (
              <img src={event.banner_image} alt={event.title} className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <div className={`w-full h-full ${cat.bg} flex items-center justify-center`}>
                <CalendarDays className={`w-16 h-16 ${cat.text} opacity-50`} />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`${cat.bg} ${cat.text} px-3 py-1.5 rounded-lg text-xs font-bold`}>
              {event.category}
            </span>
            {isPast && (
              <span className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg text-xs font-bold">
                Past Event
              </span>
            )}
            {soldOut && !isPast && (
              <span className="bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                Sold Out
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">{event.title}</h1>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <DetailRow icon={CalendarDays} label="Date" value={formatDate(event.event_date)} />
            <DetailRow icon={Clock} label="Time" value={event.event_time} />
            <DetailRow icon={MapPin} label="Venue" value={event.location} />
            <DetailRow icon={Tag} label="Category" value={event.category} />
          </div>

          <div className="card p-5 mb-6">
            <h3 className="font-bold text-slate-900 mb-2">About this event</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{event.description}</p>
          </div>
        </div>

        {/* Right: booking panel */}
        <div className="lg:col-span-2">
          <div className="sticky top-20 space-y-5">
            <div className="card p-6">
              <div className="flex items-baseline gap-1 mb-1">
                <IndianRupee className={`w-5 h-5 ${event.price === 0 ? 'text-emerald-600' : 'text-slate-900'}`} />
                <span className="text-3xl font-extrabold text-slate-900">{formatPrice(Number(event.price))}</span>
              </div>
              <p className="text-xs text-slate-400 mb-5">per attendee</p>

              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-1.5"><Users className="w-4 h-4" /> Available seats</span>
                  <span className={`font-bold ${seatsColor(event.available_seats, event.total_capacity)}`}>
                    {event.available_seats} / {event.total_capacity}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${seatPct >= 80 ? 'bg-rose-500' : seatPct >= 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${seatPct}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">{seatPct}% booked</p>
              </div>

              {confirmed ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                    <CheckCircle2 className="w-5 h-5" /> Booking confirmed!
                  </div>
                </div>
              ) : existingBooking ? (
                <div className="space-y-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-emerald-700">You've already booked this event</p>
                    <p className="text-[10px] font-mono text-emerald-600 mt-1">{existingBooking}</p>
                  </div>
                  <Link to="/dashboard" className="btn-secondary w-full text-sm">
                    <TicketIcon className="w-4 h-4" /> View My Bookings
                  </Link>
                </div>
              ) : isPast ? (
                <button disabled className="btn-secondary w-full opacity-60">
                  Event has ended
                </button>
              ) : soldOut ? (
                <button disabled className="btn-secondary w-full opacity-60">
                  Sold Out
                </button>
              ) : (
                <button
                  onClick={handleBook}
                  disabled={booking || !user}
                  className="btn-primary w-full"
                >
                  {booking ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  ) : user ? (
                    <><TicketIcon className="w-4 h-4" /> Book Now</>
                  ) : (
                    <>Sign in to book</>
                  )}
                </button>
              )}

              {!user && !confirmed && !existingBooking && (
                <p className="text-xs text-slate-400 mt-3 text-center">
                  <Link to="/login" className="text-slate-700 font-semibold underline">Sign in</Link> or use a demo account from the navbar.
                </p>
              )}

              {user && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Booking as <b className="text-slate-600">{user.name}</b></span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmed ticket */}
      {confirmed && user && event && (
        <div className="mt-8 animate-fade-in">
          <h2 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
            <TicketIcon className="w-5 h-5 text-emerald-600" /> Your Ticket Pass
          </h2>
          <TicketPass event={event} user={user} bookingCode={confirmed.code} />
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-sm font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
