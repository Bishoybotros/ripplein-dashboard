import { useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useStore } from './store';

const LINKS = [
  { to: '/leaderboard', label: 'رادار الريبل' },
  { to: '/teams', label: 'الفرق' },
  { to: '/missions', label: 'مهام التأثير' },
  { to: '/butterfly', label: 'لحظة الفراشة' },
];

export function Layout({ children }: { children: ReactNode }) {
  const { session, signOut, settings } = useStore();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const leave = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="shell">
      <a className="skip-link" href="#main">تخطَّ إلى المحتوى</a>
      <header className="topbar">
        <div className="hazard-bar hazard-bar--thin" />
        <div className="wrap topbar__inner">
          <Link to="/" className="brand">
            <span className="brand__mark">RIPPLE</span>
            <span className="brand__sub">RIPPLEIN LTD.</span>
          </Link>

          <button
            className="topbar__toggle"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            القائمة
          </button>

          <nav className={`nav ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)}>
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'is-active' : '')}>
                {l.label}
              </NavLink>
            ))}
            {session?.role === 'participant' && (
              <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'is-active' : '')}>ملفي</NavLink>
            )}
            {session?.role === 'admin' && (
              <NavLink to="/admin" className={({ isActive }) => (isActive ? 'is-active' : '')}>غرفة التحكم</NavLink>
            )}
          </nav>

          <div className="spacer" />

          {settings && (
            <span className="serial" style={{ color: 'var(--steel)' }}>
              DAY 0{settings.currentDay}
            </span>
          )}

          {session ? (
            <button className="btn btn--sm btn--ghost" style={{ color: 'var(--hazard)' }} onClick={leave}>
              خروج
            </button>
          ) : (
            <Link className="btn btn--sm btn--primary" to="/login">دخول الموظفين</Link>
          )}
        </div>
      </header>

      <main id="main" className="page">{children}</main>

      <footer className="footer">
        <div className="wrap">
          <span>شركة الريبلين المحدودة — نظام إدارة التأثير</span>
          <span className="serial">ONE DROP. ENDLESS IMPACT.</span>
          <span className="serial">لا تستهن بالأفعال الصغيرة.</span>
        </div>
      </footer>
    </div>
  );
}
