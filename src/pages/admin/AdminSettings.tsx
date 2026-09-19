import { useEffect, useState } from 'react';
import { humanError, post } from '../../services/api';
import { useStore } from '../../components/store';
import { useToast } from '../../components/Toast';
import { Loader, Panel } from '../../components/UI';
import type { LevelDef, Settings } from '../../types';

export default function AdminSettings() {
  const { session, settings, reload } = useStore();
  const toast = useToast();
  const [form, setForm] = useState<Settings | null>(settings);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (settings) setForm(settings); }, [settings]);

  if (!form) return <Loader />;

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setForm({ ...form, [k]: v });

  const setLevel = (i: number, patch: Partial<LevelDef>) => {
    const levels = form.levels.map((l, idx) => (idx === i ? { ...l, ...patch } : l));
    set('levels', levels);
  };

  const save = async () => {
    setBusy(true);
    try {
      await post('updateSettings', {
        token: session?.token,
        settings: {
          conferenceName: form.conferenceName,
          conferenceYear: form.conferenceYear,
          companyName: form.companyName,
          currentDay: form.currentDay,
          isScoringOpen: form.isScoringOpen,
          butterflyOpen: form.butterflyOpen,
          leaderboardRefreshSeconds: form.leaderboardRefreshSeconds,
          maxTop10: form.maxTop10,
          levels: form.levels,
        },
      });
      await reload();
      toast.ok('تم حفظ الإعدادات');
    } catch (e) {
      toast.err('الحفظ فشل', humanError(e));
    } finally {
      setBusy(false);
    }
  };

  const recalc = async () => {
    setBusy(true);
    try {
      await post('recalculate', { token: session?.token });
      await reload();
      toast.ok('تمت إعادة الحساب', 'كل المجاميع اتحسبت من المعاملات من جديد.');
    } catch (e) {
      toast.err('العملية فشلت', humanError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Panel title="إعدادات النظام" serial="CFG" raised>
        <div className="grid grid--2">
          <label className="field">
            <span className="label">اسم المؤتمر</span>
            <input className="input" value={form.conferenceName} onChange={(e) => set('conferenceName', e.target.value)} />
          </label>
          <label className="field">
            <span className="label">اسم الشركة</span>
            <input className="input" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} />
          </label>
          <label className="field">
            <span className="label">اليوم الحالي</span>
            <select className="select" value={form.currentDay} onChange={(e) => set('currentDay', Number(e.target.value))}>
              <option value={1}>اليوم الأول — لحظة الفراشة</option>
              <option value={2}>اليوم الثاني — الريبل</option>
            </select>
          </label>
          <label className="field">
            <span className="label">عدد أعلى قائمة (Top N)</span>
            <input className="input num" type="number" min={3} max={50} value={form.maxTop10}
              onChange={(e) => set('maxTop10', Number(e.target.value))} />
          </label>
          <label className="field">
            <span className="label">تحديث الشاشة كل (ثانية)</span>
            <input className="input num" type="number" min={3} max={60} value={form.leaderboardRefreshSeconds}
              onChange={(e) => set('leaderboardRefreshSeconds', Number(e.target.value))} />
          </label>
        </div>

        <div className="chips" style={{ marginBottom: 'var(--s-3)' }}>
          <button type="button" className={`chip ${form.isScoringOpen ? 'is-on' : ''}`}
            onClick={() => set('isScoringOpen', !form.isScoringOpen)}>
            {form.isScoringOpen ? 'تسجيل النقاط مفتوح' : 'تسجيل النقاط مقفول'}
          </button>
          <button type="button" className={`chip ${form.butterflyOpen ? 'is-on' : ''}`}
            onClick={() => set('butterflyOpen', !form.butterflyOpen)}>
            {form.butterflyOpen ? 'لحظة الفراشة مفتوحة' : 'لحظة الفراشة مقفولة'}
          </button>
        </div>

        <button className="btn btn--primary" onClick={save} disabled={busy}>
          {busy ? 'جارٍ الحفظ…' : 'حفظ الإعدادات'}
        </button>
      </Panel>

      <Panel title="مستويات التأثير" serial="LVL">
        <p className="hint">الحدود دي هي المصدر الوحيد للمستويات — الواجهة والخادم بيقروا منها.</p>
        <div className="scroll-x">
          <table className="table">
            <thead><tr><th>الكود</th><th>الاسم بالعربي</th><th>يبدأ من (RP)</th></tr></thead>
            <tbody>
              {form.levels.map((l, i) => (
                <tr key={l.code}>
                  <td className="serial">{l.code}</td>
                  <td><input className="input" value={l.name} onChange={(e) => setLevel(i, { name: e.target.value })} /></td>
                  <td>
                    <input className="input num" type="number" value={l.min}
                      onChange={(e) => setLevel(i, { min: Number(e.target.value) })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn btn--primary" onClick={save} disabled={busy} style={{ marginTop: 12 }}>
          حفظ المستويات
        </button>
      </Panel>

      <Panel title="صيانة" serial="OPS">
        <p className="hint">
          لو عدّلت الشيت بإيدك، شغّل إعادة الحساب عشان المجاميع المخزّنة تتزامن مع المعاملات.
        </p>
        <button className="btn" onClick={recalc} disabled={busy}>إعادة حساب كل شيء</button>
      </Panel>
    </>
  );
}
