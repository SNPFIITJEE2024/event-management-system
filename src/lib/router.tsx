import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type MouseEvent,
  type AnchorHTMLAttributes,
} from 'react';

export type { ReactNode };

// ---- Router context ----

type RouterState = {
  path: string;
  navigate: (to: string, opts?: { replace?: boolean }) => void;
};

const RouterContext = createContext<RouterState | null>(null);

function normalizePath(p: string): string {
  if (!p) return '/';
  if (!p.startsWith('/')) p = '/' + p;
  return p;
}

export function Router({ children }: { children: ReactNode }) {
  const [path, setPath] = useState<string>(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const onPop = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to: string, opts?: { replace?: boolean }) => {
    const target = normalizePath(to);
    if (target === normalizePath(window.location.pathname)) return;
    if (opts?.replace) {
      window.history.replaceState({}, '', target);
    } else {
      window.history.pushState({}, '', target);
    }
    setPath(target);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const value = useMemo(() => ({ path, navigate }), [path, navigate]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

// ---- Hooks ----

export function useLocation(): { pathname: string } {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useLocation must be used within Router');
  return { pathname: ctx.path };
}

export function useNavigate() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useNavigate must be used within Router');
  return ctx.navigate;
}

// Extracts params from the current path given a pattern like "/events/:id"
function matchPath(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i];
    const ap = pathParts[i];
    if (pp.startsWith(':')) {
      params[pp.slice(1)] = decodeURIComponent(ap);
    } else if (pp !== ap) {
      return null;
    }
  }
  return params;
}

const RouteParamsContext = createContext<Record<string, string>>({});

// ---- useParams: reads from nearest RouteParamsContext ----
export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  return useContext(RouteParamsContext) as T;
}

// ---- Link ----

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  children: ReactNode;
};

export function Link({ to, children, onClick, ...rest }: LinkProps) {
  const ctx = useContext(RouterContext);
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (onClick) onClick(e);
    if (ctx) ctx.navigate(to);
  };
  return (
    <a href={normalizePath(to)} onClick={handle} {...rest}>
      {children}
    </a>
  );
}

// ---- Navigate (declarative redirect) ----

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const ctx = useContext(RouterContext);
  useEffect(() => {
    if (ctx) ctx.navigate(to, { replace });
  }, [ctx, to, replace]);
  return null;
}

// ---- Route matching helpers for App.tsx ----

// Match a pattern against current path; returns params or null.
export function matchRoute(pattern: string, path: string): Record<string, string> | null {
  return matchPath(pattern, path);
}

// Provider wrapper so matched params flow to useParams() inside a page.
export function ParamsProvider({ params, children }: { params: Record<string, string>; children: ReactNode }) {
  return <RouteParamsContext.Provider value={params}>{children}</RouteParamsContext.Provider>;
}
