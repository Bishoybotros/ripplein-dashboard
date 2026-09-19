import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from './store';

/** يحمي المسارات الخاصة. الحماية الحقيقية تحدث على الخادم — هذه لتجربة الاستخدام فقط. */
export function Guard({ role, children }: { role?: 'participant' | 'admin'; children: ReactNode }) {
  const { session } = useStore();
  const loc = useLocation();
  const allowed = session && (!role || session.role === role);
  if (!allowed) {
    const to = role === 'admin' ? '/admin/login' : '/login';
    return <Navigate to={to} replace state={{ from: loc.pathname + loc.search }} />;
  }
  return <>{children}</>;
}
