import type { Category, Transaction } from '../types';
import { signed, timeAgo } from '../utils/format';

export function TransactionList({
  items, categories, onReverse, showName,
}: {
  items: Transaction[];
  categories: Category[];
  onReverse?: (t: Transaction) => void;
  showName?: boolean;
}) {
  const cat = (id: string) => categories.find((c) => c.id === id);
  return (
    <div>
      {items.map((t) => {
        const c = cat(t.category);
        const pts = Number(t.points);
        return (
          <article key={t.id} className={`tx ${t.reversed ? 'is-reversed' : ''}`}>
            <span className="tx__icon" aria-hidden="true">{c?.icon || (pts < 0 ? '⚠️' : '🌊')}</span>
            <div>
              <strong>{c?.nameAr || t.category}</strong>
              {showName && <span className="rank__meta"> · {t.participantName} <span className="serial">{t.employeeId}</span></span>}
              {t.reason && <div className="tx__reason">{t.reason}</div>}
              <div className="tx__time">
                {timeAgo(t.createdAt)} · <span className="serial">{t.id}</span>
                {t.reversed && ' · تم التراجع عنها'}
              </div>
            </div>
            <div style={{ textAlign: 'end' }}>
              <span className={`points ${pts < 0 ? 'points--neg' : 'points--pos'}`}>{signed(pts)}</span>
              {onReverse && !t.reversed && (
                <div>
                  <button className="btn btn--sm" onClick={() => onReverse(t)}>تراجع</button>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
