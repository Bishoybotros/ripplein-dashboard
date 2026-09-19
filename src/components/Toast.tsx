import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type Kind = 'ok' | 'err' | 'info';
interface Item { id: number; kind: Kind; title: string; body?: string }

interface ToastApi {
  push: (kind: Kind, title: string, body?: string) => void;
  ok: (title: string, body?: string) => void;
  err: (title: string, body?: string) => void;
  info: (title: string, body?: string) => void;
}

const Ctx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);

  const push = useCallback((kind: Kind, title: string, body?: string) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, kind, title, body }]);
    window.setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 4200);
  }, []);

  const api = useMemo<ToastApi>(() => ({
    push,
    ok: (t, b) => push('ok', t, b),
    err: (t, b) => push('err', t, b),
    info: (t, b) => push('info', t, b),
  }), [push]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((i) => (
          <div key={i.id} className={`toast toast--${i.kind}`}>
            <div className="toast__title">{i.title}</div>
            {i.body && <div style={{ fontSize: '0.875rem' }}>{i.body}</div>}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast outside ToastProvider');
  return ctx;
}
