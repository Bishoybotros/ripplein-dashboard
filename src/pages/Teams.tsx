import { Link } from 'react-router-dom';
import { useStore } from '../components/store';
import { Empty, ErrorNote, Loader, Meter, Panel } from '../components/UI';
import { rp } from '../utils/format';

export default function Teams() {
  const { teams, booting, bootError, reload } = useStore();
  const max = Math.max(1, ...teams.map((t) => t.totalPoints));

  if (booting) return <div className="wrap"><Loader /></div>;
  if (bootError) return <div className="wrap"><ErrorNote message={bootError} onRetry={() => reload()} /></div>;

  return (
    <div className="wrap stack">
      <div>
        <div className="label">RIPPLEIN LTD. · UNITS</div>
        <h1 style={{ margin: 0 }}>الفرق</h1>
        <p className="hint">كل فريق دايرة. الدوايـر كلها في الآخر بتتجمع في موجة واحدة.</p>
      </div>

      {teams.length === 0 && <Panel><Empty title="مفيش فرق متسجلة لسه." /></Panel>}

      <div className="grid grid--2">
        {teams.map((t) => (
          <Panel key={t.id} raised serial={t.code || t.id}>
            <div className="row row--between">
              <div>
                <span className="team-tag" style={{ background: t.color, color: '#fff', borderColor: 'var(--ink)' }}>
                  {t.name}
                </span>
                <div className="serial" style={{ marginTop: 6 }}>RANK #{String(t.rank).padStart(2, '0')}</div>
              </div>
              <div style={{ textAlign: 'end' }}>
                <div className="num" style={{ fontSize: 'var(--t-lg)' }}>{rp(t.totalPoints)}</div>
                <div className="hint">{t.memberCount} عضو · متوسط {t.averagePoints}</div>
              </div>
            </div>
            <div style={{ marginTop: 'var(--s-3)' }}>
              <Meter value={t.totalPoints / max} tone="hazard" />
            </div>
            {t.description && <p className="hint" style={{ marginTop: 8 }}>{t.description}</p>}
            <Link className="btn btn--sm" to={`/team?id=${t.id}`} style={{ marginTop: 'var(--s-3)' }}>
              ملف الفريق
            </Link>
          </Panel>
        ))}
      </div>
    </div>
  );
}
