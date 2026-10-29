import { useEffect, useState, useMemo } from 'react';
import { Link } from '@/lib/router';
import {
  LayoutDashboard, CalendarHeart, Users, IndianRupee, Pencil, Trash2,
  UserCircle, Loader2, Plus, TrendingUp, Ticket as TicketIcon, Search, AlertCircle, Mail
} from 'lucide-react';
import { supabase, type EventRow, type BookingRow } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { formatDate, formatPrice, categoryColors, seatsColor } from '@/lib/format';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';

type Attendee = BookingRow & { events: EventRow | null };

export default function AdminDashboard() {
  const { toast } = useToast();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<EventRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [attendeeEvent, setAttendeeEvent] = useState<EventRow | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  const load = async () => {
    setLoading(true);
    const [evRes, bkRes] = await Promise.all([
      supabase.from('events').select('*').order('created_at', { ascending: false }),
      supabase.from('bookings').select('*').order('booked_at', { ascending: false }),
    ]);
    setEvents((evRes.data ?? []) as EventRow[]);
    setBookings((bkRes.data ?? []) as BookingRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const metrics = useMemo(() => {
    const active = bookings.filter((b) => b.status === 'active');
    const revenue = active.reduce((sum, b) => {
      const ev = events.find((e) => e.id === b.event_id);
      return sum + (ev ? Number(ev.price) : 0);
    }, 0);
    return {
      totalEvents: events.length,
      totalAttendees: active.length,
      revenue,
    };
  }, [events, bookings]);

  const filteredAttendees = useMemo(() => {
    if (!attendeeSearch.trim()) return attendees;
    const q = attendeeSearch.toLowerCase();
    return attendees.filter(
      (a) => a.user_name.toLowerCase().includes(q) || a.user_email.toLowerCase().includes(q) || a.booking_code.toLowerCase().includes(q)
    );
  }, [attendees, attendeeSearch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('events').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast(error.message || 'Failed to delete event', 'error');
      return;
    }
    toast('Event deleted successfully', 'success');
    setDeleteTarget(null);
    load();
  };

  const openAttendees = async (event: EventRow) => {
    setAttendeeEvent(event);
    setLoadingAttendees(true);
    const { data } = await supabase
      .from('bookings')
      .select('*, events(*)')
      .eq('event_id', event.id)
      .order('booked_at', { ascending: false });
    setAttendees((data ?? []) as Attendee[]);
    setLoadingAttendees(false);
  };

  const attendeeCountFor = (eventId: string) =>
    bookings.filter((b) => b.event_id === eventId && b.status === 'active').length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p className="text-sm">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500">Manage events, attendees and revenue</p>
        </div>
        <Link to="/events/new" className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Create Event
        </Link>
      </div>

      {/* Metrics banner */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <MetricCard icon={CalendarHeart} label="Total Events" value={String(metrics.totalEvents)} color="sky" />
        <MetricCard icon={Users} label="Registered Attendees" value={String(metrics.totalAttendees)} color="emerald" />
        <MetricCard icon={IndianRupee} label="Gross Revenue" value={formatPrice(metrics.revenue)} color="amber" />
      </div>

      {/* Events table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Event Management</h2>
          <span className="text-xs text-slate-400 font-medium">{events.length} total</span>
        </div>

        {events.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <CalendarHeart className="w-7 h-7 text-slate-300" />
            </div>
            <p className="font-semibold text-slate-700 mb-1">No events yet</p>
            <p className="text-sm text-slate-400 mb-4">Create your first event to get started.</p>
            <Link to="/events/new" className="btn-primary text-sm mx-auto">
              <Plus className="w-4 h-4" /> Create Event
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left font-semibold px-6 py-3">Event</th>
                    <th className="text-left font-semibold px-4 py-3">Category</th>
                    <th className="text-left font-semibold px-4 py-3">Date</th>
                    <th className="text-center font-semibold px-4 py-3">Seats</th>
                    <th className="text-right font-semibold px-4 py-3">Price</th>
                    <th className="text-center font-semibold px-4 py-3">Attendees</th>
                    <th className="text-right font-semibold px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {events.map((e) => {
                    const cat = categoryColors[e.category];
                    return (
                      <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-3">
                          <Link to={`/events/${e.id}`} className="font-semibold text-slate-900 hover:text-slate-700">
                            {e.title}
                          </Link>
                          <p className="text-xs text-slate-400 truncate max-w-[200px]">{e.location}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`${cat.bg} ${cat.text} px-2 py-0.5 rounded-md text-xs font-bold`}>{e.category}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(e.event_date)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-semibold ${seatsColor(e.available_seats, e.total_capacity)}`}>
                            {e.available_seats}
                          </span>
                          <span className="text-slate-400">/{e.total_capacity}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                          {formatPrice(Number(e.price))}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                            <TicketIcon className="w-3.5 h-3.5" />
                            {attendeeCountFor(e.id)}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openAttendees(e)}
                              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                              title="View attendees"
                            >
                              <UserCircle className="w-4 h-4" />
                            </button>
                            <Link
                              to={`/events/${e.id}/edit`}
                              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                              title="Edit event"
                            >
                              <Pencil className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => setDeleteTarget(e)}
                              className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                              title="Delete event"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {events.map((e) => {
                const cat = categoryColors[e.category];
                return (
                  <div key={e.id} className="p-4">
                    <Link to={`/events/${e.id}`} className="font-bold text-slate-900 block mb-1">{e.title}</Link>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`${cat.bg} ${cat.text} px-2 py-0.5 rounded-md text-xs font-bold`}>{e.category}</span>
                      <span className="text-xs text-slate-400">{formatDate(e.event_date)}</span>
                      <span className="text-xs font-semibold text-slate-700">{formatPrice(Number(e.price))}</span>
                      <span className="text-xs text-slate-400">· {attendeeCountFor(e.id)} attendees</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openAttendees(e)} className="btn-secondary text-xs flex-1">
                        <UserCircle className="w-3.5 h-3.5" /> Attendees
                      </button>
                      <Link to={`/events/${e.id}/edit`} className="btn-secondary text-xs flex-1">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Link>
                      <button onClick={() => setDeleteTarget(e)} className="btn-danger text-xs">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Delete confirm */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This will also cancel all ${deleteTarget ? attendeeCountFor(deleteTarget.id) : 0} bookings for this event. This action cannot be undone.`}
        confirmLabel="Delete Event"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Attendees modal */}
      <Modal
        open={Boolean(attendeeEvent)}
        onClose={() => { setAttendeeEvent(null); setAttendees([]); setAttendeeSearch(''); }}
        title={attendeeEvent ? `Attendees — ${attendeeEvent.title}` : 'Attendees'}
        size="lg"
      >
        <div className="p-6">
          {attendeeEvent && (
            <div className="flex flex-wrap gap-3 mb-4 text-xs">
              <div className="bg-slate-50 px-3 py-2 rounded-lg">
                <span className="text-slate-400">Date:</span>{' '}
                <span className="font-semibold text-slate-700">{formatDate(attendeeEvent.event_date)}</span>
              </div>
              <div className="bg-slate-50 px-3 py-2 rounded-lg">
                <span className="text-slate-400">Booked:</span>{' '}
                <span className="font-semibold text-slate-700">{attendeeCountFor(attendeeEvent.id)} / {attendeeEvent.total_capacity}</span>
              </div>
            </div>
          )}

          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or booking code..."
              value={attendeeSearch}
              onChange={(e) => setAttendeeSearch(e.target.value)}
              className="input pl-10"
            />
          </div>

          {loadingAttendees ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredAttendees.length === 0 ? (
            <div className="text-center py-10">
              {attendees.length === 0 ? (
                <>
                  <UserCircle className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No one has booked this event yet.</p>
                </>
              ) : (
                <p className="text-sm text-slate-400">No attendees match your search.</p>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
              {filteredAttendees.map((a) => (
                <div
                  key={a.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    a.status === 'cancelled' ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {a.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-slate-900 truncate">{a.user_name}</p>
                      {a.status === 'cancelled' && (
                        <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded font-bold">CANCELLED</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3" /> {a.user_email}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-mono font-bold text-slate-600">{a.booking_code}</p>
                    <p className="text-[10px] text-slate-400">{formatDate(a.booked_at.split('T')[0])}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: {
  icon: typeof CalendarHeart; label: string; value: string; color: 'sky' | 'emerald' | 'amber';
}) {
  const colors = {
    sky: 'bg-sky-50 text-sky-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${colors[color]} flex items-center justify-center shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
