import { useEffect, type ReactNode } from 'react';
import type { Level } from '../types';
import { initials } from '../utils/format';

export function Panel({
  title, serial, action, children, ink, flush, raised,
}: {
  title?: string; serial?: string; action?: ReactNode; children: ReactNode;
  ink?: boolean; flush?: boolean; raised?: boolean;
}) {
  const cls = ['panel', ink && 'panel--ink', flush && 'panel--flush', raised && 'panel--raised']
    .filter(Boolean).join(' ');
  return (
    <section className={cls}>
      {title && (
        <header className="panel__head">
          <h2 className="panel__title">{title}</h2>
          {action}
          {serial && <span className="serial">{serial}</span>}
        </header>
      )}
      {flush ? children : <div className={title ? 'panel__body' : ''}>{children}</div>}
    </section>
  );
}

export function Loader({ label = 'جارٍ تحميل التأثير' }: { label?: string }) {
  return (
    <div className="loader">
      <div className="loader__rings" aria-hidden="true"><i /><i /><i /></div>
      <p className="label" style={{ margin: 0 }}>{label}</p>
    </div>
  );
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty__mark" aria-hidden="true">💧</div>
      <p style={{ fontWeight: 700, margin: '4px auto' }}>{title}</p>
      {hint && <p className="hint" style={{ margin: '0 auto' }}>{hint}</p>}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="note" role="alert">
      <strong>{message}</strong>
      {onRetry && (
        <div style={{ marginTop: 8 }}>
          <button className="btn btn--sm" onClick={onRetry}>حاول مرة أخرى</button>
        </div>
      )}
    </div>
  );
}

export function Stat({ value, label, accent }: { value: ReactNode; label: string; accent?: string }) {
  return (
    <div className="stat">
      <div className="stat__value" style={accent ? { color: accent } : undefined}>{value}</div>
      <div className="stat__label">{label}</div>
    </div>
  );
}

export function LevelBadge({ level, emoji }: { level: Level; emoji?: string }) {
  return (
    <span className="level-badge" data-level={level.code}>
      {emoji && <span aria-hidden="true">{emoji}</span>}
      {level.name}
    </span>
  );
}

export function Meter({ value, tone = 'current' }: { value: number; tone?: 'current' | 'hazard' | 'impact' }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div className="meter" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`meter__fill meter__fill--${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Avatar({ name, url, large }: { name: string; url?: string; large?: boolean }) {
  return (
    <span className={`avatar ${large ? 'avatar--lg' : ''}`} aria-hidden="true">
      {url ? <img src={url} alt="" loading="lazy" /> : initials(name)}
    </span>
  );
}

/** الموجة التي تنتشر عند تسجيل تأثير جديد. */
export function RippleBurst({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const id = window.setTimeout(onDone, 1400);
    return () => window.clearTimeout(id);
  }, [onDone]);
  return <div className="ripple-burst" aria-hidden="true"><i /><i /><i /></div>;
}

export function Modal({
  title, children, onClose, footer,
}: { title: string; children: ReactNode; onClose: () => void; footer?: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="hazard-bar hazard-bar--thin" />
        <div className="modal__body">
          <h3 style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>{title}</h3>
          {children}
        </div>
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>
  );
}
