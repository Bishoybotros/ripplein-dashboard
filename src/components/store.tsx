import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import { get, humanError } from '../services/api';
import { clearSession, loadSession, logout as endSession, saveSession } from '../services/session';
import type { Category, Session, Settings, Stats, Team } from '../types';

interface Bootstrap {
  settings: Settings;
  categories: Category[];
  teams: Team[];
  stats: Stats;
}

interface Store {
  session: Session | null;
  signIn: (s: Session) => void;
  signOut: () => Promise<void>;
  settings: Settings | null;
  categories: Category[];
  teams: Team[];
  stats: Stats | null;
  bootError: string | null;
  booting: boolean;
  reload: () => Promise<void>;
}

const FALLBACK_SETTINGS: Settings = {
  conferenceName: 'RIPPLE 2026',
  conferenceYear: '2026',
  companyName: 'شركة الريبلين المحدودة',
  currentDay: 1,
  isScoringOpen: true,
  butterflyOpen: true,
  leaderboardRefreshSeconds: 8,
  maxTop10: 10,
  levels: [
    { code: 'DROP', name: 'قطرة', min: 0 },
    { code: 'RIPPLE', name: 'ريبل', min: 100 },
    { code: 'WAVE', name: 'موجة', min: 250 },
    { code: 'IMPACT', name: 'تأثير', min: 500 },
    { code: 'RIPPLE_MAKER', name: 'صانع تأثير', min: 1000 },
  ],
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [boot, setBoot] = useState<Bootstrap | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);

  const reload = useCallback(async () => {
    try {
      const data = await get<Bootstrap>('getBootstrap');
      setBoot(data);
      setBootError(null);
    } catch (e) {
      setBootError(humanError(e));
    } finally {
      setBooting(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const signIn = useCallback((s: Session) => {
    saveSession(s);
    setSession(s);
  }, []);

  const signOut = useCallback(async () => {
    await endSession(session);
    clearSession();
    setSession(null);
  }, [session]);

  const value = useMemo<Store>(() => ({
    session,
    signIn,
    signOut,
    settings: boot?.settings ?? (bootError ? FALLBACK_SETTINGS : null),
    categories: boot?.categories ?? [],
    teams: boot?.teams ?? [],
    stats: boot?.stats ?? null,
    bootError,
    booting,
    reload,
  }), [session, signIn, signOut, boot, bootError, booting, reload]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore outside StoreProvider');
  return ctx;
}
