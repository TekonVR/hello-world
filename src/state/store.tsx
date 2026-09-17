/**
 * App state: one store, persisted to the device, read through a hook.
 *
 * Small enough not to need a state library, and keeping it in one place means
 * the sprint screen cannot get out of step with the progress screen.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { track, type AnalyticsEvent } from '../analytics';
import { applySprint, emptyTopicState } from '../engine/spacing';
import type { MoveResult, Sprint, SprintStatus, StudentProfile, TopicState } from '../engine/types';
import { STORAGE_KEY, defaultState, migrate, type AppState } from './schema';

interface StoreValue {
  state: AppState;
  hydrated: boolean;
  completeOnboarding: (profile: StudentProfile) => void;
  updateProfile: (patch: Partial<StudentProfile>) => void;
  startSprint: (sprint: Sprint) => void;
  recordMove: (sprintId: string, result: MoveResult) => void;
  endSprint: (sprintId: string, status: SprintStatus, endedAt?: number) => void;
  logEvent: (event: AnalyticsEvent) => void;
  reset: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const saving = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        setState(migrate(raw ? JSON.parse(raw) : null));
      })
      .catch(() => {
        // Unreadable save: start fresh rather than refuse to open.
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: AppState) => {
    saving.current = saving.current
      .then(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)))
      .catch(() => {
        // Full disk or private mode: the session still works from memory.
      });
  }, []);

  const apply = useCallback(
    (updater: (current: AppState) => AppState) => {
      setState((current) => {
        const next = updater(current);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const value = useMemo<StoreValue>(
    () => ({
      state,
      hydrated,

      completeOnboarding: (profile) =>
        apply((current) => ({ ...current, onboarded: true, profile })),

      updateProfile: (patch) =>
        apply((current) => ({ ...current, profile: { ...current.profile, ...patch } })),

      startSprint: (sprint) => apply((current) => ({ ...current, sprints: [...current.sprints, sprint] })),

      recordMove: (sprintId, result) =>
        apply((current) => ({
          ...current,
          sprints: current.sprints.map((sprint) =>
            sprint.id === sprintId
              ? {
                  ...sprint,
                  // Re-answering a move replaces the earlier result.
                  results: [...sprint.results.filter((r) => r.moveId !== result.moveId), result],
                }
              : sprint,
          ),
        })),

      endSprint: (sprintId, status, endedAt = Date.now()) =>
        apply((current) => {
          const sprint = current.sprints.find((item) => item.id === sprintId);
          if (!sprint || sprint.endedAt !== null) return current;

          const finished: Sprint = { ...sprint, status, endedAt };
          const before: TopicState = current.topicStates[sprint.topicId] ?? emptyTopicState(sprint.topicId);
          // An abandoned sprint still teaches the engine what was answered.
          const after = applySprint(before, finished.results, endedAt);

          return {
            ...current,
            sprints: current.sprints.map((item) => (item.id === sprintId ? finished : item)),
            topicStates: { ...current.topicStates, [sprint.topicId]: after },
          };
        }),

      logEvent: (event) =>
        apply((current) => ({ ...current, events: [...current.events, event].slice(-200) })),

      reset: () => {
        AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
        setState(defaultState());
      },
    }),
    [apply, hydrated, state],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore must be used inside a StoreProvider');
  return value;
}

/** Track an event and keep a copy in the local buffer. */
export function useTracker() {
  const { logEvent } = useStore();
  return useCallback(
    (name: Parameters<typeof track>[0], props?: Parameters<typeof track>[1]) => {
      logEvent(track(name, props));
    },
    [logEvent],
  );
}
