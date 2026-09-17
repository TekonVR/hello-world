/**
 * Spaced practice and per-topic confidence.
 *
 * Section 6.4 of the spec asks for a confidence score per topic and a schedule
 * that brings topics back at increasing intervals. This is a deliberately
 * simple Leitner-style ladder rather than SM-2: it has to be explainable to a
 * parent in one sentence, and there is no evidence a subtler curve helps a
 * fourteen year old revising for nine months.
 */

import { MS_PER_DAY } from './time';
import type { MoveOutcome, MoveResult, TopicState } from './types';

export const MAX_CONFIDENCE = 5;

/** Days until a topic is worth seeing again, indexed by confidence 0 to 5. */
export const INTERVAL_DAYS = [1, 1, 2, 4, 8, 16] as const;

export function emptyTopicState(topicId: string): TopicState {
  return {
    topicId,
    confidence: 0,
    seenCount: 0,
    lastSeenAt: null,
    dueAt: null,
    seenMoveIds: [],
  };
}

/** Solid counts 1, shaky a half, missed nothing. */
export function outcomeWeight(outcome: MoveOutcome): number {
  if (outcome === 'solid') return 1;
  if (outcome === 'shaky') return 0.5;
  return 0;
}

/** 0 to 1: how much of this sprint the student actually had. */
export function sprintAccuracy(results: MoveResult[]): number {
  if (results.length === 0) return 0;
  const earned = results.reduce((sum, result) => sum + outcomeWeight(result.outcome), 0);
  return earned / results.length;
}

/**
 * Move confidence by at most one step per sprint: up on a strong sprint, down
 * on a weak one, unchanged in the middle. Slow to rise, quick enough to fall
 * that a forgotten topic comes back.
 */
export function nextConfidence(current: number, accuracy: number): number {
  let next = current;
  if (accuracy >= 0.8) next = current + 1;
  else if (accuracy < 0.5) next = current - 1;
  return Math.max(0, Math.min(MAX_CONFIDENCE, next));
}

export function nextDueAt(confidence: number, now: number): number {
  const days = INTERVAL_DAYS[Math.max(0, Math.min(MAX_CONFIDENCE, confidence))];
  return now + days * MS_PER_DAY;
}

/** Apply one finished sprint to the topic it covered. */
export function applySprint(
  state: TopicState,
  results: MoveResult[],
  now: number,
): TopicState {
  const accuracy = sprintAccuracy(results);
  const confidence = nextConfidence(state.confidence, accuracy);
  const answeredIds = results.map((result) => result.moveId);
  return {
    ...state,
    confidence,
    seenCount: state.seenCount + 1,
    lastSeenAt: now,
    dueAt: nextDueAt(confidence, now),
    // Keep the tail only: enough to avoid repeating recent moves, not a log.
    seenMoveIds: [...state.seenMoveIds, ...answeredIds].slice(-60),
  };
}

/** Grey, amber or green tile on the subject map (section 6.5). */
export function topicStatus(state: TopicState | undefined): 'untouched' | 'shaky' | 'solid' {
  if (!state || state.seenCount === 0) return 'untouched';
  return state.confidence >= 4 ? 'solid' : 'shaky';
}
