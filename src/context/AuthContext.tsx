import { createContext, useContext, useState, type ReactNode, useCallback } from 'react';
import { getUser, saveUser, clearUser, mockToken, type AuthUser, type UserRole, DEMO_ADMIN, DEMO_ATTENDEE } from '@/lib/auth';

type AuthContextValue = {
  user: AuthUser | null;
  isAdmin: boolean;
  isAttendee: boolean;
  login: (email: string, name: string, role: UserRole) => void;
  demoAdmin: () => void;
  demoAttendee: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getUser());

  const login = useCallback((email: string, name: string, role: UserRole) => {
    const token = mockToken({ email, name, role });
    const u: AuthUser = { email, name, role, token };
    saveUser(u);
    setUser(u);
  }, []);

  const demoAdmin = useCallback(() => {
    const token = mockToken(DEMO_ADMIN);
    const u: AuthUser = { ...DEMO_ADMIN, token };
    saveUser(u);
    setUser(u);
  }, []);

  const demoAttendee = useCallback(() => {
    const token = mockToken(DEMO_ATTENDEE);
    const u: AuthUser = { ...DEMO_ATTENDEE, token };
    saveUser(u);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearUser();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin: user?.role === 'admin',
      isAttendee: user?.role === 'attendee',
      login,
      demoAdmin,
      demoAttendee,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
