import { Link } from '@/lib/router';
import { CalendarHeart, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-3xl bg-slate-900 flex items-center justify-center mb-6">
        <CalendarHeart className="w-10 h-10 text-emerald-400" />
      </div>
      <h1 className="text-5xl font-extrabold text-slate-900 mb-2">404</h1>
      <p className="text-slate-500 mb-6 max-w-sm">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link to="/" className="btn-primary">
        <Home className="w-4 h-4" /> Back to Home
      </Link>
    </div>
  );
}

export function NotFoundAlt() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <ArrowLeft className="w-10 h-10 text-slate-300 mb-4" />
      <p className="text-slate-500">Nothing to show here.</p>
    </div>
  );
}
