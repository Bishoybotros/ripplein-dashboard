import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { get, humanError, post } from '../../services/api';
import { useStore } from '../../components/store';
import { usePolling } from '../../hooks/usePolling';
import { useToast } from '../../components/Toast';
import { Empty, ErrorNote, Loader, Modal, Panel } from '../../components/UI';
import type { AdminParticipant } from '../../types';
import { downloadCsv } from '../../utils/csv';

const EMPTY_FORM = { name: '', employeeId: '', teamId: '', pin: '', phone: '' };

export default function AdminParticipants() {
  const { session, teams } = useStore();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPins, setShowPins] = useState(false);

  const { data, error, loading, refresh } = usePolling<{ participants: AdminParticipant[] }>(
    () => get('adminGetParticipants', { token: session?.token }), [session?.token],
  );

  const rows = useMemo(() => {
    const list = data?.participants ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => p.name.toLowerCase().includes(q) || p.employeeId.toLowerCase().includes(q));
  }, [data, query]);

  const create = async () => {
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      const d = await post<{ participant: AdminParticipant }>('createParticipant', {
        token: session?.token, ...form,
      });
      toast.ok('تم تسجيل الموظف', `${d.participant.employeeId} · الرقم السري ${d.participant.pin}`);
      setForm(EMPTY_FORM);
      setAdding(false);
      void refresh(true);
    } catch (e) {
      toast.err('التسجيل فشل', humanError(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async (p: AdminParticipant) => {
    try {
      await post('updateParticipant', {
        token: session?.token, participantId: p.employeeId,
        status: p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
      });
      void refresh(true);
    } catch (e) {
      toast.err('التعديل فشل', humanError(e));
    }
  };

  return (
    <>
      <Panel title="المشاركون" serial="EMP" raised
        action={<button className="btn btn--sm btn--primary" onClick={() => setAdding(true)}>تسجيل موظف</button>}>
        <div className="row">
          <input className="input" style={{ maxWidth: 280 }} value={query}
            onChange={(e) => setQuery(e.target.value)} placeholder="ابحث بالاسم أو رقم الموظف…" />
          <button className="btn btn--sm" onClick={() => setShowPins((v) => !v)}>
            {showPins ? 'إخفاء الأرقام السرية' : 'إظهار الأرقام السرية'}
          </button>
          <button className="btn btn--sm" disabled={!rows.length}
            onClick={() => downloadCsv('ripplein-participants.csv', rows.map((r) => ({
              employeeId: r.employeeId, name: r.name, team: r.teamName, points: r.points, level: r.level.name,
            })))}>
            تصدير CSV
          </button>
          <span className="spacer" />
          <span className="hint">{rows.length} موظف</span>
        </div>
      </Panel>

      {loading && !data && <Loader />}
      {error && <ErrorNote message={error} onRetry={() => refresh()} />}

      <Panel flush>
        {rows.length ? (
          <div className="scroll-x">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th><th>الاسم</th><th>رقم الموظف</th><th>الفريق</th>
                  <th>النقاط</th><th>المستوى</th>{showPins && <th>الرقم السري</th>}<th>الحالة</th><th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className="num">{p.rank ?? '—'}</td>
                    <td>{p.name}</td>
                    <td className="serial">{p.employeeId}</td>
                    <td>{p.teamName || '—'}</td>
                    <td className="points">{p.points}</td>
                    <td>{p.level.name}</td>
                    {showPins && <td className="serial">{p.pin}</td>}
                    <td>{p.status === 'ACTIVE' ? 'نشط' : 'موقوف'}</td>
                    <td>
                      <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                        <Link className="btn btn--sm" to={`/participant?id=${p.employeeId}`}>الملف</Link>
                        <button className="btn btn--sm" onClick={() => toggleStatus(p)}>
                          {p.status === 'ACTIVE' ? 'إيقاف' : 'تفعيل'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty title="مفيش مشاركين." hint="ابدأ بتسجيل أول موظف في الشركة." />}
      </Panel>

      {adding && (
        <Modal
          title="تسجيل موظف جديد"
          onClose={() => setAdding(false)}
          footer={
            <>
              <button className="btn btn--ghost" onClick={() => setAdding(false)}>إلغاء</button>
              <button className="btn btn--primary" onClick={create} disabled={busy || !form.name.trim()}>
                {busy ? 'جارٍ…' : 'تسجيل'}
              </button>
            </>
          }
        >
          <label className="field">
            <span className="label">الاسم</span>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="field">
            <span className="label">رقم الموظف (اتركه فارغًا ليُولَّد تلقائيًا)</span>
            <input className="input serial" value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })} placeholder="RPL-0265" />
          </label>
          <label className="field">
            <span className="label">الفريق</span>
            <select className="select" value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })}>
              <option value="">بدون فريق</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="label">الرقم السري (اتركه فارغًا ليُولَّد تلقائيًا)</span>
            <input className="input" value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })}
              inputMode="numeric" />
          </label>
        </Modal>
      )}
    </>
  );
}
