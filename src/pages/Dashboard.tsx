import { Link } from 'react-router-dom';
import { get } from '../services/api';
import { useStore } from '../components/store';
import { usePolling } from '../hooks/usePolling';
import { Empty, ErrorNote, LevelBadge, Loader, Meter, Panel, Avatar } from '../components/UI';
import { RankList } from '../components/RankList';
import { TransactionList } from '../components/TransactionList';
import { Canister } from '../components/Canister';
import type { BoardRow, ParticipantView } from '../types';
import { rp } from '../utils/format';
import { levelEmoji, levelLine, nextLevelLine } from '../utils/levels';

export default function Dashboard() {
  const { session, categories, settings } = useStore();
  const refresh = (settings?.leaderboardRefreshSeconds ?? 8) * 1000;

  const me = usePolling<ParticipantView>(
    () => get<ParticipantView>('getParticipant', { id: session?.employeeId, token: session?.token }),
    [session?.token],
    { intervalMs: refresh * 2 },
  );

  const board = usePolling<{ leaderboard: BoardRow[] }>(
    () => get('getLeaderboard', { limit: settings?.maxTop10 ?? 10 }),
    [],
    { intervalMs: refresh },
  );

  if (me.loading && !me.data) return <div className="wrap"><Loader /></div>;
  if (me.error) return <div className="wrap"><ErrorNote message={me.error} onRetry={() => me.refresh()} /></div>;
  if (!me.data) return null;

  const { participant: p, recent, story, badges } = me.data;

  return (
    <div className="wrap stack">
      <Panel ink raised>
        <div className="row row--between">
          <div className="row">
            <span className="ripple-mark" style={{ width: 96, height: 96 }}>
              <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
              <Avatar name={p.name} url={p.avatarUrl} large />
            </span>
            <div>
              <div className="label">مرحبًا بك في شركة الريبلين</div>
              <h1 style={{ margin: '2px 0', fontSize: 'var(--t-xl)' }}>{p.name}</h1>
              <span className="serial" style={{ color: 'var(--hazard)' }}>{p.employeeId}</span>
              {p.teamName && <span className="rank__meta"> · فريق {p.teamName}</span>}
            </div>
          </div>
          <div style={{ textAlign: 'end' }}>
            <div className="num" style={{ fontSize: 'var(--t-2xl)', color: 'var(--hazard)' }}>{rp(p.points)}</div>
            <LevelBadge level={p.level} emoji={levelEmoji[p.level.code]} />
            <div className="serial" style={{ marginTop: 6 }}>RANK #{String(p.rank).padStart(2, '0')} / {p.totalParticipants}</div>
          </div>
        </div>
      </Panel>

      <div className="grid grid--side">
        <div className="stack">
          <Panel title="الريبل بتاعك" serial={`FILE-${p.employeeId}`}>
            <p style={{ fontSize: 'var(--t-md)', marginBottom: 'var(--s-3)' }}>{levelLine(p.points)}</p>
            <Meter value={p.level.progress} tone="hazard" />
            <div className="row row--between" style={{ marginTop: 6 }}>
              <span className="hint">{nextLevelLine(p.level)}</span>
              <span className="serial">{p.level.name} {p.level.nextName ? `→ ${p.level.nextName}` : ''}</span>
            </div>

            <dl className="kv" style={{ marginTop: 'var(--s-4)' }}>
              <dt>عدد التأثيرات المسجّلة</dt><dd>{p.transactionCount}</dd>
              {story.biggest && (<><dt>أكبر تأثير ليك</dt><dd>+{story.biggest.points} RP</dd></>)}
              <dt>قراءة النظام</dt><dd>{story.summary}</dd>
            </dl>
          </Panel>

          <Panel title="آخر التأثيرات" serial="LOG" flush>
            {recent.length ? (
              <TransactionList items={recent} categories={categories} />
            ) : (
              <Empty title="لسه مفيش تأثيرات مسجلة." hint="أول نقطة بتيجي من أول فعل." />
            )}
          </Panel>
        </div>

        <div className="stack">
          <div style={{ display: 'grid', justifyItems: 'center' }}>
            <Canister level={p.level} points={p.points} />
          </div>

          <Panel title="الشارات" serial="BDG">
            <div className="badges">
              {badges.map((b) => (
                <div key={b.id} className={`badge ${b.earned ? 'is-earned' : ''}`} title={b.earned ? 'مفتوحة' : 'لسه مقفولة'}>
                  <span className="badge__icon" aria-hidden="true">{b.icon}</span>
                  {b.name}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="لحظة الفراشة" serial="BM">
            <p style={{ fontSize: 'var(--t-sm)' }}>إيه القرار الصغير اللي ربنا طالب منك تعمله؟</p>
            <Link className="btn btn--sm btn--primary" to="/butterfly">اكتب إجابتك</Link>
          </Panel>
        </div>
      </div>

      <Panel title="رادار الريبل — أعلى 10" serial="RADAR" flush
        action={<Link className="btn btn--sm" to="/leaderboard">القائمة كاملة</Link>}>
        {board.data?.leaderboard?.length
          ? <RankList rows={board.data.leaderboard} highlightId={p.id} />
          : <Empty title="الرادار لسه فاضي." />}
      </Panel>
    </div>
  );
}
