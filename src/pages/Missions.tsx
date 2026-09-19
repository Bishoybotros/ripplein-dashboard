import { useStore } from '../components/store';
import { Empty, Loader, Panel } from '../components/UI';

const DAY_MISSIONS: Record<number, { title: string; note: string }[]> = {
  1: [
    { title: 'ابدأ بواحد', note: 'كلّم شخص واحد النهارده معملتش معاه ده قبل كده.' },
    { title: 'قرار مؤجّل', note: 'حاجة صغيرة بتأجلها من زمان — اعملها النهارده.' },
    { title: 'اعتذار', note: 'لو في حد مضايق منك، ابدأ إنت.' },
  ],
  2: [
    { title: 'تأثير سري', note: 'اعمل خير ومتقولش لحد. الأدمن بس هو اللي هيسجّله.' },
    { title: 'شجّع حد', note: 'قول لحد حاجة حقيقية بتقدّرها فيه.' },
    { title: 'ضاعف', note: 'علّم حد حاجة اتعلمتها هنا.' },
  ],
};

export default function Missions() {
  const { categories, settings, booting } = useStore();
  const day = settings?.currentDay ?? 1;
  const missions = DAY_MISSIONS[day] ?? DAY_MISSIONS[1];

  if (booting) return <div className="wrap"><Loader /></div>;

  return (
    <div className="wrap stack">
      <div>
        <div className="label">RIPPLEIN LTD. · IMPACT MISSIONS</div>
        <h1 style={{ margin: 0 }}>مهام التأثير</h1>
        <p className="hint">النقاط بتتسجّل من فريق التنظيم بعد ما المهمة تتعمل فعلًا.</p>
      </div>

      <div className="day-tabs">
        <span className={`day-tab ${day === 1 ? 'is-now' : ''}`}>🦋 اليوم الأول — لحظة الفراشة</span>
        <span className={`day-tab ${day === 2 ? 'is-now' : ''}`}>🌊 اليوم الثاني — الريبل</span>
      </div>

      <div className="grid grid--2">
        {missions.map((m, i) => (
          <Panel key={m.title} raised serial={`MSN-${String(i + 1).padStart(2, '0')}`}>
            <h3 style={{ margin: 0 }}>{m.title}</h3>
            <p style={{ margin: '6px 0 0' }}>{m.note}</p>
          </Panel>
        ))}
      </div>

      <Panel title="جدول النقاط المعتمد" serial="RATE-CARD" flush>
        {categories.length ? (
          <table className="table">
            <thead>
              <tr><th>التصنيف</th><th>الوصف</th><th>النقاط</th></tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td><span aria-hidden="true">{c.icon}</span> {c.nameAr}</td>
                  <td className="hint">{c.description}</td>
                  <td className="points">{c.defaultPoints > 0 ? `+${c.defaultPoints}` : c.defaultPoints || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty title="جدول النقاط مش متاح دلوقتي." />}
      </Panel>

      <div className="note">
        <strong>تذكير:</strong> التأثير السري مش بيتعلن. بيتسجّل عندنا بس، وإنت هتشوفه في ملفك.
      </div>
    </div>
  );
}
