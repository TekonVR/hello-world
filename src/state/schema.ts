/**
 * The persisted shape, and the migration that keeps an old save working.
 *
 * The MVP keeps everything on the device (section 11: data minimisation, no
 * account needed to revise). The records match what the Postgres schema in
 * section 10 will hold, so syncing later is a transport problem, not a
 * remodelling one.
 */

import type { AnalyticsEvent } from '../analytics';
import type { Sprint, StudentProfile, TopicState } from '../engine/types';

export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'lockin.state.v1';

export interface AppState {
  version: number;
  onboarded: boolean;
  profile: StudentProfile;
  topicStates: Record<string, TopicState>;
  sprints: Sprint[];
  /** Kept locally until there is a backend to send them to. */
  events: AnalyticsEvent[];
}

export function defaultProfile(): StudentProfile {
  return {
    yearGroup: 11,
    subjects: [],
    keyDates: [],
    notificationTime: '17:30',
    defaultMinutes: 15,
    weeklyTarget: 5,
    parentSummaryOptIn: false,
    parentEmail: null,
  };
}

export function defaultState(): AppState {
  return {
    version: SCHEMA_VERSION,
    onboarded: false,
    profile: defaultProfile(),
    topicStates: {},
    sprints: [],
    events: [],
  };
}

/** Never throw on a stored blob: a bad save must not lock a student out. */
export function migrate(raw: unknown): AppState {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  const stored = raw as Partial<AppState>;

  return {
    ...base,
    ...stored,
    version: SCHEMA_VERSION,
    profile: { ...base.profile, ...(stored.profile ?? {}) },
    topicStates: stored.topicStates ?? {},
    sprints: Array.isArray(stored.sprints) ? stored.sprints : [],
    events: Array.isArray(stored.events) ? stored.events.slice(-200) : [],
  };
}
