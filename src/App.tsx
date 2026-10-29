import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import NotFound from '@/components/NotFound';
import { RequireAuth, RequireAdmin } from '@/components/ProtectedRoute';
import EventListPage from '@/pages/EventListPage';
import EventDetailPage from '@/pages/EventDetailPage';
import CreateEventPage from '@/pages/CreateEventPage';
import AdminDashboard from '@/pages/AdminDashboard';
import UserDashboard from '@/pages/UserDashboard';
import LoginPage from '@/pages/LoginPage';
import {
  Router,
  useLocation,
  matchRoute,
  ParamsProvider,
  type ReactNode,
} from '@/lib/router';

function Routes() {
  const { pathname } = useLocation();

  // Static routes (no params)
  const staticRoutes: Record<string, () => ReactNode> = {
    '/': () => <EventListPage />,
    '/login': () => <LoginPage />,
    '/dashboard': () => <RequireAuth><UserDashboard /></RequireAuth>,
    '/events/new': () => <RequireAdmin><CreateEventPage /></RequireAdmin>,
    '/admin': () => <RequireAdmin><AdminDashboard /></RequireAdmin>,
  };

  // Try static match first (exact pathname)
  if (staticRoutes[pathname]) {
    return <>{staticRoutes[pathname]()}</>;
  }

  // Dynamic routes with params
  let m: Record<string, string> | null;

  // /events/:id/edit (must check before /events/:id)
  m = matchRoute('/events/:id/edit', pathname);
  if (m) {
    return (
      <ParamsProvider params={m}>
        <RequireAdmin><CreateEventPage /></RequireAdmin>
      </ParamsProvider>
    );
  }

  // /events/:id
  m = matchRoute('/events/:id', pathname);
  if (m) {
    return (
      <ParamsProvider params={m}>
        <EventDetailPage />
      </ParamsProvider>
    );
  }

  return <NotFound />;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen flex flex-col bg-slate-50">
            <Navbar />
            <main className="flex-1">
              <Routes />
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}
