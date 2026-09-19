import type { Session } from '../types';
import { post } from './api';

const KEY = 'ripplein.session';

/** نحفظ توكن الجلسة فقط — لا كلمات سر ولا أسرار في المتصفح. */
export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(s: Session) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* التخزين ممنوع */ }
}

export function clearSession() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export async function logout(session: Session | null) {
  if (session?.token) {
    try { await post('logout', { token: session.token }); } catch { /* تجاهل */ }
  }
  clearSession();
}
