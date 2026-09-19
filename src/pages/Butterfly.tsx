import { useEffect, useState } from 'react';
import { get, humanError, post } from '../services/api';
import { useStore } from '../components/store';
import { useToast } from '../components/Toast';
import { Loader, Panel, RippleBurst } from '../components/UI';
import type { ButterflyMoment } from '../types';

export default function Butterfly() {
  const { session, settings } = useStore();
  const toast = useToast();
  const [answer, setAnswer] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [existing, setExisting] = useState<ButterflyMoment | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    let alive = true;
    get<{ moment: ButterflyMoment | null }>('getMyButterfly', { token: session?.token })
      .then((d) => {
        if (!alive) return;
        if (d.moment) {
          setExisting(d.moment);
          setAnswer(d.moment.answer);
          setVisibility(d.moment.visibility);
        }
      })
      .catch(() => { /* أول مرة: مفيش إجابة */ })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [session?.token]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;
    setBusy(true);
    try {
      const d = await post<{ moment: ButterflyMoment }>('submitButterflyMoment', {
        token: session?.token, answer: answer.trim(), visibility,
      });
      setExisting(d.moment);
      setBurst(true);
      toast.ok('BUTTERFLY MOMENT LOGGED', 'اتسجّلت. خليها تحصل على أرض الواقع.');
    } catch (err) {
      toast.err('متسجلتش', humanError(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="wrap"><Loader /></div>;

  return (
    <div className="wrap stack" style={{ maxWidth: 720 }}>
      {burst && <RippleBurst onDone={() => setBurst(false)} />}

      <Panel raised>
        <div style={{ fontSize: 'var(--t-2xl)' }} aria-hidden="true">🦋</div>
        <h1 style={{ margin: 0 }}>لحظة الفراشة</h1>
        <p style={{ fontSize: 'var(--t-md)' }}>
          ماذا لو كان الله ينتظر منك لحظة الفراشة الخاصة بك؟
        </p>
        <p className="hint">إيه القرار الصغير اللي ربنا طالب منك تعمله؟</p>

        {settings && !settings.butterflyOpen ? (
          <div className="note">التسجيل مقفول دلوقتي. هيفتح تاني في وقته.</div>
        ) : (
          <form onSubmit={save}>
            <label className="field">
              <span className="label">إجابتك</span>
              <textarea
                className="textarea"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                maxLength={1000}
                placeholder="اكتب القرار بوضوح… مش لازم يكون كبير."
                required
              />
              <span className="hint">{answer.length}/1000</span>
            </label>

            <div className="field">
              <span className="label">مين يقدر يشوفها؟</span>
              <div className="chips">
                <button type="button" className={`chip ${visibility === 'private' ? 'is-on' : ''}`}
                  onClick={() => setVisibility('private')}>
                  خاصة — أنا وفريق التنظيم بس
                </button>
                <button type="button" className={`chip ${visibility === 'public' ? 'is-on' : ''}`}
                  onClick={() => setVisibility('public')}>
                  أوافق تتعرض بدون اسمي
                </button>
              </div>
              <p className="hint" style={{ marginTop: 6 }}>
                الافتراضي خاص. مفيش إجابة بتتعرض من غير موافقتك.
              </p>
            </div>

            <button className="btn btn--impact" disabled={busy}>
              {busy ? 'جارٍ الحفظ…' : existing ? 'تحديث الإجابة' : 'سجّل لحظتي'}
            </button>
          </form>
        )}
      </Panel>

      {existing && (
        <Panel title="إجابتك المسجّلة" serial={existing.id}>
          <p style={{ whiteSpace: 'pre-wrap' }}>{existing.answer}</p>
          <p className="hint" style={{ margin: 0 }}>
            {existing.visibility === 'public' ? 'مسموح بعرضها بدون اسم.' : 'خاصة.'}
          </p>
        </Panel>
      )}
    </div>
  );
}
