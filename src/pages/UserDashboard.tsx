import { useEffect, useState, useMemo } from 'react';
import { Link } from '@/lib/router';
import {
  Ticket as TicketIcon, Loader2, CalendarDays, MapPin, Clock, XCircle,
  CheckCircle2, AlertCircle, IndianRupee, User, Shield
} from 'lucide-react';
import { supabase, type EventRow, type BookingWithEvent } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatDate, formatPrice, categoryColors } from '@/lib/format';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function UserDashboard() {
  const { user, isAttendee, isAdmin } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<BookingWithEvent | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [tab, setTab] = useState<'active' | 'past'>('active');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('bookings')
        .select('*, events(*)')
        .eq('user_email', user.email)
        .order('booked_at', { ascending: false });
      if (cancelled) return;
      setBookings((data ?? []) as BookingWithEvent[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const refreshEvent = async (eventId: string) => {
    // re-read the event to reflect restored seat count
    const { data } = await supabase.from('events').select('*').eq('id', eventId).maybeSingle();
    return data as EventRow | null;
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    const { data, error } = await supabase.rpc('cancel_booking', { p_booking_id: cancelTarget.id });
    setCancelling(false);
    if (error) {
      toast(error.message || 'Failed to cancel booking', 'error');
      return;
    }
    if (!(data as any)?.success) {
      toast((data as any)?.error || 'Failed to cancel booking', 'error');
      return;
    }
    toast('Ticket cancelled — seat capacity restored', 'success');
    // Update local state: mark cancelled, and bump event's available_seats
    setBookings((prev) =>
      prev.map((b) =>
        b.id === cancelTarget.id
          ? { ...b, status: 'cancelled' as const }
          : b
      )
    );
    // The event card seat count is server-driven; refresh the events table via the rpc (already done server-side).
    setCancelTarget(null);
  };

  const grouped = useMemo(() => {
    const now = new Date();
    const active: BookingWithEvent[] = [];
    const past: BookingWithEvent[] = [];
    for (const b of bookings) {
      if (!b.events) continue;
      const isPast = new Date(b.events.event_date + 'T23:59:59') < now;
      if (b.status === 'cancelled' || isPast) past.push(b);
      else active.push(b);
    }
    return { active, past };
  }, [bookings]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-1">Sign in required</h2>
        <p className="text-sm text-slate-500 mb-6">Use a demo login from the navbar to view your bookings.</p>
        <Link to="/login" className="btn-primary"><Shield className="w-4 h-4" /> Sign In</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p className="text-sm">Loading your bookings...</p>
      </div>
    );
  }

  const list = tab === 'active' ? grouped.active : grouped.past;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center">
          <TicketIcon className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Bookings</h1>
          <p className="text-sm text-slate-500">Welcome back, {user.name}</p>
        </div>
      </div>

      {isAttendee && (
        <div className="card p-4 mb-6 flex items-center gap-3 bg-sky-50 border-sky-100">
          <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Attendee Account</p>
            <p className="text-xs text-slate-500">Browse events and book tickets. Switch to the Admin demo to manage events.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setTab('active')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Active ({grouped.active.length})
        </button>
        <button
          onClick={() => setTab('past')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'past' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Past & Cancelled ({grouped.past.length})
        </button>
      </div>

      {list.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <TicketIcon className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="font-bold text-slate-900 mb-1">
            {tab === 'active' ? 'No active bookings' : 'No past bookings'}
          </h3>
          <p className="text-sm text-slate-500 mb-5">
            {tab === 'active' ? 'Browse events and book your first ticket.' : 'Your past and cancelled events will appear here.'}
          </p>
          {tab === 'active' && (
            <Link to="/" className="btn-primary text-sm mx-auto">
              <TicketIcon className="w-4 h-4" /> Browse Events
            </Link>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {list.map((b) => {
            if (!b.events) return null;
            const e = b.events;
            const cat = categoryColors[e.category] ?? categoryColors.Tech;
            const isCancelled = b.status === 'cancelled';
            const isPast = new Date(e.event_date + 'T23:59:59') < new Date();
            return (
              <div key={b.id} className={`card overflow-hidden ${isCancelled ? 'opacity-70' : ''}`}>
                <div className="flex">
                  <div className="w-24 sm:w-28 shrink-0 bg-slate-100 relative">
                    {e.banner_image ? (
                      <img src={e.banner_image} alt={e.title} className="w-full h-full object-cover"
                        onError={(ev) => { (ev.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className={`w-full h-full ${cat.bg} flex items-center justify-center`}>
                        <TicketIcon className={`w-7 h-7 ${cat.text} opacity-60`} />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Link to={`/events/${e.id}`} className="font-bold text-sm text-slate-900 hover:text-slate-700 line-clamp-1">
                        {e.title}
                      </Link>
                      <span className={`${cat.bg} ${cat.text} px-2 py-0.5 rounded text-[10px] font-bold shrink-0`}>
                        {e.category}
                      </span>
                    </div>
                    <div className="space-y-1 mb-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5"><CalendarDays className="w-3 h-3" /> {formatDate(e.event_date)} · {e.event_time}</div>
                      <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> <span className="truncate">{e.location}</span></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 font-mono font-bold">{b.booking_code}</p>
                        <p className="text-xs font-semibold text-slate-700">{formatPrice(Number(e.price))}</p>
                      </div>
                      {isCancelled ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                          <XCircle className="w-4 h-4" /> Cancelled
                        </span>
                      ) : isPast ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                          <Clock className="w-4 h-4" /> Completed
                        </span>
                      ) : (
                        <button
                          onClick={() => setCancelTarget(b)}
                          className="btn-secondary text-xs !py-1.5 text-rose-600 border-rose-200 hover:bg-rose-50"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel Ticket
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {!isCancelled && !isPast && (
                  <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-100 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed — show this pass at entry
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel Ticket"
        message={`Cancel your booking for "${cancelTarget?.events?.title}"? Your seat will be released back to the pool and cannot be undone.`}
        confirmLabel="Yes, Cancel Ticket"
        loading={cancelling}
        onConfirm={handleCancel}
        onClose={() => setCancelTarget(null)}
      />
    </div>
  );
}
