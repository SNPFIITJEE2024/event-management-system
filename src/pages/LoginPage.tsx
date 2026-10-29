import { useState } from 'react';
import { useNavigate, Link } from '@/lib/router';
import {
  Shield, User, Mail, Lock, ArrowRight, AlertCircle, Loader2, CalendarHeart, Sparkles
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { UserRole } from '@/lib/auth';

type Errors = { email?: string; name?: string; password?: string; confirm?: string };

export default function LoginPage() {
  const { login, demoAdmin, demoAttendee } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<UserRole>('attendee');
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    if (mode === 'register') {
      if (!name.trim()) e.name = 'Name is required';
      else if (name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    }
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    if (mode === 'register') {
      if (!confirm) e.confirm = 'Please confirm your password';
      else if (confirm !== password) e.confirm = 'Passwords do not match';
    }
    return e;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast('Please fix the errors in the form', 'error');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const finalName = mode === 'register' ? name.trim() : email.split('@')[0];
      login(email.trim(), finalName, role);
      setSubmitting(false);
      toast(mode === 'login' ? 'Signed in successfully' : 'Account created & signed in', 'success');
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    }, 500);
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
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid lg:grid-cols-2 gap-8 items-stretch">
        {/* Left: brand panel */}
        <div className="hidden lg:flex flex-col justify-between rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-sky-500/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2.5 mb-10">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <CalendarHeart className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="font-extrabold text-xl tracking-tight">SparkEvent</span>
            </div>
            <h2 className="text-3xl font-extrabold leading-tight mb-3">
              {mode === 'login' ? 'Welcome back' : 'Join the event'}
            </h2>
            <p className="text-slate-300 text-sm max-w-xs leading-relaxed">
              Book tech summits, cultural fests, workshops and sports events. Manage tickets and get instant QR passes.
            </p>
          </div>
          <div className="relative space-y-3 mt-10">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Quick Demo Access</p>
            <button onClick={() => handleDemo('admin')} className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 transition-colors text-left group">
              <Shield className="w-5 h-5 text-emerald-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Admin Demo</p>
                <p className="text-xs text-slate-400">Create & manage events</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => handleDemo('attendee')} className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 transition-colors text-left group">
              <User className="w-5 h-5 text-sky-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Attendee Demo</p>
                <p className="text-xs text-slate-400">Book & manage tickets</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right: form */}
        <div className="card p-8 flex flex-col justify-center">
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
              <CalendarHeart className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">SparkEvent</span>
          </div>

          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6 w-fit">
            <button
              onClick={() => setMode('login')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Register
            </button>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            {mode === 'login' ? 'Enter your credentials to continue' : 'Join to book and manage event tickets'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className={`input pl-10 ${errors.name ? 'border-rose-300' : ''}`}
                  />
                </div>
                {errors.name && <p className="text-xs text-rose-600 mt-1 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.name}</p>}
              </div>
            )}

            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`input pl-10 ${errors.email ? 'border-rose-300' : ''}`}
                />
              </div>
              {errors.email && <p className="text-xs text-rose-600 mt-1 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.email}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={`input pl-10 ${errors.password ? 'border-rose-300' : ''}`}
                />
              </div>
              {errors.password && <p className="text-xs text-rose-600 mt-1 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.password}</p>}
            </div>

            {mode === 'register' && (
              <div>
                <label className="label">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    className={`input pl-10 ${errors.confirm ? 'border-rose-300' : ''}`}
                  />
                </div>
                {errors.confirm && <p className="text-xs text-rose-600 mt-1 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.confirm}</p>}
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="label">Account Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('attendee')}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      role === 'attendee' ? 'border-slate-900 bg-slate-50' : 'border-slate-200'
                    }`}
                  >
                    <User className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-semibold text-slate-700">Attendee</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      role === 'admin' ? 'border-slate-900 bg-slate-50' : 'border-slate-200'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-semibold text-slate-700">Admin</span>
                  </button>
                </div>
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Please wait...</>
              ) : (
                <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Mobile demo buttons */}
          <div className="lg:hidden mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Quick Demo Access
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleDemo('admin')} className="btn-secondary text-xs">
                <Shield className="w-3.5 h-3.5" /> Demo Admin
              </button>
              <button onClick={() => handleDemo('attendee')} className="btn-secondary text-xs">
                <User className="w-3.5 h-3.5" /> Demo Attendee
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center mt-5">
            <Link to="/" className="hover:text-slate-600">Back to browse events</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
