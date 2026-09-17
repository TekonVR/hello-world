import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AUTHORED_MOVES,
  buildSprint,
  moveSource,
  movesForTopic,
  targetMoveCount,
  topicsForStudent,
} from '../src/content';
import { ALL_TOPICS, SUBJECTS, TOPIC_BY_ID, topicId } from '../src/content/catalogue';
import { frameworkMoves } from '../src/content/frameworks';
import { emptyTopicState } from '../src/engine/spacing';
import type { Topic } from '../src/engine/types';

function topic(id: string): Topic {
  const found = TOPIC_BY_ID[id];
  assert.ok(found, `missing topic ${id}`);
  return found;
}

test('every subject in the catalogue has topics and at least one board', () => {
  for (const subject of SUBJECTS) {
    assert.ok(subject.topicNames.length > 0, `${subject.id} has no topics`);
    assert.ok(subject.boards.length > 0, `${subject.id} has no boards`);
  }
});

test('topic ids are unique across the catalogue', () => {
  const ids = ALL_TOPICS.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every authored move points at a topic that exists and carries a spec reference', () => {
  for (const move of AUTHORED_MOVES) {
    assert.ok(TOPIC_BY_ID[move.topicId], `${move.id} points at unknown topic ${move.topicId}`);
    assert.ok(move.specRef.length > 0, `${move.id} has no spec reference`);
    assert.ok(move.seconds > 0, `${move.id} has no duration`);
  }
});

test('authored move ids are unique', () => {
  const ids = AUTHORED_MOVES.map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every multiple choice move has exactly one correct option and misconception distractors', () => {
  for (const move of AUTHORED_MOVES) {
    if (move.type !== 'mcq') continue;
    const correct = move.options.filter((option) => option.correct);
    assert.equal(correct.length, 1, `${move.id} should have one correct option`);
    for (const wrong of move.options.filter((o) => !o.correct)) {
      assert.ok(wrong.misconception, `${move.id} distractor "${wrong.text}" has no misconception`);
    }
  }
});

test('the pilot topics from section 15 are authored', () => {
  assert.equal(moveSource(topic(topicId('maths', 'Quadratic equations'))), 'authored');
  assert.equal(moveSource(topic(topicId('english-literature', 'Macbeth: key quotations'))), 'authored');
  assert.equal(moveSource(topic(topicId('combined-science', 'Forces'))), 'authored');
});

test('a depth 2 subject falls back to self-study frameworks', () => {
  const geography = topic(topicId('geography', 'Coastal landscapes'));
  assert.equal(moveSource(geography), 'framework');
  const moves = movesForTopic(geography);
  assert.ok(moves.length >= 6);
  assert.ok(moves[0].prompt.includes('Coastal landscapes'));
});

test('triple science borrows the combined science bank until its own is authored', () => {
  const triplePhysicsForces = topic(topicId('physics', 'Forces'));
  assert.equal(moveSource(triplePhysicsForces), 'authored');
  const moves = movesForTopic(triplePhysicsForces);
  assert.ok(moves.every((move) => move.topicId === 'combined-science.forces'));
});

test('sprint length decides how many moves are served', () => {
  assert.equal(targetMoveCount(10), 6);
  assert.equal(targetMoveCount(15), 8);
  assert.equal(targetMoveCount(20), 10);
  assert.equal(targetMoveCount(25), 12);
});

test('a sprint is between 6 and 12 moves and never repeats one', () => {
  const quadratics = topic(topicId('maths', 'Quadratic equations'));
  for (const minutes of [10, 15, 20, 25]) {
    const moves = buildSprint({ topic: quadratics, minutes, seed: 7 });
    assert.ok(moves.length >= 6, `${minutes} min sprint had ${moves.length} moves`);
    assert.ok(moves.length <= 12);
    assert.equal(new Set(moves.map((m) => m.id)).size, moves.length);
  }
});

test('a small bank still fills a short sprint to its move count', () => {
  const cells = topic(topicId('combined-science', 'Cell biology'));
  const pool = movesForTopic(cells);
  const moves = buildSprint({ topic: cells, minutes: 10, seed: 11 });
  assert.equal(moves.length, Math.min(targetMoveCount(10), pool.length));
});

test('the same move type never runs three deep', () => {
  const moves = buildSprint({ topic: topic(topicId('maths', 'Quadratic equations')), minutes: 25, seed: 3 });
  for (let i = 2; i < moves.length; i += 1) {
    const run = moves[i].type === moves[i - 1].type && moves[i].type === moves[i - 2].type;
    assert.equal(run, false, `three ${moves[i].type} moves in a row at index ${i}`);
  }
});

test('moves already seen are held back until the fresh ones run out', () => {
  const quadratics = topic(topicId('maths', 'Quadratic equations'));
  const all = movesForTopic(quadratics);
  const seen = all.slice(0, 6).map((move) => move.id);
  const state = { ...emptyTopicState(quadratics.id), seenMoveIds: seen };

  const moves = buildSprint({ topic: quadratics, minutes: 10, state, seed: 5 });
  assert.ok(moves.every((move) => !seen.includes(move.id)));
});

test('building the same sprint twice with the same seed gives the same moves', () => {
  const quadratics = topic(topicId('maths', 'Quadratic equations'));
  const first = buildSprint({ topic: quadratics, minutes: 15, seed: 42 }).map((m) => m.id);
  const second = buildSprint({ topic: quadratics, minutes: 15, seed: 42 }).map((m) => m.id);
  assert.deepEqual(first, second);
});

test('a Higher tier student is not shown Foundation-only topics and vice versa', () => {
  const higher = topicsForStudent([{ subjectId: 'maths', board: 'AQA', tier: 'Higher' }]);
  const foundation = topicsForStudent([{ subjectId: 'maths', board: 'AQA', tier: 'Foundation' }]);

  assert.ok(higher.some((t) => t.name === 'Circle theorems'));
  assert.ok(!foundation.some((t) => t.name === 'Circle theorems'));
  assert.ok(foundation.some((t) => t.name === 'Quadratic equations'));
});

test('English Literature topics follow the set texts the student is sitting', () => {
  const topics = topicsForStudent([
    { subjectId: 'english-literature', board: 'AQA', setTextIds: ['macbeth'] },
  ]);
  assert.ok(topics.length > 0);
  assert.ok(topics.every((t) => t.setTextId === 'macbeth'));
});

test('no set texts chosen yet shows the whole subject rather than nothing', () => {
  const topics = topicsForStudent([{ subjectId: 'english-literature', board: 'AQA' }]);
  assert.ok(topics.length > 4);
});

test('framework moves start with retrieval, not with reading the notes', () => {
  const moves = frameworkMoves(topic(topicId('history', 'Medicine through time')));
  assert.equal(moves[0].type, 'brainDump');
  assert.ok(moves[1].prompt.toLowerCase().includes('notes'));
});
