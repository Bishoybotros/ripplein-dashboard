import { useCallback, useEffect, useRef, useState } from 'react';
import { humanError } from '../services/api';

interface Options {
  intervalMs?: number;
  enabled?: boolean;
  immediate?: boolean;
}

/**
 * جلب بيانات + تحديث دوري (polling).
 * يتوقف تلقائيًا لما يكون التاب مخفي، ويكمل لما يرجع — يوفّر حصة Apps Script.
 */
export function usePolling<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  { intervalMs = 0, enabled = true, immediate = true }: Options = {},
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(immediate);
  const saved = useRef(fetcher);
  saved.current = fetcher;

  const refresh = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const next = await saved.current();
      setData(next);
      setError(null);
    } catch (e) {
      setError(humanError(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (immediate) void refresh();
    if (!intervalMs) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh(true);
    }, intervalMs);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, intervalMs, ...deps]);

  return { data, error, loading, refresh, setData };
}
