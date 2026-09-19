import { useMemo, useState } from 'react';
import { humanError, post } from '../services/api';
import { useStore } from './store';
import { useToast } from './Toast';
import { Modal, Panel, RippleBurst } from './UI';
import type { AddTransactionResult, AdminParticipant } from '../types';
import { signed } from '../utils/format';

/** تسجيل تأثير سريع — البحث ثم التصنيف ثم النقاط ثم التأكيد. */
export function QuickScore({
  participants, onDone, preselect,
}: {
  participants: AdminParticipant[];
  onDone: () => void;
  preselect?: AdminParticipant;
}) {
  const { session, categories, settings } = useStore();
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<AdminParticipant | null>(preselect ?? null);
  const [categoryId, setCategoryId] = useState('');
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [burst, setBurst] = useState(false);
  const [levelUp, setLevelUp] = useState<AddTransactionResult | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return participants
      .filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.displayName.toLowerCase().includes(q) ||
        p.employeeId.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, participants]);

  const category = categories.find((c) => c.id === categoryId);
  const numeric = Number(points);
  const ready = Boolean(picked && category && points !== '' && Number.isFinite(numeric) && numeric !== 0);

  const pick = (p: AdminParticipant) => {
    setPicked(p);
    setQuery('');
  };

  const chooseCategory = (id: string) => {
    setCategoryId(id);
    const c = categories.find((x) => x.id === id);
    if (c && c.defaultPoints !== 0) setPoints(String(c.defaultPoints));
  };

  const reset = () => {
    setPicked(null);
    setCategoryId('');
    setPoints('');
    setReason('');
  };

  const submit = async () => {
    if (!ready || !picked || !category) return;
    setBusy(true);
    try {
      const res = await post<AddTransactionResult>('addTransaction', {
        token: session?.token,
        participantId: picked.employeeId,
        category: category.id,
        points: numeric,
        reason: reason.trim(),
      });
      setConfirming(false);
      setBurst(true);
      toast.ok(numeric < 0 ? 'IMPACT ADJUSTED' : 'RIPPLE DETECTED',
        `${signed(numeric)} RP · ${picked.name}`);
      if (res.levelUp) setLevelUp(res);
      reset();
      onDone();
    } catch (e) {
      toast.err('التأثير متسجّلش', humanError(e));
    } finally {
      setBusy(false);
    }
  };

  const closed = settings && !settings.isScoringOpen;

  return (
    <>
      {burst && <RippleBurst onDone={() => setBurst(false)} />}

      <Panel title="تسجيل تأثير سريع" serial="QS-01" raised>
        {closed && <div className="note" style={{ marginBottom: 12 }}>تسجيل النقاط مقفول من الإعدادات.</div>}

        <label className="field">
          <span className="label">المشارك</span>
          {picked ? (
            <div className="row row--between panel" style={{ padding: 10 }}>
              <span>
                <strong>{picked.name}</strong>{' '}
                <span className="serial">{picked.employeeId}</span>
                {picked.teamName && <span className="rank__meta"> · {picked.teamName}</span>}
              </span>
              <button type="button" className="btn btn--sm" onClick={() => setPicked(null)}>تغيير</button>
            </div>
          ) : (
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث بالاسم أو رقم الموظف…"
              autoComplete="off"
            />
          )}
        </label>

        {!picked && results.length > 0 && (
          <div className="result-list">
            {results.map((p) => (
              <button key={p.id} type="button" className="result" onClick={() => pick(p)}>
                <span>{p.name} <span className="serial">{p.employeeId}</span></span>
                <span className="points">{p.points} RP</span>
              </button>
            ))}
          </div>
        )}

        <div className="field" style={{ marginTop: 'var(--s-3)' }}>
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
            <span className="label">النقاط</span>
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
              placeholder="شجّع أحد أعضاء الفريق"
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
            {numeric < 0 ? 'خصم نقاط' : 'إضافة التأثير'}
          </button>
          {(picked || categoryId || points) && (
            <button className="btn btn--sm btn--ghost" onClick={reset}>مسح</button>
          )}
          <span className="spacer" />
          <span className="hint">النقاط بتتسجّل كمعاملة مستقلة — ومحدش بيعدّل مجموع بإيده.</span>
        </div>
      </Panel>

      {confirming && picked && category && (
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
            <dt>المشارك</dt><dd>{picked.name} <span className="serial">{picked.employeeId}</span></dd>
            <dt>التصنيف</dt><dd>{category.icon} {category.nameAr}</dd>
            <dt>النقاط</dt><dd className={`points ${numeric < 0 ? 'points--neg' : 'points--pos'}`}>{signed(numeric)} RP</dd>
            <dt>السبب</dt><dd>{reason || '—'}</dd>
          </dl>
        </Modal>
      )}

      {levelUp?.levelUp && (
        <Modal
          title="LEVEL UP"
          onClose={() => setLevelUp(null)}
          footer={<button className="btn btn--primary" onClick={() => setLevelUp(null)}>تمام</button>}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem' }} aria-hidden="true">🌊</div>
            <p style={{ fontSize: 'var(--t-md)', margin: 0 }}>
              {levelUp.participant?.name} وصل لمستوى <strong>{levelUp.levelUp.name}</strong>
            </p>
            {levelUp.enteredTop10 && (
              <p className="hint">ودخل قائمة أعلى ١٠ في المركز #{levelUp.enteredTop10}</p>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
