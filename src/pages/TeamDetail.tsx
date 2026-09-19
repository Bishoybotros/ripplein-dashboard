import { Link, useSearchParams } from 'react-router-dom';
import { get } from '../services/api';
import { usePolling } from '../hooks/usePolling';
import { useStore } from '../components/store';
import { Empty, ErrorNote, Loader, Meter, Panel, Stat } from '../components/UI';
import { RankList } from '../components/RankList';
import type { Team } from '../types';
import { rp } from '../utils/format';

export default function TeamDetail() {
  const [params] = useSearchParams();
  const id = params.get('id') || '';
  const { settings } = useStore();

  const { data, error, loading, refresh } = usePolling<{ team: Team }>(
    () => get('getTeam', { id }),
    [id],
    { intervalMs: (settings?.leaderboardRefreshSeconds ?? 8) * 2000 },
  );

  if (loading && !data) return <div className="wrap"><Loader /></div>;
  if (error) return <div className="wrap"><ErrorNote message={error} onRetry={() => refresh()} /></div>;
  if (!data) return null;

  const t = data.team;
  const members = t.members ?? [];

  return (
    <div className="wrap stack">
      <Panel raised serial={t.code || t.id}>
        <div className="row row--between">
          <div>
            <div className="label">وحدة داخل شركة الريبلين</div>
            <h1 style={{ margin: 0 }}>فريق {t.name}</h1>
            {t.description && <p className="hint" style={{ margin: 0 }}>{t.description}</p>}
          </div>
          <Link className="btn btn--sm" to="/teams">كل الفرق</Link>
        </div>
        <div className="grid grid--3" style={{ marginTop: 'var(--s-4)' }}>
          <Stat value={rp(t.totalPoints)} label="إجمالي تأثير الفريق" />
          <Stat value={`#${t.rank}`} label="ترتيب الفريق" accent="var(--impact)" />
          <Stat value={t.memberCount} label="عدد الأعضاء" />
          <Stat value={t.averagePoints} label="متوسط التأثير للعضو" accent="var(--current)" />
        </div>
        <div style={{ marginTop: 'var(--s-4)' }}>
          <Meter value={Math.min(1, t.totalPoints / 5000)} tone="hazard" />
          <p className="hint" style={{ margin: '6px 0 0' }}>مؤشر موجة الفريق</p>
        </div>
      </Panel>

      <Panel title="أعضاء الفريق" serial="MEMBERS" flush>
        {members.length ? <RankList rows={members} /> : <Empty title="مفيش أعضاء في الفريق ده لسه." />}
      </Panel>
    </div>
  );
}
