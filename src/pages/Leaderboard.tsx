import { Link } from 'react-router-dom';
import { get } from '../services/api';
import { useStore } from '../components/store';
import { usePolling } from '../hooks/usePolling';
import { Empty, ErrorNote, Loader, Panel } from '../components/UI';
import { RankList } from '../components/RankList';
import type { BoardRow } from '../types';
import { rp } from '../utils/format';

export default function Leaderboard({ topOnly = false }: { topOnly?: boolean }) {
  const { settings, teams } = useStore();
  const limit = topOnly ? (settings?.maxTop10 ?? 10) : 0;

  const { data, error, loading, refresh } = usePolling<{ leaderboard: BoardRow[]; total: number }>(
    () => get('getLeaderboard', { limit: limit || undefined }),
    [limit],
    { intervalMs: (settings?.leaderboardRefreshSeconds ?? 8) * 1000 },
  );

  const rows = data?.leaderboard ?? [];

  return (
    <div className="wrap stack">
      <div className="row row--between">
        <div>
          <div className="label">RIPPLEIN LTD. · IMPACT RADAR</div>
          <h1 style={{ margin: 0 }}>{topOnly ? 'أعلى ١٠ صنّاع تأثير' : 'رادار الريبل'}</h1>
          <p className="hint" style={{ margin: 0 }}>الترتيب بيتحسب لحظيًا من كل التأثيرات المسجّلة.</p>
        </div>
        <div className="row">
          {!topOnly && <Link className="btn btn--sm" to="/top10">أعلى ١٠</Link>}
          <Link className="btn btn--sm btn--ink" to="/scoreboard">شاشة العرض</Link>
        </div>
      </div>

      {loading && !data && <Loader />}
      {error && <ErrorNote message={error} onRetry={() => refresh()} />}

      {rows.length > 0 && (
        <Panel flush raised>
          <div className="hazard-bar hazard-bar--thin" />
          <RankList rows={rows} />
        </Panel>
      )}

      {!loading && !error && rows.length === 0 && (
        <Panel><Empty title="لسه مفيش تأثيرات مسجلة." hint="أول ما تتسجل أول نقطة هتظهر هنا." /></Panel>
      )}

      {teams.length > 0 && (
        <Panel title="ترتيب الفرق" serial="TEAMS" flush
          action={<Link className="btn btn--sm" to="/teams">تفاصيل الفرق</Link>}>
          <table className="table">
            <thead>
              <tr><th>#</th><th>الفريق</th><th>الأعضاء</th><th>المتوسط</th><th>الإجمالي</th></tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.id}>
                  <td className="num">{t.rank}</td>
                  <td><Link to={`/team?id=${t.id}`}>{t.name}</Link></td>
                  <td>{t.memberCount}</td>
                  <td>{t.averagePoints}</td>
                  <td className="points">{rp(t.totalPoints)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
