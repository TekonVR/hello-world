/**
 * App state: one store, persisted to localStorage, read through a hook.
 *
 * Small enough not to need a state library, and keeping it in one place means
 * the sprint screen cannot get out of step with the progress screen.
 *
 * The records match what the Postgres schema in section 10 will hold, so
 * adding a backend later is a transport problem rather than a remodelling one.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

function read(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return migrate(raw ? JSON.parse(raw) : null);
  } catch {
    // Private mode, blocked storage or a corrupt save: start fresh rather than
    // refuse to open.
    return defaultState();
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(read());
    setHydrated(true);
  }, []);

  const apply = useCallback((updater: (current: AppState) => AppState) => {
    setState((current) => {
      const next = updater(current);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Full quota or blocked storage: this session still works from memory.
      }
      return next;
    });
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      state,
      hydrated,

      completeOnboarding: (profile) =>
        apply((current) => ({ ...current, onboarded: true, profile })),

      updateProfile: (patch) =>
        apply((current) => ({ ...current, profile: { ...current.profile, ...patch } })),

      startSprint: (sprint) =>
        apply((current) => ({ ...current, sprints: [...current.sprints, sprint] })),

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
          const before: TopicState =
            current.topicStates[sprint.topicId] ?? emptyTopicState(sprint.topicId);
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
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          // The in-memory reset below is what the student sees either way.
        }
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
