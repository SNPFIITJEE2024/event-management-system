import { CalendarHeart, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <CalendarHeart className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900">SparkEvent</p>
              <p className="text-[10px] text-slate-400">Event Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Built with</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span>for SparkIIT</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
