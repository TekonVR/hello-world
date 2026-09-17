import assert from 'node:assert/strict';
import test from 'node:test';

import { buildParentSummary, nextSummaryDate } from '../src/engine/parentSummary';
import type { Sprint, StudentProfile } from '../src/engine/types';

const NOW = new Date(2026, 8, 17, 19, 0, 0).getTime(); // Thursday
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

const NAMES: Record<string, string> = {
  maths: 'Maths',
  physics: 'Physics',
  history: 'History',
};

const profile: StudentProfile = {
  yearGroup: 11,
  subjects: [
    { subjectId: 'maths', board: 'AQA' },
    { subjectId: 'physics', board: 'AQA' },
    { subjectId: 'history', board: 'Edexcel' },
  ],
  keyDates: [],
  notificationTime: '17:30',
  defaultMinutes: 15,
  weeklyTarget: 5,
  parentSummaryOptIn: true,
  parentEmail: 'parent@example.com',
};

function sprint(subjectId: string, startedAt: number, status: Sprint['status'] = 'completed'): Sprint {
  return {
    id: `s${subjectId}${startedAt}`,
    subjectId,
    topicId: `${subjectId}.topic`,
    plannedMinutes: 15,
    startedAt,
    endedAt: startedAt + 15 * MINUTE,
    status,
    moveIds: [],
    results: [],
  };
}

const build = (sprints: Sprint[]) =>
  buildParentSummary({ sprints, profile, subjectName: (id) => NAMES[id] ?? id, now: NOW });

test('the summary counts this week only', () => {
  const summary = build([
    sprint('maths', NOW - DAY),
    sprint('physics', NOW - 2 * DAY),
    sprint('maths', NOW - 9 * DAY), // last week
  ]);
  assert.equal(summary.sprintsDone, 2);
  assert.equal(summary.minutes, 30);
  assert.deepEqual(summary.subjectsCovered.sort(), ['Maths', 'Physics']);
});

test('an abandoned sprint is not reported to a parent as work done', () => {
  const summary = build([sprint('maths', NOW - DAY, 'abandoned')]);
  assert.equal(summary.sprintsDone, 0);
});

test('the suggestion names a subject that has not come up', () => {
  const summary = build([sprint('maths', NOW - DAY), sprint('physics', NOW - 2 * DAY)]);
  assert.match(summary.suggestion, /History/);
});

test('a quiet week opens a conversation rather than an accusation', () => {
  const summary = build([]);
  assert.match(summary.body, /0 sprints/);
  assert.doesNotMatch(summary.body, /should|must|failed|behind/i);
});

test('the summary never carries scores, topics or confidence', () => {
  const summary = build([sprint('maths', NOW - DAY), sprint('history', NOW - 2 * DAY)]);
  assert.doesNotMatch(summary.body, /confidence|score|wrong|topic/i);
});

test('one sprint reads as one sprint', () => {
  const summary = build([sprint('maths', NOW - DAY)]);
  assert.match(summary.body, /did 1 sprint on Lock In/);
});

test('the next summary goes out on the following Monday', () => {
  assert.equal(nextSummaryDate(NOW), '2026-09-21');
});
