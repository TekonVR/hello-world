import assert from 'node:assert/strict';
import test from 'node:test';

import {
  chooseSprints,
  nextKeyDate,
  preferredMinutes,
  rankTopics,
  reasonFor,
  urgencyScore,
  weaknessScore,
  overdueScore,
} from '../src/engine/select';
import { emptyTopicState } from '../src/engine/spacing';
import { MS_PER_DAY } from '../src/engine/time';
import type { Sprint, StudentProfile, Topic, TopicState } from '../src/engine/types';

const NOW = new Date('2026-09-17T19:00:00Z').getTime();

const TOPICS: Topic[] = [
  { id: 'physics.forces', subjectId: 'physics', name: 'Forces', specRef: 'Physics · Forces' },
  { id: 'physics.waves', subjectId: 'physics', name: 'Waves', specRef: 'Physics · Waves' },
  { id: 'maths.quadratics', subjectId: 'maths', name: 'Quadratic equations', specRef: 'Maths · Quadratics' },
  { id: 'history.medicine', subjectId: 'history', name: 'Medicine through time', specRef: 'History · Medicine' },
];

const SUBJECT_NAMES = { physics: 'Physics', maths: 'Maths', history: 'History' };

function profile(overrides: Partial<StudentProfile> = {}): StudentProfile {
  return {
    yearGroup: 11,
    subjects: [
      { subjectId: 'physics', board: 'AQA' },
      { subjectId: 'maths', board: 'AQA', tier: 'Higher' },
      { subjectId: 'history', board: 'Edexcel' },
    ],
    keyDates: [],
    notificationTime: '17:30',
    defaultMinutes: 15,
    weeklyTarget: 5,
    parentSummaryOptIn: false,
    parentEmail: null,
    ...overrides,
  };
}

function sprint(subjectId: string, topicId: string, overrides: Partial<Sprint> = {}): Sprint {
  return {
    id: `s-${topicId}-${overrides.startedAt ?? 0}`,
    subjectId,
    topicId,
    plannedMinutes: 15,
    startedAt: NOW - MS_PER_DAY,
    endedAt: NOW - MS_PER_DAY + 15 * 60_000,
    status: 'completed',
    moveIds: [],
    results: [],
    ...overrides,
  };
}

function input(overrides: Partial<Parameters<typeof rankTopics>[0]> = {}) {
  return {
    profile: profile(),
    topics: TOPICS,
    topicStates: {} as Record<string, TopicState>,
    subjectNames: SUBJECT_NAMES,
    sprints: [] as Sprint[],
    now: NOW,
    ...overrides,
  };
}

test('an exam next week outranks one next term', () => {
  const soon = urgencyScore({ kind: 'exam', days: 7 });
  const later = urgencyScore({ kind: 'exam', days: 80 });
  assert.ok(soon > later);
  assert.ok(urgencyScore(null) < later + 0.2);
});

test('a mock counts for slightly less than the real exam', () => {
  assert.ok(urgencyScore({ kind: 'mock', days: 10 }) < urgencyScore({ kind: 'exam', days: 10 }));
});

test('weakness is highest for a topic the student keeps failing', () => {
  const failing = { ...emptyTopicState('t'), seenCount: 3, confidence: 0 };
  const solid = { ...emptyTopicState('t'), seenCount: 3, confidence: 5 };
  assert.equal(weaknessScore(failing), 1);
  assert.equal(weaknessScore(solid), 0);
  // Untouched sits high, but below a topic that is actively going wrong.
  assert.ok(weaknessScore(undefined) < weaknessScore(failing));
});

test('a topic is not overdue before its interval has passed', () => {
  const notDue = { ...emptyTopicState('t'), seenCount: 1, dueAt: NOW + 2 * MS_PER_DAY };
  const overdue = { ...emptyTopicState('t'), seenCount: 1, dueAt: NOW - 4 * MS_PER_DAY };
  assert.equal(overdueScore(notDue, NOW), 0);
  assert.equal(overdueScore(overdue, NOW), 1);
});

test('the nearest upcoming key date wins and past dates are ignored', () => {
  const dates = [
    { subjectId: 'physics', kind: 'exam' as const, date: '2027-05-20' },
    { subjectId: 'physics', kind: 'mock' as const, date: '2026-09-29' },
    { subjectId: 'physics', kind: 'mock' as const, date: '2026-01-10' },
  ];
  const next = nextKeyDate(dates, 'physics', NOW);
  assert.equal(next?.date, '2026-09-29');
  assert.equal(next?.days, 12);
  assert.equal(nextKeyDate(dates, 'maths', NOW), null);
});

test('an imminent mock pulls that subject to the top', () => {
  const ranked = rankTopics(
    input({
      profile: profile({ keyDates: [{ subjectId: 'physics', kind: 'mock', date: '2026-09-29' }] }),
    }),
  );
  assert.equal(ranked[0].subjectId, 'physics');
});

test('the reason line is the spec example, near enough word for word', () => {
  const reason = reasonFor({
    subjectName: 'Physics',
    topicName: 'Forces',
    state: undefined,
    keyDate: { subjectId: 'physics', kind: 'mock', date: '2026-09-29', days: 12 },
    now: NOW,
  });
  assert.equal(reason, 'Your Physics mock is in 12 days and you have not touched Forces yet.');
});

test('the reason line names the gap when there is no exam date', () => {
  const state = { ...emptyTopicState('t'), seenCount: 2, confidence: 4, lastSeenAt: NOW - 5 * MS_PER_DAY };
  const reason = reasonFor({ subjectName: 'Maths', topicName: 'Quadratic equations', state, keyDate: null, now: NOW });
  assert.equal(reason, 'You last did Quadratic equations 5 days ago. Time to see if it stuck.');
});

test('the same subject is not served three sprints in a row', () => {
  const ranked = rankTopics(
    input({
      sprints: [
        sprint('physics', 'physics.forces', { startedAt: NOW - 3 * 3600_000 }),
        sprint('physics', 'physics.waves', { startedAt: NOW - 2 * 3600_000 }),
      ],
    }),
  );
  assert.notEqual(ranked[0].subjectId, 'physics');
});

test('an imminent exam overrides the variety rule', () => {
  const ranked = rankTopics(
    input({
      profile: profile({ keyDates: [{ subjectId: 'physics', kind: 'exam', date: '2026-09-21' }] }),
      sprints: [
        sprint('physics', 'physics.forces', { startedAt: NOW - 3 * 3600_000 }),
        sprint('physics', 'physics.waves', { startedAt: NOW - 2 * 3600_000 }),
      ],
    }),
  );
  assert.equal(ranked[0].subjectId, 'physics');
});

test('the topic just finished is not immediately offered again', () => {
  const justDone = {
    ...emptyTopicState('maths.quadratics'),
    seenCount: 1,
    confidence: 3,
    lastSeenAt: NOW - 10 * 60_000,
    dueAt: NOW + 4 * MS_PER_DAY,
  };
  const ranked = rankTopics(
    input({
      topicStates: { 'maths.quadratics': justDone },
      sprints: [sprint('maths', 'maths.quadratics', { startedAt: NOW - 20 * 60_000 })],
    }),
  );
  assert.notEqual(ranked[0].topicId, 'maths.quadratics');
});

test('the home screen gets three suggestions from three different subjects', () => {
  const picks = chooseSprints(input());
  assert.equal(picks.length, 3);
  assert.equal(new Set(picks.map((p) => p.subjectId)).size, 3);
});

test('suggestions still fill up when the student has fewer subjects than slots', () => {
  const picks = chooseSprints(
    input({
      profile: profile({ subjects: [{ subjectId: 'physics', board: 'AQA' }] }),
      topics: TOPICS.filter((t) => t.subjectId === 'physics'),
    }),
  );
  assert.equal(picks.length, 2);
  assert.equal(new Set(picks.map((p) => p.topicId)).size, 2);
});

test('sprint length follows what the student actually finishes', () => {
  const history: Sprint[] = [
    sprint('maths', 'maths.quadratics', { plannedMinutes: 25, status: 'abandoned' }),
    sprint('maths', 'maths.quadratics', { plannedMinutes: 25, status: 'abandoned' }),
    sprint('physics', 'physics.forces', { plannedMinutes: 10, status: 'completed' }),
    sprint('physics', 'physics.waves', { plannedMinutes: 10, status: 'completed' }),
  ];
  assert.equal(preferredMinutes(history, 15), 10);
});

test('sprint length falls back to the default until there is evidence', () => {
  assert.equal(preferredMinutes([], 15), 15);
  assert.equal(preferredMinutes([sprint('maths', 'maths.quadratics', { plannedMinutes: 10 })], 15), 15);
});
