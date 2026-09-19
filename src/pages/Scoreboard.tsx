import { useEffect, useRef, useState } from 'react';
import { get } from '../services/api';
import { useStore } from '../components/store';
import { usePolling } from '../hooks/usePolling';
import { Loader } from '../components/UI';
import type { BoardRow } from '../types';

/** شاشة المؤتمر الكبيرة: بلا قوائم، بلا أزرار تحكّم، تحديث ذاتي. */
export default function Scoreboard() {
  const { settings } = useStore();
  const every = (settings?.leaderboardRefreshSeconds ?? 8) * 1000;
  const limit = settings?.maxTop10 ?? 10;

  const { data, error } = usePolling<{ leaderboard: BoardRow[] }>(
    () => get('getLeaderboard', { limit }),
    [limit],
    { intervalMs: every },
  );

  const rows = data?.leaderboard ?? [];
  const prev = useRef<Record<string, number>>({});
  const [moved, setMoved] = useState<Record<string, boolean>>({});
  const [updatedAt, setUpdatedAt] = useState<string>('');

  useEffect(() => {
    if (!rows.length) return;
    const changes: Record<string, boolean> = {};
    rows.forEach((r) => {
      const before = prev.current[r.id];
      if (before !== undefined && before !== r.points) changes[r.id] = true;
    });
    prev.current = Object.fromEntries(rows.map((r) => [r.id, r.points]));
    if (Object.keys(changes).length) {
      setMoved(changes);
      const t = window.setTimeout(() => setMoved({}), 1200);
      return () => window.clearTimeout(t);
    }
    setUpdatedAt(new Intl.DateTimeFormat('ar-EG', { hour: '2-digit', minute: '2-digit' }).format(new Date()));
  }, [rows]);

  return (
    <div className="board">
      <div className="board__head">
        <div>
          <div className="label" style={{ color: 'var(--hazard)' }}>RIPPLEIN LTD. · IMPACT MANAGEMENT SYSTEM</div>
          <h1 className="board__title">RIPPLE RADAR</h1>
          <div className="serial" style={{ color: 'var(--steel)' }}>
            رادار الريبل · أعلى {limit} صنّاع تأثير · DAY 0{settings?.currentDay ?? 1}
          </div>
        </div>
        <div className="ripple-mark" style={{ width: '9vh', height: '9vh' }} aria-hidden="true">
          <span /><span /><span />
        </div>
      </div>

      {!rows.length && !error && <Loader label="جارٍ استقبال إشارات التأثير" />}
      {error && <p style={{ color: 'var(--hazard)', marginTop: '4vh' }}>{error}</p>}

      <div className="board__list">
        {rows.map((r) => (
          <div
            key={r.id}
            className={`board__row ${r.rank === 1 ? 'board__row--top' : ''} ${moved[r.id] ? 'board__row--moved' : ''}`}
          >
            <span className="board__no">{String(r.rank).padStart(2, '0')}</span>
            <span>
              {r.name}
              <span className="serial" style={{ marginInlineStart: '0.8vw', opacity: 0.7 }}>{r.employeeId}</span>
            </span>
            <span className="serial" style={{ opacity: 0.8 }}>{r.teamName}</span>
            <span className="board__pts">{r.points} <small>RP</small></span>
          </div>
        ))}
      </div>

      <div className="board__foot">
        <span>ONE DROP. ENDLESS IMPACT.</span>
        <span>آخر تحديث {updatedAt} · كل {Math.round(every / 1000)} ثانية</span>
      </div>
    </div>
  );
}
