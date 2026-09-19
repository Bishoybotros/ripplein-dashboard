import { useState } from 'react';
import { Link } from 'react-router-dom';
import { humanError, post } from '../../services/api';
import { useStore } from '../../components/store';
import { useToast } from '../../components/Toast';
import { Empty, Modal, Panel } from '../../components/UI';
import { rp } from '../../utils/format';

export default function AdminTeams() {
  const { session, teams, reload } = useStore();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '', color: '#1769FF' });

  const create = async () => {
    setBusy(true);
    try {
      await post('createTeam', { token: session?.token, ...form });
      toast.ok('تم إنشاء الفريق', form.name);
      setForm({ name: '', code: '', description: '', color: '#1769FF' });
      setAdding(false);
      await reload();
    } catch (e) {
      toast.err('الإنشاء فشل', humanError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Panel title="الفرق" serial="UNITS" raised
        action={<button className="btn btn--sm btn--primary" onClick={() => setAdding(true)}>فريق جديد</button>}>
        {teams.length ? (
          <div className="scroll-x">
            <table className="table">
              <thead>
                <tr><th>#</th><th>الفريق</th><th>الكود</th><th>الأعضاء</th><th>المتوسط</th><th>الإجمالي</th><th></th></tr>
              </thead>
              <tbody>
                {teams.map((t) => (
                  <tr key={t.id}>
                    <td className="num">{t.rank}</td>
                    <td>
                      <span className="team-tag" style={{ background: t.color, color: '#fff' }}>{t.name}</span>
                    </td>
                    <td className="serial">{t.code || t.id}</td>
                    <td>{t.memberCount}</td>
                    <td>{t.averagePoints}</td>
                    <td className="points">{rp(t.totalPoints)}</td>
                    <td><Link className="btn btn--sm" to={`/team?id=${t.id}`}>الملف</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty title="مفيش فرق." hint="أنشئ أول وحدة في الشركة." />}
      </Panel>

      <div className="note">
        نقل مشارك من فريق لفريق بيتم من صفحة المشاركين. المعاملات القديمة بتحتفظ باسم الفريق وقت تسجيلها — ده مقصود عشان السجل يفضل دقيق.
      </div>

      {adding && (
        <Modal
          title="فريق جديد"
          onClose={() => setAdding(false)}
          footer={
            <>
              <button className="btn btn--ghost" onClick={() => setAdding(false)}>إلغاء</button>
              <button className="btn btn--primary" onClick={create} disabled={busy || !form.name.trim()}>
                {busy ? 'جارٍ…' : 'إنشاء'}
              </button>
            </>
          }
        >
          <label className="field">
            <span className="label">اسم الفريق</span>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="field">
            <span className="label">الكود</span>
            <input className="input serial" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="RPL-05" />
          </label>
          <label className="field">
            <span className="label">الوصف</span>
            <input className="input" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <label className="field">
            <span className="label">اللون</span>
            <input className="input" type="color" value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ height: 44, padding: 4 }} />
          </label>
        </Modal>
      )}
    </>
  );
}
