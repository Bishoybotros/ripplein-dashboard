import { useSearchParams } from 'react-router-dom';
import { get } from '../services/api';
import { useStore } from '../components/store';
import { usePolling } from '../hooks/usePolling';
import { Avatar, Empty, ErrorNote, LevelBadge, Loader, Meter, Panel } from '../components/UI';
import { TransactionList } from '../components/TransactionList';
import { Canister } from '../components/Canister';
import type { ParticipantView } from '../types';
import { rp } from '../utils/format';
import { levelEmoji, levelLine, nextLevelLine } from '../utils/levels';

export default function ParticipantProfile() {
  const [params] = useSearchParams();
  const id = params.get('id') || '';
  const { session, categories } = useStore();

  const { data, error, loading, refresh } = usePolling<ParticipantView>(
    () => get<ParticipantView>('getParticipant', { id, token: session?.token }),
    [id],
  );

  if (loading && !data) return <div className="wrap"><Loader /></div>;
  if (error) return <div className="wrap"><ErrorNote message={error} onRetry={() => refresh()} /></div>;
  if (!data) return null;

  const { participant: p, recent, story, badges } = data;

  return (
    <div className="wrap stack">
      <Panel raised>
        <div className="row row--between">
          <div className="row">
            <Avatar name={p.name} url={p.avatarUrl} large />
            <div>
              <div className="label">ملف موظف · RIPPLEIN LTD.</div>
              <h1 style={{ margin: 0, fontSize: 'var(--t-xl)' }}>{p.name}</h1>
              <span className="serial">{p.employeeId}</span>
              {p.teamName && <span className="team-tag" style={{ marginInlineStart: 8 }}>{p.teamName}</span>}
            </div>
          </div>
          <div style={{ textAlign: 'end' }}>
            <div className="num" style={{ fontSize: 'var(--t-2xl)' }}>{rp(p.points)}</div>
            <LevelBadge level={p.level} emoji={levelEmoji[p.level.code]} />
            <div className="serial" style={{ marginTop: 6 }}>RANK #{String(p.rank).padStart(2, '0')}</div>
          </div>
        </div>
        <div style={{ marginTop: 'var(--s-4)' }}>
          <Meter value={p.level.progress} tone="impact" />
          <div className="row row--between" style={{ marginTop: 6 }}>
            <span className="hint">{levelLine(p.points)}</span>
            <span className="hint">{nextLevelLine(p.level)}</span>
          </div>
        </div>
      </Panel>

      <div className="grid grid--side">
        <Panel title="سجل التأثير" serial="LOG" flush>
          {recent.length
            ? <TransactionList items={recent} categories={categories} />
            : <Empty title="لسه مفيش تأثيرات مسجلة." />}
        </Panel>

        <div className="stack">
          <div style={{ display: 'grid', justifyItems: 'center' }}>
            <Canister level={p.level} points={p.points} />
          </div>
          <Panel title="حكاية الريبل" serial="STORY">
            <p style={{ fontSize: 'var(--t-sm)' }}>{story.summary}</p>
            <dl className="kv">
              <dt>عدد التأثيرات</dt><dd>{p.transactionCount}</dd>
              {story.biggest && (<><dt>أكبر تأثير</dt><dd>+{story.biggest.points} RP</dd></>)}
            </dl>
          </Panel>
          <Panel title="الشارات" serial="BDG">
            <div className="badges">
              {badges.map((b) => (
                <div key={b.id} className={`badge ${b.earned ? 'is-earned' : ''}`}>
                  <span className="badge__icon" aria-hidden="true">{b.icon}</span>
                  {b.name}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
