import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Canister } from '../components/Canister';
import { Panel, Stat } from '../components/UI';
import { useStore } from '../components/store';
import { rp } from '../utils/format';

const JOURNEY = [
  { icon: '🦋', title: 'لحظة الفراشة', note: 'قرار صغير' },
  { icon: '💧', title: 'القطرة', note: 'أول فعل' },
  { icon: '🌊', title: 'الدوائر', note: 'حد اتأثر' },
  { icon: '🌊', title: 'الموجة', note: 'المكان اتغير' },
  { icon: '♾️', title: 'تأثير مستمر', note: 'مش بينتهي عندك' },
];

const CHARACTERS = [
  { name: 'أندراوس وبطرس', line: 'ابدأ بواحد', note: 'أندراوس جاب أخوه. مش لازم تبدأ بمية.' },
  { name: 'أستير', line: 'خد الخطوة', note: 'الشجاعة قرار في لحظة، مش شعور دائم.' },
  { name: 'راعوث', line: 'كن أمينًا', note: 'الأمانة في الصغير هي اللي بتفتح الكبير.' },
  { name: 'بولس', line: 'ضاعف تأثيرك', note: 'علّم حد، وهو يعلّم حد.' },
];

export default function Landing() {
  const { stats, session } = useStore();

  return (
    <>
      <section className="hero">
        <div className="hero__rings" aria-hidden="true"><i /><i /><i /></div>
        <div className="wrap hero__inner">
          <p className="label" style={{ color: 'var(--steel)' }}>شركة الريبلين المحدودة · RIPPLEIN LTD.</p>
          <h1 className="hero__title">RIPP<em>LE</em></h1>
          <p className="hero__slogan">ONE DROP. ENDLESS IMPACT.</p>
          <p style={{ fontSize: 'var(--t-md)', maxWidth: '34ch' }}>
            قطرة واحدة… تأثير بلا حدود. كل تأثير كبير بدأ بحاجة صغيرة.
          </p>
          <div className="row" style={{ marginTop: 'var(--s-5)' }}>
            <Link className="btn btn--primary" to={session ? '/dashboard' : '/login'}>
              دخول الشركة
            </Link>
            <Link className="btn btn--ghost" style={{ color: 'var(--paper)', borderColor: 'var(--graphite)' }} to="/leaderboard">
              رادار الريبل
            </Link>
          </div>
        </div>
        <div className="hazard-bar" />
      </section>

      <div className="wrap stack" style={{ marginTop: 'var(--s-6)' }}>
        {stats && (
          <div className="grid grid--3">
            <Stat value={stats.participants} label="موظف مسجّل" />
            <Stat value={rp(stats.totalPoints)} label="إجمالي التأثير المسجّل" accent="var(--current)" />
            <Stat value={stats.transactions} label="عملية تأثير" />
            <Stat value={stats.activeTeams} label="فريق نشط" accent="var(--impact)" />
          </div>
        )}

        <div className="grid grid--side">
          <Panel title="ملف الشركة" serial="DOC-001">
            <p>
              شركة الريبلين المحدودة شركة بتجمع وتقيس حاجة واحدة: <strong>التأثير</strong>.
              مش الصوت العالي، ولا عدد المتابعين — الفعل الصغير اللي حد عمله ومحدش شافه،
              والكلمة اللي غيّرت يوم إنسان.
            </p>
            <p>
              كل مشارك في المؤتمر بيدخل الشركة كموظف جديد، بياخد رقم موظف، وبيجمع
              نقاط تأثير (RP) من مهام حقيقية على أرض الواقع.
            </p>
            <blockquote className="verse">
              أَنْتُمْ مِنَ اللهِ أَيُّهَا الأَوْلاَدُ، وَقَدْ غَلَبْتُمُوهُمْ، لأَنَّ الَّذِي فِيكُمْ أَعْظَمُ مِنَ الَّذِي فِي الْعَالَمِ.
              <cite>١ يوحنا ٤: ٤</cite>
            </blockquote>
          </Panel>

          <div style={{ display: 'grid', justifyItems: 'center' }}>
            <Canister />
          </div>
        </div>

        <Panel title="رحلة التأثير" serial="FIG-02">
          <div className="journey">
            {JOURNEY.map((j, i) => (
              <Fragment key={j.title}>
                <div className="journey__step">
                  <div className="journey__icon" aria-hidden="true">{j.icon}</div>
                  <strong style={{ fontSize: 'var(--t-sm)' }}>{j.title}</strong>
                  <div className="hint">{j.note}</div>
                </div>
                {i < JOURNEY.length - 1 && <span className="journey__arrow" aria-hidden="true">←</span>}
              </Fragment>
            ))}
          </div>
        </Panel>

        <Panel title="أربع شخصيات بدأت بخطوة" serial="FILE-04">
          <div className="grid grid--2">
            {CHARACTERS.map((c) => (
              <article key={c.name} className="note" style={{ borderStyle: 'solid', borderColor: 'var(--ink)' }}>
                <div className="label">{c.line}</div>
                <strong>{c.name}</strong>
                <p style={{ margin: '4px 0 0', fontSize: 'var(--t-sm)' }}>{c.note}</p>
              </article>
            ))}
          </div>
        </Panel>

        <div className="grid grid--2">
          <Panel ink title="اليوم الأول" serial="DAY-01">
            <div style={{ fontSize: 'var(--t-lg)' }} aria-hidden="true">🦋</div>
            <h3 style={{ color: 'var(--hazard)' }}>THE BUTTERFLY MOMENT</h3>
            <p style={{ color: 'var(--steel)' }}>لحظة صغيرة… قرار كبير. أنا وتأثيري.</p>
          </Panel>
          <Panel ink title="اليوم الثاني" serial="DAY-02">
            <div style={{ fontSize: 'var(--t-lg)' }} aria-hidden="true">🌊</div>
            <h3 style={{ color: 'var(--hazard)' }}>THE RIPPLE</h3>
            <p style={{ color: 'var(--steel)' }}>تأثيرك مش لازم ينتهي عندك. أنا والآخرين.</p>
          </Panel>
        </div>

        <Panel raised>
          <div className="row row--between">
            <div>
              <h3 style={{ margin: 0 }}>جاهز تبدأ شغلك في الشركة؟</h3>
              <p className="hint" style={{ margin: 0 }}>ادخل برقم الموظف والرقم السري اللي استلمته من فريق التنظيم.</p>
            </div>
            <Link className="btn btn--impact" to="/login">دخول الموظفين</Link>
          </div>
        </Panel>
      </div>
    </>
  );
}
