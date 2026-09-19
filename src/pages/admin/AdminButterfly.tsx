import { get } from '../../services/api';
import { useStore } from '../../components/store';
import { usePolling } from '../../hooks/usePolling';
import { Empty, ErrorNote, Loader, Panel } from '../../components/UI';
import type { ButterflyMoment } from '../../types';
import { downloadCsv } from '../../utils/csv';
import { formatDate } from '../../utils/format';

export default function AdminButterfly() {
  const { session } = useStore();
  const { data, error, loading, refresh } = usePolling<{ moments: ButterflyMoment[] }>(
    () => get('adminGetButterfly', { token: session?.token }), [session?.token],
  );

  const items = data?.moments ?? [];

  return (
    <>
      <Panel title="لحظات الفراشة" serial="BM" raised
        action={
          <button className="btn btn--sm" disabled={!items.length}
            onClick={() => downloadCsv('butterfly-moments.csv', items)}>
            تصدير CSV
          </button>
        }>
        <p className="hint" style={{ margin: 0 }}>
          دي إجابات شخصية. الافتراضي إنها خاصة — متعرضش أي إجابة على الشاشة إلا لو مكتوب جنبها «موافق على العرض».
        </p>
      </Panel>

      {loading && !data && <Loader />}
      {error && <ErrorNote message={error} onRetry={() => refresh()} />}

      {items.length ? (
        <div className="grid grid--2">
          {items.map((m) => (
            <Panel key={m.id} serial={m.id}>
              <div className="row row--between">
                <strong>{m.name}</strong>
                <span className={`team-tag`} style={{
                  background: m.visibility === 'public' ? 'var(--go)' : 'var(--concrete)',
                  color: m.visibility === 'public' ? '#fff' : 'var(--graphite)',
                }}>
                  {m.visibility === 'public' ? 'موافق على العرض' : 'خاصة'}
                </span>
              </div>
              <p style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{m.answer}</p>
              <div className="tx__time">{formatDate(m.createdAt)} · <span className="serial">{m.employeeId}</span></div>
            </Panel>
          ))}
        </div>
      ) : (!loading && <Panel><Empty title="لسه محدش كتب لحظته." /></Panel>)}
    </>
  );
}
