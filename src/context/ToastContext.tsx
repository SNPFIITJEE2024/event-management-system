import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

const styles: Record<ToastType, { bg: string; icon: typeof CheckCircle2; border: string }> = {
  success: { bg: 'bg-emerald-50', icon: CheckCircle2, border: 'border-emerald-200' },
  error: { bg: 'bg-rose-50', icon: XCircle, border: 'border-rose-200' },
  info: { bg: 'bg-sky-50', icon: Info, border: 'border-sky-200' },
  warning: { bg: 'bg-amber-50', icon: AlertTriangle, border: 'border-amber-200' },
};

const iconColors: Record<ToastType, string> = {
  success: 'text-emerald-600',
  error: 'text-rose-600',
  info: 'text-sky-600',
  warning: 'text-amber-600',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3 w-[360px] max-w-[calc(100vw-2.5rem)] pointer-events-none">
        {toasts.map((t) => {
          const s = styles[t.type];
          const Icon = s.icon;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto ${s.bg} ${s.border} border rounded-xl shadow-lg shadow-slate-900/10 px-4 py-3 flex items-start gap-3 animate-[slideIn_0.25s_ease-out]`}
            >
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColors[t.type]}`} />
              <p className="text-sm text-slate-800 font-medium leading-snug flex-1">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
