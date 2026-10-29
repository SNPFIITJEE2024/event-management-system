import { Ticket, CalendarDays, MapPin, Clock, User, Mail } from 'lucide-react';
import type { EventRow } from '@/lib/supabase';
import type { AuthUser } from '@/lib/auth';
import { generateQrSvg } from '@/lib/qr';
import { formatDate, formatPrice, categoryColors } from '@/lib/format';

type Props = {
  event: EventRow;
  user: AuthUser;
  bookingCode: string;
};

export default function TicketPass({ event, user, bookingCode }: Props) {
  const cat = categoryColors[event.category] ?? categoryColors.Tech;
  const qrSvg = generateQrSvg(bookingCode);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Ticket - ${event.title}</title>
      <style>
        body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; background: #f8fafc; }
        .ticket { max-width: 480px; margin: 0 auto; border: 2px dashed #cbd5e1; border-radius: 20px; overflow: hidden; }
        .head { background: #0f172a; color: white; padding: 20px; }
        .body { display: flex; padding: 20px; gap: 20px; }
        .info { flex: 1; }
        .qr { width: 130px; height: 130px; }
        .row { margin-bottom: 8px; font-size: 13px; color: #475569; }
        .row b { color: #0f172a; }
      </style></head><body>
      <div class="ticket">
        <div class="head"><b>EVENT TICKET</b><br/>${event.title}</div>
        <div class="body">
          <div class="info">
            <div class="row">Booking Code: <b>${bookingCode}</b></div>
            <div class="row">Attendee: <b>${user.name}</b></div>
            <div class="row">Email: <b>${user.email}</b></div>
            <div class="row">Date: <b>${formatDate(event.event_date)}</b></div>
            <div class="row">Time: <b>${event.event_time}</b></div>
            <div class="row">Venue: <b>${event.location}</b></div>
            <div class="row">Price: <b>${formatPrice(Number(event.price))}</b></div>
          </div>
          <div class="qr">${qrSvg}</div>
        </div>
      </div>
      <script>window.print();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="relative bg-white rounded-2xl border-2 border-dashed border-slate-300 overflow-hidden">
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-emerald-400" />
          <span className="font-bold tracking-wide">EVENT TICKET PASS</span>
        </div>
        <span className={`${cat.bg} ${cat.text} px-2.5 py-1 rounded-md text-xs font-bold`}>
          {event.category}
        </span>
      </div>

      <div className="p-6 flex flex-col sm:flex-row gap-6">
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">{event.title}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <InfoRow icon={CalendarDays} label="Date" value={formatDate(event.event_date)} />
            <InfoRow icon={Clock} label="Time" value={event.event_time} />
            <InfoRow icon={MapPin} label="Venue" value={event.location} />
            <InfoRow icon={User} label="Attendee" value={user.name} />
            <InfoRow icon={Mail} label="Email" value={user.email} />
            <InfoRow icon={Ticket} label="Price" value={formatPrice(Number(event.price))} />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 sm:border-l sm:border-slate-200 sm:pl-6">
          <div
            className="text-slate-900"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <p className="text-[10px] font-mono font-bold text-slate-600 tracking-wider">{bookingCode}</p>
          <p className="text-[10px] text-slate-400 text-center">Scan at entry</p>
        </div>
      </div>

      <div className="px-6 pb-6">
        <button onClick={handlePrint} className="btn-secondary w-full">
          <Ticket className="w-4 h-4" /> Print / Save Ticket
        </button>
      </div>

      {/* perforation effect */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-50 rounded-full border-2 border-slate-300" />
      <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-50 rounded-full border-2 border-slate-300" />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-400 font-medium flex items-center gap-1">
        <Icon className="w-3 h-3" /> {label}
      </p>
      <p className="font-semibold text-slate-800 text-sm">{value}</p>
    </div>
  );
}
