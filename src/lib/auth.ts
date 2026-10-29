export type UserRole = 'admin' | 'attendee';

export type AuthUser = {
  email: string;
  name: string;
  role: UserRole;
  token: string;
};

const STORAGE_KEY = 'ems_auth_user';

// Simulated JWT: base64-encoded header.payload.signature-ish blob.
export function mockToken(user: { email: string; name: string; role: UserRole }): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: btoa(user.email),
    email: user.email,
    name: user.name,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  };
  const enc = (o: unknown) => btoa(JSON.stringify(o)).replace(/=/g, '');
  return `${enc(header)}.${enc(payload)}.${enc('sparkiit-signature')}`;
}

export function saveUser(user: AuthUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearUser(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function decodeToken(token: string): { role: UserRole; email: string; name: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1]));
    return { role: payload.role, email: payload.email, name: payload.name };
  } catch {
    return null;
  }
}

export const DEMO_ADMIN = { email: 'admin@sparkiit.edu', name: 'Admin User', role: 'admin' as UserRole };
export const DEMO_ATTENDEE = { email: 'attendee@sparkiit.edu', name: 'Attendee User', role: 'attendee' as UserRole };
