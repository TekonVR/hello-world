import assert from 'node:assert/strict';
import test from 'node:test';

import {
  personalRecords,
  sprintsInARow,
  sprintsInWeek,
  sprintsToday,
  weekProgress,
} from '../src/engine/streak';
import { weekStartKey } from '../src/engine/time';
import type { Sprint } from '../src/engine/types';

// A Thursday evening.
const NOW = new Date(2026, 8, 17, 19, 0, 0).getTime();
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

function sprint(startedAt: number, status: Sprint['status'] = 'completed', minutes = 15): Sprint {
  return {
    id: `s${startedAt}`,
    subjectId: 'maths',
    topicId: 'maths.quadratics',
    plannedMinutes: minutes,
    startedAt,
    endedAt: startedAt + minutes * MINUTE,
    status,
    moveIds: [],
    results: [],
  };
}

test('weeks run Monday to Sunday', () => {
  const thursday = new Date(2026, 8, 17).getTime();
  const sunday = new Date(2026, 8, 20).getTime();
  const monday = new Date(2026, 8, 21).getTime();
  assert.equal(weekStartKey(thursday), '2026-09-14');
  assert.equal(weekStartKey(sunday), '2026-09-14');
  assert.equal(weekStartKey(monday), '2026-09-21');
});

test('the week counts completed sprints only', () => {
  const sprints = [
    sprint(NOW - 2 * DAY),
    sprint(NOW - DAY),
    sprint(NOW - 3600_000, 'abandoned'),
    sprint(NOW - 8 * DAY), // last week
  ];
  assert.equal(sprintsInWeek(sprints, NOW), 2);
});

test('an abandoned sprint does not count towards the day', () => {
  const sprints = [sprint(NOW - 3 * 3600_000), sprint(NOW - 3600_000, 'abandoned')];
  assert.equal(sprintsToday(sprints, NOW), 1);
});

test('a chain of sprints is counted for the break suggestion', () => {
  const sprints = [
    sprint(NOW - 100 * MINUTE),
    sprint(NOW - 70 * MINUTE),
    sprint(NOW - 35 * MINUTE),
  ];
  assert.equal(sprintsInARow(sprints, NOW), 3);
});

test('a long gap breaks the chain', () => {
  const sprints = [sprint(NOW - 5 * 3600_000), sprint(NOW - 30 * MINUTE)];
  assert.equal(sprintsInARow(sprints, NOW), 1);
});

test('week progress is capped so it never reads as failure', () => {
  const sprints = Array.from({ length: 9 }, (_, i) => sprint(NOW - i * 3600_000));
  const progress = weekProgress(sprints, NOW, 5);
  assert.equal(progress.done, 9);
  assert.equal(progress.target, 5);
  assert.equal(progress.fraction, 1);
});

test('records are personal bests across the whole history', () => {
  const sprints = [
    sprint(NOW - 30 * DAY, 'completed', 25),
    sprint(NOW - 30 * DAY + 3600_000, 'completed', 25),
    sprint(NOW - 2 * DAY, 'completed', 15),
    sprint(NOW - 3600_000, 'abandoned', 15),
  ];
  const records = personalRecords(sprints);
  assert.equal(records.totalSprints, 3);
  assert.equal(records.totalMinutes, 65);
  assert.equal(records.bestDay, 2);
  assert.equal(records.bestWeek, 2);
  assert.equal(records.subjectsTouched, 1);
});

test('a sprint served for under a minute still counts as a minute', () => {
  const short = sprint(NOW - 30_000);
  short.endedAt = short.startedAt + 40_000;
  assert.equal(personalRecords([short]).totalMinutes, 1);
});

test('records on an empty history are zeroes, not minus infinity', () => {
  const records = personalRecords([]);
  assert.equal(records.bestWeek, 0);
  assert.equal(records.bestDay, 0);
  assert.equal(records.totalSprints, 0);
});
