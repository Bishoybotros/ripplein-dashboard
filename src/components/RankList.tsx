import { Link } from 'react-router-dom';
import type { BoardRow } from '../types';
import { rp } from '../utils/format';
import { Avatar, LevelBadge, Meter } from './UI';
import { levelEmoji } from '../utils/levels';

export function RankList({ rows, highlightId }: { rows: BoardRow[]; highlightId?: string }) {
  return (
    <div>
      {rows.map((r) => (
        <Link
          key={r.id}
          to={`/participant?id=${encodeURIComponent(r.employeeId)}`}
          className={`rank rank--${r.rank}`}
          style={r.id === highlightId ? { background: '#FFFBE6' } : undefined}
        >
          <span className="rank__no">{String(r.rank).padStart(2, '0')}</span>
          <Avatar name={r.name} url={r.avatarUrl} />
          <span>
            <span className="rank__name">{r.name}</span>
            <span className="rank__meta"> · <span className="serial">{r.employeeId}</span>
              {r.teamName ? ` · ${r.teamName}` : ''}</span>
            <span style={{ display: 'block', maxWidth: 220, marginTop: 4 }}>
              <Meter value={r.level.progress} tone={r.rank <= 3 ? 'hazard' : 'current'} />
            </span>
          </span>
          <span className="rank__points">
            <span className="points">{rp(r.points)}</span>
            <span style={{ display: 'block', marginTop: 4 }}>
              <LevelBadge level={r.level} emoji={levelEmoji[r.level.code]} />
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
