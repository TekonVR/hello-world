/**
 * The content API: everything the app asks for when it builds a sprint.
 *
 * A topic is served from its authored bank where one exists, and from the
 * depth 2 frameworks where it does not. The distinction is surfaced to the
 * student rather than hidden, because the spec's promise is that every subject
 * is covered at launch and that authored content is coming.
 */

import type { Move, Topic, TopicState, StudentSubject } from '../engine/types';
import { ALL_TOPICS, SUBJECT_BY_ID, TOPIC_BY_ID } from './catalogue';
import { frameworkMoves } from './frameworks';
import { MATHS_MOVES } from './banks/maths';
import { ENGLISH_LITERATURE_MOVES } from './banks/englishLiterature';
import { ENGLISH_LANGUAGE_MOVES } from './banks/englishLanguage';
import { SCIENCE_MOVES } from './banks/science';

export const AUTHORED_MOVES: Move[] = [
  ...MATHS_MOVES,
  ...ENGLISH_LITERATURE_MOVES,
  ...ENGLISH_LANGUAGE_MOVES,
  ...SCIENCE_MOVES,
];

const BY_TOPIC = new Map<string, Move[]>();
for (const move of AUTHORED_MOVES) {
  const existing = BY_TOPIC.get(move.topicId);
  if (existing) existing.push(move);
  else BY_TOPIC.set(move.topicId, [move]);
}

/**
 * Triple science students sit the same content as combined science students
 * for the shared topics, so the triple subjects borrow the combined banks
 * until their own are authored.
 */
const SHARED_SCIENCE: Record<string, string> = {
  biology: 'combined-science',
  chemistry: 'combined-science',
  physics: 'combined-science',
};

function bankTopicId(topic: Topic): string {
  const shared = SHARED_SCIENCE[topic.subjectId];
  if (!shared) return topic.id;
  return topic.id.replace(`${topic.subjectId}.`, `${shared}.`);
}

export type MoveSource = 'authored' | 'framework';

export function moveSource(topic: Topic): MoveSource {
  return BY_TOPIC.has(bankTopicId(topic)) ? 'authored' : 'framework';
}

export function movesForTopic(topic: Topic): Move[] {
  return BY_TOPIC.get(bankTopicId(topic)) ?? frameworkMoves(topic);
}

export function moveById(id: string): Move | undefined {
  return AUTHORED_MOVES.find((move) => move.id === id);
}

/** Sprint length to the number of moves the spec asks for: 6 to 12. */
export function targetMoveCount(minutes: number): number {
  const byLength: Record<number, number> = { 10: 6, 15: 8, 20: 10, 25: 12 };
  return byLength[minutes] ?? Math.max(6, Math.min(12, Math.round(minutes * 0.5)));
}

/** Small deterministic generator so a sprint can be rebuilt and tested. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export interface BuildSprintOptions {
  topic: Topic;
  minutes: number;
  state?: TopicState;
  seed?: number;
}

/**
 * Pick the moves for one sprint.
 *
 * Unseen moves come first so a student is not re-answering last night's
 * questions, and the same move type never runs three deep: variety inside the
 * sprint is what stops it feeling like a quiz app.
 */
export function buildSprint(options: BuildSprintOptions): Move[] {
  const { topic, minutes, state } = options;
  const random = seededRandom(options.seed ?? 1);
  const pool = movesForTopic(topic);
  if (pool.length === 0) return [];

  const seen = new Set(state?.seenMoveIds ?? []);
  const fresh = shuffle(pool.filter((move) => !seen.has(move.id)), random);
  const repeats = shuffle(pool.filter((move) => seen.has(move.id)), random);
  const ordered = [...fresh, ...repeats];

  const wanted = Math.min(targetMoveCount(minutes), pool.length);
  const budgetSeconds = minutes * 60 * 0.9;

  const chosen: Move[] = [];
  let spent = 0;
  let guard = 0;
  // Fixed bound: `ordered` shrinks as moves are taken, so it cannot be the limit.
  const maxIterations = pool.length * 3;

  while (chosen.length < wanted && ordered.length > 0 && guard < maxIterations) {
    guard += 1;
    const index = ordered.findIndex((move) => {
      const lastTwo = chosen.slice(-2);
      const sameTypeRun = lastTwo.length === 2 && lastTwo.every((m) => m.type === move.type);
      return !sameTypeRun;
    });
    const pick = index === -1 ? ordered[0] : ordered[index];
    ordered.splice(index === -1 ? 0 : index, 1);
    chosen.push(pick);
    spent += pick.seconds;
    // Stop early rather than hand a student more than the sprint can hold.
    if (spent >= budgetSeconds && chosen.length >= 6) break;
  }

  return chosen;
}

/**
 * Rebuild the moves of a sprint from the ids stored against it. Authored moves
 * come from the bank; framework moves are regenerated, which is why their ids
 * are derived from the topic rather than random.
 */
export function resolveMoves(topicId: string, moveIds: string[]): Move[] {
  const topic = TOPIC_BY_ID[topicId];
  if (!topic) return [];
  const pool = new Map(movesForTopic(topic).map((move) => [move.id, move]));
  return moveIds.map((id) => pool.get(id)).filter((move): move is Move => Boolean(move));
}

/** The topics a student is actually studying, filtered by tier and set texts. */
export function topicsForStudent(subjects: StudentSubject[]): Topic[] {
  return ALL_TOPICS.filter((topic) => {
    const chosen = subjects.find((subject) => subject.subjectId === topic.subjectId);
    if (!chosen) return false;
    if (topic.tier && chosen.tier && topic.tier !== chosen.tier) return false;
    if (topic.setTextId) {
      const texts = chosen.setTextIds ?? [];
      // No set texts chosen yet: show them all rather than an empty subject.
      if (texts.length > 0 && !texts.includes(topic.setTextId)) return false;
    }
    return true;
  });
}

export function subjectDepth(subjectId: string): 1 | 2 {
  return SUBJECT_BY_ID[subjectId]?.depth ?? 2;
}

export { ALL_TOPICS, TOPIC_BY_ID, SUBJECT_BY_ID };
