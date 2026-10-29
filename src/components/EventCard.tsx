import { Link } from '@/lib/router';
import { CalendarDays, MapPin, Users, IndianRupee, ArrowRight } from 'lucide-react';
import type { EventRow } from '@/lib/supabase';
import { formatDate, formatPrice, categoryColors, seatsColor } from '@/lib/format';

export default function EventCard({ event }: { event: EventRow }) {
  const cat = categoryColors[event.category] ?? categoryColors.Tech;
  const soldOut = event.available_seats <= 0;
  const seatPct = Math.round(((event.total_capacity - event.available_seats) / event.total_capacity) * 100);

  return (
    <Link
      to={`/events/${event.id}`}
      className="group card overflow-hidden hover:shadow-xl hover:shadow-slate-900/10 hover:-translate-y-1 transition-all duration-300 flex flex-col"
    >
      <div className="relative h-44 overflow-hidden bg-slate-100">
        {event.banner_image ? (
          <img
            src={event.banner_image}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className={`w-full h-full ${cat.bg} flex items-center justify-center`}>
            <CalendarDays className={`w-12 h-12 ${cat.text} opacity-60`} />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`${cat.bg} ${cat.text} px-2.5 py-1 rounded-md text-xs font-bold backdrop-blur-sm`}>
            {event.category}
          </span>
        </div>
        {soldOut && (
          <div className="absolute top-3 right-3 bg-rose-600 text-white px-2.5 py-1 rounded-md text-xs font-bold">
            Sold Out
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-base text-slate-900 leading-snug mb-2 line-clamp-2 group-hover:text-slate-700">
          {event.title}
        </h3>
        <div className="space-y-1.5 mb-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            <span>{formatDate(event.event_date)}</span>
            <span className="text-slate-300">·</span>
            <span>{event.event_time}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">{event.description}</p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <IndianRupee className={`w-3.5 h-3.5 ${event.price === 0 ? 'text-emerald-600' : 'text-slate-700'}`} />
            <span className={`text-sm font-bold ${event.price === 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
              {formatPrice(Number(event.price))}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Users className={`w-3.5 h-3.5 ${seatsColor(event.available_seats, event.total_capacity)}`} />
            <span className={`font-semibold ${seatsColor(event.available_seats, event.total_capacity)}`}>
              {event.available_seats}
            </span>
            <span className="text-slate-400">/ {event.total_capacity} seats</span>
          </div>
        </div>

        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full rounded-full transition-all ${seatPct >= 80 ? 'bg-rose-500' : seatPct >= 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${seatPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm font-semibold text-slate-900 group-hover:text-slate-700">
          <span>View Details</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
