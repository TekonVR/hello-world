/**
 * Progress and motivation (section 6.5).
 *
 * Streaks are counted in sprints per week, not consecutive days, so one missed
 * evening does not reset anything. Nothing here produces a number that goes
 * down: the app does not do guilt.
 */

import { toDayKey, weekStartKey, MS_PER_MINUTE } from './time';
import type { Sprint } from './types';

/** Only completed sprints count towards the week (section 6.2). */
export function countsTowardsWeek(sprint: Sprint): boolean {
  return sprint.status === 'completed';
}

export function sprintsInWeek(sprints: Sprint[], now: number): number {
  const start = weekStartKey(now);
  return sprints.filter((s) => countsTowardsWeek(s) && weekStartKey(s.startedAt) === start).length;
}

export function sprintsToday(sprints: Sprint[], now: number): number {
  const day = toDayKey(now);
  return sprints.filter((s) => countsTowardsWeek(s) && toDayKey(s.startedAt) === day).length;
}

/** How many sprints, back to back, ended in the last couple of hours. */
export function sprintsInARow(sprints: Sprint[], now: number, gapMinutes = 40): number {
  let run = 0;
  let cursor = now;
  for (let i = sprints.length - 1; i >= 0; i -= 1) {
    const sprint = sprints[i];
    if (!countsTowardsWeek(sprint)) continue;
    const ended = sprint.endedAt ?? sprint.startedAt;
    if (cursor - ended > gapMinutes * MS_PER_MINUTE) break;
    run += 1;
    cursor = sprint.startedAt;
  }
  return run;
}

export interface WeekProgress {
  done: number;
  target: number;
  /** 0 to 1, capped, for the ring on the progress screen. */
  fraction: number;
}

export function weekProgress(sprints: Sprint[], now: number, target: number): WeekProgress {
  const done = sprintsInWeek(sprints, now);
  return { done, target, fraction: Math.min(1, done / Math.max(1, target)) };
}

export interface PersonalRecords {
  bestWeek: number;
  bestDay: number;
  totalSprints: number;
  totalMinutes: number;
  subjectsTouched: number;
}

/** The record board. Everything here is a personal best, never a deficit. */
export function personalRecords(sprints: Sprint[]): PersonalRecords {
  const completed = sprints.filter(countsTowardsWeek);
  const perWeek = new Map<string, number>();
  const perDay = new Map<string, number>();
  const subjects = new Set<string>();
  let totalMinutes = 0;

  for (const sprint of completed) {
    const week = weekStartKey(sprint.startedAt);
    const day = toDayKey(sprint.startedAt);
    perWeek.set(week, (perWeek.get(week) ?? 0) + 1);
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
    subjects.add(sprint.subjectId);
    // Rounded up: any time served is at least a minute, never "0 minutes".
    totalMinutes += Math.ceil(((sprint.endedAt ?? sprint.startedAt) - sprint.startedAt) / MS_PER_MINUTE);
  }

  return {
    bestWeek: Math.max(0, ...perWeek.values()),
    bestDay: Math.max(0, ...perDay.values()),
    totalSprints: completed.length,
    totalMinutes,
    subjectsTouched: subjects.size,
  };
}
