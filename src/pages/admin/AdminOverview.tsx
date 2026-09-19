import { Link } from 'react-router-dom';
import { get } from '../../services/api';
import { useStore } from '../../components/store';
import { usePolling } from '../../hooks/usePolling';
import { QuickScore } from '../../components/QuickScore';
import { RankList } from '../../components/RankList';
import { TransactionList } from '../../components/TransactionList';
import { Empty, ErrorNote, Loader, Panel, Stat } from '../../components/UI';
import type { AdminParticipant, BoardRow, Stats, Transaction } from '../../types';
import { rp } from '../../utils/format';

export default function AdminOverview() {
  const { session, categories, settings, reload } = useStore();
  const every = (settings?.leaderboardRefreshSeconds ?? 8) * 1000;

  const people = usePolling<{ participants: AdminParticipant[] }>(
    () => get('adminGetParticipants', { token: session?.token }), [session?.token],
  );
  const stats = usePolling<Stats>(() => get('getStats'), [], { intervalMs: every });
  const board = usePolling<{ leaderboard: BoardRow[] }>(
    () => get('getLeaderboard', { limit: settings?.maxTop10 ?? 10 }), [], { intervalMs: every },
  );
  const txs = usePolling<{ transactions: Transaction[] }>(
    () => get('adminGetTransactions', { token: session?.token, limit: 12 }), [session?.token], { intervalMs: every },
  );

  const refreshAll = () => {
    void people.refresh(true);
    void stats.refresh(true);
    void board.refresh(true);
    void txs.refresh(true);
    void reload();
  };

  if (people.error) return <ErrorNote message={people.error} onRetry={() => people.refresh()} />;

  const s = stats.data;

  return (
    <>
      <div className="grid grid--3">
        <Stat value={s ? s.participants : '—'} label="إجمالي المشاركين" />
        <Stat value={s ? rp(s.totalPoints) : '—'} label="إجمالي التأثير" accent="var(--current)" />
        <Stat value={s ? s.transactions : '—'} label="عدد المعاملات" />
        <Stat value={s ? s.activeTeams : '—'} label="فرق نشطة" />
        <Stat value={s?.topParticipant ? s.topParticipant.name : '—'} label="أعلى مشارك" accent="var(--impact)" />
        <Stat value={s?.topTeam ? s.topTeam.name : '—'} label="أعلى فريق" />
      </div>

      {people.loading && !people.data ? <Loader /> : (
        <QuickScore participants={people.data?.participants ?? []} onDone={refreshAll} />
      )}

      <div className="grid grid--side">
        <Panel title="آخر المعاملات" serial="LOG" flush
          action={<Link className="btn btn--sm" to="/admin/transactions">الكل</Link>}>
          {txs.data?.transactions?.length
            ? <TransactionList items={txs.data.transactions} categories={categories} showName />
            : <Empty title="لسه مفيش تأثيرات مسجلة." hint="سجّل أول تأثير من الأعلى." />}
        </Panel>

        <Panel title="رادار الريبل" serial="RADAR" flush>
          {board.data?.leaderboard?.length
            ? <RankList rows={board.data.leaderboard} />
            : <Empty title="الرادار فاضي." />}
        </Panel>
      </div>
    </>
  );
}
