import assert from 'node:assert/strict';
import test from 'node:test';

import {
  INTERVAL_DAYS,
  applySprint,
  emptyTopicState,
  nextConfidence,
  nextDueAt,
  sprintAccuracy,
  topicStatus,
} from '../src/engine/spacing';
import { MS_PER_DAY } from '../src/engine/time';
import type { MoveResult } from '../src/engine/types';

const NOW = new Date('2026-09-17T19:00:00Z').getTime();

function results(outcomes: Array<MoveResult['outcome']>): MoveResult[] {
  return outcomes.map((outcome, index) => ({
    moveId: `m${index}`,
    type: 'recall' as const,
    outcome,
    answeredAt: NOW,
  }));
}

test('accuracy counts a shaky answer as half', () => {
  assert.equal(sprintAccuracy(results(['solid', 'solid'])), 1);
  assert.equal(sprintAccuracy(results(['solid', 'missed'])), 0.5);
  assert.equal(sprintAccuracy(results(['shaky', 'shaky'])), 0.5);
  assert.equal(sprintAccuracy([]), 0);
});

test('confidence moves at most one step per sprint', () => {
  assert.equal(nextConfidence(2, 1), 3);
  assert.equal(nextConfidence(2, 0.6), 2);
  assert.equal(nextConfidence(2, 0.2), 1);
});

test('confidence is clamped to the 0 to 5 ladder', () => {
  assert.equal(nextConfidence(5, 1), 5);
  assert.equal(nextConfidence(0, 0), 0);
});

test('intervals get longer as confidence grows', () => {
  for (let i = 1; i < INTERVAL_DAYS.length; i += 1) {
    assert.ok(INTERVAL_DAYS[i] >= INTERVAL_DAYS[i - 1]);
  }
  assert.equal(nextDueAt(4, NOW), NOW + 8 * MS_PER_DAY);
});

test('a strong sprint raises confidence and pushes the topic further out', () => {
  const before = emptyTopicState('maths.quadratic-equations');
  const after = applySprint(before, results(['solid', 'solid', 'solid', 'shaky']), NOW);

  assert.equal(after.confidence, 1);
  assert.equal(after.seenCount, 1);
  assert.equal(after.lastSeenAt, NOW);
  assert.equal(after.dueAt, NOW + INTERVAL_DAYS[1] * MS_PER_DAY);
  assert.deepEqual(after.seenMoveIds, ['m0', 'm1', 'm2', 'm3']);
});

test('a weak sprint drops confidence so the topic comes back sooner', () => {
  const start = { ...emptyTopicState('t'), confidence: 4, seenCount: 3 };
  const after = applySprint(start, results(['missed', 'missed', 'shaky']), NOW);

  assert.equal(after.confidence, 3);
  assert.equal(after.dueAt, NOW + INTERVAL_DAYS[3] * MS_PER_DAY);
});

test('seen move ids are capped so the record does not grow without limit', () => {
  let state = emptyTopicState('t');
  for (let i = 0; i < 20; i += 1) {
    state = applySprint(state, results(['solid', 'solid', 'solid', 'solid', 'solid']), NOW);
  }
  assert.equal(state.seenMoveIds.length, 60);
});

test('subject map colours follow confidence', () => {
  assert.equal(topicStatus(undefined), 'untouched');
  assert.equal(topicStatus(emptyTopicState('t')), 'untouched');
  assert.equal(topicStatus({ ...emptyTopicState('t'), seenCount: 1, confidence: 2 }), 'shaky');
  assert.equal(topicStatus({ ...emptyTopicState('t'), seenCount: 5, confidence: 4 }), 'solid');
});
