import { Link, useNavigate, useLocation } from '@/lib/router';
import { useState } from 'react';
import { CalendarHeart, LogOut, LayoutDashboard, Plus, User, Shield, Menu, X, Ticket as TicketIcon, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function Navbar() {
  const { user, isAdmin, isAttendee, logout, demoAdmin, demoAttendee } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLink = (to: string, label: string, icon: typeof CalendarHeart) => {
    const Icon = icon;
    const active = location.pathname === to || location.pathname.startsWith(to + '/');
    return (
      <Link
        to={to}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
          active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <Icon className="w-4 h-4" />
        {label}
      </Link>
    );
  };

  const handleLogout = () => {
    logout();
    toast('Signed out successfully', 'info');
    navigate('/');
  };

  const handleDemo = (type: 'admin' | 'attendee') => {
    if (type === 'admin') {
      demoAdmin();
      toast('Logged in as Admin (demo)', 'success');
      navigate('/admin');
    } else {
      demoAttendee();
      toast('Logged in as Attendee (demo)', 'success');
      navigate('/dashboard');
    }
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
              <CalendarHeart className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="leading-none">
              <span className="font-extrabold text-lg tracking-tight text-slate-900">SparkEvent</span>
              <span className="block text-[10px] font-semibold text-slate-400 tracking-wider uppercase">Management System</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLink('/', 'Browse Events', CalendarHeart)}
            {user && navLink('/dashboard', 'My Bookings', TicketIcon)}
            {isAdmin && navLink('/admin', 'Admin', LayoutDashboard)}
            {isAdmin && navLink('/events/new', 'Create Event', Plus)}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {!user ? (
              <>
                <button onClick={() => handleDemo('attendee')} className="btn-secondary text-xs">
                  <User className="w-3.5 h-3.5" /> Demo Attendee
                </button>
                <button onClick={() => handleDemo('admin')} className="btn-primary text-xs">
                  <Shield className="w-3.5 h-3.5" /> Demo Admin
                </button>
                <Link to="/login" className="btn-ghost text-xs">Sign In</Link>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${isAdmin ? 'bg-slate-900' : 'bg-emerald-600'}`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="leading-tight">
                    <p className="text-xs font-semibold text-slate-800">{user.name}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="btn-ghost text-xs" aria-label="Logout">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-1 animate-fade-in">
            {navLink('/', 'Browse Events', CalendarHeart)}
            {user && navLink('/dashboard', 'My Bookings', TicketIcon)}
            {isAdmin && navLink('/admin', 'Admin Dashboard', LayoutDashboard)}
            {isAdmin && navLink('/events/new', 'Create Event', Plus)}
            <div className="h-px bg-slate-200 my-2" />
            {!user ? (
              <>
                <button onClick={() => handleDemo('attendee')} className="btn-secondary text-sm justify-start">
                  <User className="w-4 h-4" /> Demo Login: Attendee
                </button>
                <button onClick={() => handleDemo('admin')} className="btn-primary text-sm justify-start">
                  <Shield className="w-4 h-4" /> Demo Login: Admin
                </button>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-ghost text-sm justify-start">
                  <Sparkles className="w-4 h-4" /> Sign In / Register
                </Link>
              </>
            ) : (
              <button onClick={handleLogout} className="btn-danger text-sm justify-start">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
