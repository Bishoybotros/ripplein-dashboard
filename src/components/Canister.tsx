import type { Level } from '../types';

const TICKS = [
  { code: 'BUTTERFLY', label: 'BUTTERFLY' },
  { code: 'DROP', label: 'DROP' },
  { code: 'RIPPLE', label: 'RIPPLE' },
  { code: 'WAVE', label: 'WAVE' },
  { code: 'IMPACT', label: 'IMPACT' },
  { code: 'RIPPLE_MAKER', label: '∞' },
];

/** عبوة التأثير — العنصر البصري المميز للشركة. */
export function Canister({ level, points }: { level?: Level; points?: number }) {
  const reached = level ? TICKS.findIndex((t) => t.code === level.code) : 0;
  return (
    <figure className="canister" style={{ margin: 0 }}>
      <div className="canister__cap" aria-hidden="true" />
      <div className="label">RIPPLEIN LTD.</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.1em' }}>
        IMPACT CAPACITY
      </div>
      <div className="canister__gauge" aria-hidden="true">
        {TICKS.map((t, i) => (
          <div key={t.code} className={`canister__tick ${i <= Math.max(0, reached) ? 'is-on' : ''}`}>
            <span style={{ width: 62, textAlign: 'start' }}>{t.label}</span>
            <b />
          </div>
        ))}
      </div>
      {points !== undefined && (
        <div className="num" style={{ fontSize: '1.25rem' }}>{points} <span style={{ fontSize: '0.7rem' }}>RP</span></div>
      )}
      <figcaption className="canister__warn">
        تحذير: أفعال صغيرة قد تسبب تأثيرًا غير متوقع.
      </figcaption>
    </figure>
  );
}
