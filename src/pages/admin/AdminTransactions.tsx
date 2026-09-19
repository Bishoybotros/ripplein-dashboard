import { useState } from 'react';
import { get, humanError, post } from '../../services/api';
import { useStore } from '../../components/store';
import { usePolling } from '../../hooks/usePolling';
import { useToast } from '../../components/Toast';
import { TransactionList } from '../../components/TransactionList';
import { Empty, ErrorNote, Loader, Modal, Panel } from '../../components/UI';
import type { Transaction } from '../../types';
import { downloadCsv } from '../../utils/csv';
import { signed } from '../../utils/format';

export default function AdminTransactions() {
  const { session, categories, teams } = useStore();
  const toast = useToast();
  const [filters, setFilters] = useState({ participantId: '', teamId: '', category: '', from: '', to: '' });
  const [pending, setPending] = useState<Transaction | null>(null);
  const [busy, setBusy] = useState(false);

  const { data, error, loading, refresh } = usePolling<{ transactions: Transaction[]; total: number }>(
    () => get('adminGetTransactions', { token: session?.token, ...filters, limit: 300 }),
    [filters.participantId, filters.teamId, filters.category, filters.from, filters.to],
  );

  const set = (k: keyof typeof filters, v: string) => setFilters((f) => ({ ...f, [k]: v }));

  const reverse = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await post('reverseTransaction', { token: session?.token, transactionId: pending.id });
      toast.ok('تم التراجع', `${pending.id} · ${signed(Number(pending.points))} RP`);
      setPending(null);
      void refresh(true);
    } catch (e) {
      toast.err('التراجع فشل', humanError(e));
    } finally {
      setBusy(false);
    }
  };

  const rows = data?.transactions ?? [];

  return (
    <>
      <Panel title="فلترة المعاملات" serial="FLT">
        <div className="grid grid--3">
          <label className="field">
            <span className="label">المشارك (اسم أو رقم موظف)</span>
            <input className="input" value={filters.participantId}
              onChange={(e) => set('participantId', e.target.value.trim())} placeholder="RPL-0264" />
          </label>
          <label className="field">
            <span className="label">الفريق</span>
            <select className="select" value={filters.teamId} onChange={(e) => set('teamId', e.target.value)}>
              <option value="">الكل</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="label">التصنيف</span>
            <select className="select" value={filters.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">الكل</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="label">من تاريخ</span>
            <input className="input" type="date" value={filters.from} onChange={(e) => set('from', e.target.value)} />
          </label>
          <label className="field">
            <span className="label">إلى تاريخ</span>
            <input className="input" type="date" value={filters.to} onChange={(e) => set('to', e.target.value)} />
          </label>
        </div>
        <div className="row">
          <button className="btn btn--sm" onClick={() => setFilters({ participantId: '', teamId: '', category: '', from: '', to: '' })}>
            مسح الفلاتر
          </button>
          <button className="btn btn--sm" onClick={() => downloadCsv('ripplein-transactions.csv', rows)}
            disabled={!rows.length}>
            تصدير CSV
          </button>
          <span className="spacer" />
          <span className="hint">{data ? `${rows.length} من ${data.total}` : ''}</span>
        </div>
      </Panel>

      {loading && !data && <Loader />}
      {error && <ErrorNote message={error} onRetry={() => refresh()} />}

      <Panel title="كل المعاملات" serial="TX" flush>
        {rows.length
          ? <TransactionList items={rows} categories={categories} showName onReverse={setPending} />
          : <Empty title="مفيش معاملات بالفلاتر دي." />}
      </Panel>

      {pending && (
        <Modal
          title="تراجع عن المعاملة"
          onClose={() => setPending(null)}
          footer={
            <>
              <button className="btn btn--ghost" onClick={() => setPending(null)}>إلغاء</button>
              <button className="btn btn--impact" onClick={reverse} disabled={busy}>
                {busy ? 'جارٍ…' : 'تأكيد التراجع'}
              </button>
            </>
          }
        >
          <p>المعاملة مش هتتمسح — هتتسجّل كمعاملة متراجَع عنها وتتشال من الحساب.</p>
          <dl className="kv">
            <dt>رقم المعاملة</dt><dd className="serial">{pending.id}</dd>
            <dt>المشارك</dt><dd>{pending.participantName}</dd>
            <dt>النقاط</dt><dd className="points">{signed(Number(pending.points))} RP</dd>
          </dl>
        </Modal>
      )}
    </>
  );
}
