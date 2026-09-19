import { NavLink, Outlet } from 'react-router-dom';
import { useStore } from '../../components/store';

const ITEMS = [
  { to: '/admin', label: 'نظرة عامة', end: true },
  { to: '/admin/transactions', label: 'المعاملات' },
  { to: '/admin/participants', label: 'المشاركون' },
  { to: '/admin/teams', label: 'الفرق' },
  { to: '/admin/butterfly', label: 'لحظات الفراشة' },
  { to: '/admin/settings', label: 'الإعدادات' },
];

export default function AdminShell() {
  const { session, settings } = useStore();

  return (
    <div className="wrap">
      <div className="row row--between" style={{ marginBottom: 'var(--s-4)' }}>
        <div>
          <div className="label">RIPPLEIN LTD. · IMPACT CONTROL CENTER</div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '0.03em' }}>غرفة التحكم</h1>
        </div>
        <div style={{ textAlign: 'end' }}>
          <div className="serial">{session?.name}</div>
          <span className="stamp" style={{ color: settings?.isScoringOpen ? 'var(--go)' : 'var(--impact)' }}>
            {settings?.isScoringOpen ? 'SCORING OPEN' : 'SCORING CLOSED'}
          </span>
        </div>
      </div>

      <div className="admin">
        <nav className="side">
          {ITEMS.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => (isActive ? 'is-active' : '')}>
              {i.label}
            </NavLink>
          ))}
          <NavLink to="/scoreboard" className="">شاشة العرض ↗</NavLink>
        </nav>
        <div className="stack"><Outlet /></div>
      </div>
    </div>
  );
}
