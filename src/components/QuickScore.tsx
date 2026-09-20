import { useMemo, useState } from 'react';
import { humanError, post } from '../services/api';
import { useStore } from './store';
import { useToast } from './Toast';
import { Modal, Panel, RippleBurst } from './UI';
import type { AdminParticipant, BulkResult } from '../types';
import { signed } from '../utils/format';

/**
 * تسجيل تأثير سريع لشخص واحد أو لمجموعة.
 * فلتر بالفريق + بحث + تحديد متعدد، والتسجيل بيتم في عملية واحدة على الخادم.
 */
export function QuickScore({
  participants, onDone, preselect,
}: {
  participants: AdminParticipant[];
  onDone: () => void;
  preselect?: AdminParticipant;
}) {
  const { session, categories, teams, settings } = useStore();
  const toast = useToast();

  const [teamId, setTeamId] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>(preselect ? [preselect.employeeId] : []);
  const [categoryId, setCategoryId] = useState('');
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [burst, setBurst] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return participants
      .filter((p) => p.status !== 'INACTIVE')
      .filter((p) => (teamId === '' ? true : teamId === 'NONE' ? !p.teamId : p.teamId === teamId))
      .filter((p) => !q
        || p.name.toLowerCase().includes(q)
        || p.displayName.toLowerCase().includes(q)
        || p.employeeId.toLowerCase().includes(q));
  }, [participants, teamId, query]);

  const byId = useMemo(() => {
    const map: Record<string, AdminParticipant> = {};
    participants.forEach((p) => { map[p.employeeId] = p; });
    return map;
  }, [participants]);

  const category = categories.find((c) => c.id === categoryId);
  const numeric = Number(points);
  const ready = selected.length > 0 && Boolean(category)
    && points !== '' && Number.isFinite(numeric) && numeric !== 0;

  const allVisibleSelected = visible.length > 0 && visible.every((p) => selected.includes(p.employeeId));

  const toggle = (employeeId: string) => {
    setSelected((prev) => (prev.includes(employeeId)
      ? prev.filter((id) => id !== employeeId)
      : [...prev, employeeId]));
  };

  const toggleAllVisible = () => {
    const ids = visible.map((p) => p.employeeId);
    setSelected((prev) => (allVisibleSelected
      ? prev.filter((id) => !ids.includes(id))
      : Array.from(new Set([...prev, ...ids]))));
  };

  const chooseCategory = (id: string) => {
    setCategoryId(id);
    const c = categories.find((x) => x.id === id);
    if (c && c.defaultPoints !== 0) setPoints(String(c.defaultPoints));
  };

  const reset = () => {
    setSelected([]);
    setCategoryId('');
    setPoints('');
    setReason('');
  };

  const submit = async () => {
    if (!ready || !category) return;
    setBusy(true);
    try {
      const res = await post<BulkResult>('addTransactionBulk', {
        token: session?.token,
        participantIds: selected,
        category: category.id,
        points: numeric,
        reason: reason.trim(),
      });
      setConfirming(false);
      setBurst(true);
      toast.ok(
        numeric < 0 ? 'IMPACT ADJUSTED' : 'RIPPLE DETECTED',
        res.created === 1
          ? `${signed(numeric)} RP · ${res.transactions[0]?.participantName ?? ''}`
          : `${signed(numeric)} RP لكل واحد · ${res.created} موظف`,
      );
      if (res.skipped.length) {
        toast.info('اتخطّى بعض المحددين', res.skipped.map((s) => s.id).join('، '));
      }
      if (res.levelUps.length || res.enteredTop10.length) setResult(res);
      reset();
      onDone();
    } catch (e) {
      toast.err('التأثير متسجّلش', humanError(e));
    } finally {
      setBusy(false);
    }
  };

  const closed = settings && !settings.isScoringOpen;
  const names = selected.map((id) => byId[id]?.name ?? id);

  return (
    <>
      {burst && <RippleBurst onDone={() => setBurst(false)} />}

      <Panel title="تسجيل تأثير سريع" serial="QS-01" raised>
        {closed && <div className="note" style={{ marginBottom: 12 }}>تسجيل النقاط مقفول من الإعدادات.</div>}

        <div className="row" style={{ alignItems: 'flex-end' }}>
          <label className="field" style={{ flex: '0 0 190px' }}>
            <span className="label">الفريق</span>
            <select className="select" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
              <option value="">كل الفرق</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.memberCount})</option>
              ))}
              <option value="NONE">بدون فريق</option>
            </select>
          </label>
          <label className="field" style={{ flex: 1, minWidth: 180 }}>
            <span className="label">بحث</span>
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="اسم أو رقم موظف…"
              autoComplete="off"
            />
          </label>
        </div>

        <div className="picker__bar">
          <button type="button" className="btn btn--sm btn--primary" onClick={toggleAllVisible} disabled={!visible.length}>
            {allVisibleSelected ? 'إلغاء تحديد الظاهر' : `تحديد الكل (${visible.length})`}
          </button>
          {selected.length > 0 && (
            <button type="button" className="btn btn--sm" onClick={() => setSelected([])}>مسح التحديد</button>
          )}
          <span className="spacer" />
          <span>
            محدَّد: <b className="picker__count">{selected.length}</b>
            {selected.length > 0 && numeric ? ` · الإجمالي ${signed(numeric * selected.length)} RP` : ''}
          </span>
        </div>

        <div className="picker" style={{ marginTop: 8 }} role="group" aria-label="اختيار المشاركين">
          {visible.length === 0 && (
            <p className="hint" style={{ padding: 12, margin: 0 }}>مفيش مشاركين بالفلتر ده.</p>
          )}
          {visible.map((p) => {
            const on = selected.includes(p.employeeId);
            return (
              <label key={p.id} className={`picker__row ${on ? 'is-on' : ''}`}>
                <input type="checkbox" checked={on} onChange={() => toggle(p.employeeId)} />
                <span>
                  <strong>{p.name}</strong>
                  <span className="picker__meta"> · <span className="serial">{p.employeeId}</span>
                    {p.teamName ? ` · ${p.teamName}` : ''}</span>
                </span>
                <span className="points">{p.points} RP</span>
              </label>
            );
          })}
        </div>

        {selected.length > 0 && selected.length <= 12 && (
          <div className="name-list" style={{ marginTop: 8 }}>
            {names.map((n, i) => <span key={selected[i]}>{n}</span>)}
          </div>
        )}

        <div className="field" style={{ marginTop: 'var(--s-4)' }}>
          <span className="label">التصنيف</span>
          <div className="chips">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip ${categoryId === c.id ? 'is-on' : ''}`}
                onClick={() => chooseCategory(c.id)}
              >
                <span aria-hidden="true">{c.icon}</span> {c.nameAr}
              </button>
            ))}
          </div>
        </div>

        <div className="row" style={{ alignItems: 'flex-end' }}>
          <label className="field" style={{ flex: '0 0 130px' }}>
            <span className="label">النقاط لكل واحد</span>
            <input
              className="input num"
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="50"
              step={5}
            />
          </label>
          <label className="field" style={{ flex: 1, minWidth: 180 }}>
            <span className="label">السبب</span>
            <input
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="حضروا الجلسة كاملة"
              maxLength={300}
            />
          </label>
        </div>

        <div className="row">
          <button
            className={numeric < 0 ? 'btn btn--impact' : 'btn btn--primary'}
            disabled={!ready || Boolean(closed)}
            onClick={() => setConfirming(true)}
          >
            {numeric < 0
              ? `خصم من ${selected.length || ''} ${selected.length === 1 ? 'مشارك' : 'مشاركين'}`
              : selected.length > 1 ? `إضافة التأثير لـ ${selected.length} مشاركين` : 'إضافة التأثير'}
          </button>
          {(selected.length > 0 || categoryId || points) && (
            <button className="btn btn--sm btn--ghost" onClick={reset}>مسح الكل</button>
          )}
          <span className="spacer" />
          <span className="hint">كل مشارك بياخد معاملة مستقلة — التراجع بيتم لكل واحد لوحده.</span>
        </div>
      </Panel>

      {confirming && category && (
        <Modal
          title={numeric < 0 ? 'تأكيد الخصم' : 'تأكيد إضافة التأثير'}
          onClose={() => setConfirming(false)}
          footer={
            <>
              <button className="btn btn--ghost" onClick={() => setConfirming(false)}>إلغاء</button>
              <button className="btn btn--primary" onClick={submit} disabled={busy}>
                {busy ? 'جارٍ التسجيل…' : 'تأكيد'}
              </button>
            </>
          }
        >
          <dl className="kv">
            <dt>عدد المشاركين</dt><dd>{selected.length}</dd>
            <dt>التصنيف</dt><dd>{category.icon} {category.nameAr}</dd>
            <dt>لكل واحد</dt>
            <dd className={`points ${numeric < 0 ? 'points--neg' : 'points--pos'}`}>{signed(numeric)} RP</dd>
            <dt>الإجمالي</dt>
            <dd className={`points ${numeric < 0 ? 'points--neg' : 'points--pos'}`}>
              {signed(numeric * selected.length)} RP
            </dd>
            <dt>السبب</dt><dd>{reason || '—'}</dd>
          </dl>
          <div className="name-list" style={{ marginTop: 12 }}>
            {names.slice(0, 15).map((n, i) => <span key={selected[i]}>{n}</span>)}
            {names.length > 15 && <span>و{names.length - 15} آخرين</span>}
          </div>
        </Modal>
      )}

      {result && (
        <Modal
          title={result.levelUps.length ? 'LEVEL UP' : 'RANKING UPDATED'}
          onClose={() => setResult(null)}
          footer={<button className="btn btn--primary" onClick={() => setResult(null)}>تمام</button>}
        >
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: '2.5rem' }} aria-hidden="true">🌊</div>
            <p style={{ margin: 0 }}>
              اتسجّل {signed(result.pointsEach)} RP لـ {result.created} مشارك.
            </p>
          </div>
          {result.levelUps.length > 0 && (
            <>
              <div className="label">صعدوا مستوى</div>
              <ul style={{ margin: '4px 0 12px', paddingInlineStart: 18 }}>
                {result.levelUps.map((l) => (
                  <li key={l.employeeId}>{l.name} → <strong>{l.level.name}</strong></li>
                ))}
              </ul>
            </>
          )}
          {result.enteredTop10.length > 0 && (
            <>
              <div className="label">في أعلى ١٠ دلوقتي</div>
              <ul style={{ margin: '4px 0 0', paddingInlineStart: 18 }}>
                {result.enteredTop10.map((t) => (
                  <li key={t.name}>#{t.rank} — {t.name}</li>
                ))}
              </ul>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
