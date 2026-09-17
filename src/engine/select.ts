/**
 * The sequencing engine (section 6.4).
 *
 * It answers one question: what should this student do in the next fifteen
 * minutes? It weights four things, in the order the spec sets out, and it is
 * rule-based on purpose so that the reason line under the home card is the
 * literal truth about why a sprint was chosen.
 */

import { MS_PER_DAY, daysUntil, describeDays } from './time';
import { MAX_CONFIDENCE } from './spacing';
import type {
  KeyDate,
  Sprint,
  SprintSuggestion,
  StudentProfile,
  Topic,
  TopicState,
} from './types';

export const WEIGHTS = {
  urgency: 0.35,
  weakness: 0.3,
  overdue: 0.25,
  freshness: 0.1,
} as const;

/** A sprint on the same subject twice running is allowed; three is not. */
const REPEAT_WINDOW = 2;
const REPEAT_PENALTY = 0.45;
const SAME_TOPIC_PENALTY = 0.3;
/** "Unless an exam is imminent" (section 6.4). */
const IMMINENT_DAYS = 7;

export interface SelectionInput {
  profile: StudentProfile;
  /** Topics already filtered to the student's subjects, boards, tiers and set texts. */
  topics: Topic[];
  topicStates: Record<string, TopicState>;
  /** Subject id to display name, for the reason line. */
  subjectNames: Record<string, string>;
  /** Finished sprints, oldest first. */
  sprints: Sprint[];
  now: number;
}

export function nextKeyDate(
  keyDates: KeyDate[],
  subjectId: string,
  now: number,
): (KeyDate & { days: number }) | null {
  const upcoming = keyDates
    .filter((date) => date.subjectId === subjectId)
    .map((date) => ({ ...date, days: daysUntil(date.date, now) }))
    .filter((date) => date.days >= 0)
    .sort((a, b) => a.days - b.days);
  return upcoming[0] ?? null;
}

/** 0 to 1. An exam three months out barely registers; one next week dominates. */
export function urgencyScore(keyDate: { kind: string; days: number } | null): number {
  if (!keyDate) return 0.15;
  const proximity = Math.max(0, 1 - keyDate.days / 90);
  return keyDate.kind === 'exam' ? proximity : proximity * 0.9;
}

/** 0 to 1, highest for a topic the student keeps getting wrong. */
export function weaknessScore(state: TopicState | undefined): number {
  if (!state || state.seenCount === 0) return 0.85; // untouched, but not yet failing
  return (MAX_CONFIDENCE - state.confidence) / MAX_CONFIDENCE;
}

/** 0 to 1 by how far past its spacing interval a topic is. */
export function overdueScore(state: TopicState | undefined, now: number): number {
  if (!state || state.dueAt === null) return 0.5;
  const overdueDays = (now - state.dueAt) / MS_PER_DAY;
  if (overdueDays < 0) return 0; // not due yet
  return Math.min(1, overdueDays / 4);
}

/** Penalises anything seen in the last few hours, so a sprint is not a re-run. */
export function freshnessScore(state: TopicState | undefined, now: number): number {
  if (!state || state.lastSeenAt === null) return 1;
  const days = (now - state.lastSeenAt) / MS_PER_DAY;
  if (days < 0.25) return 0;
  return Math.min(1, days / 7);
}

function varietyMultiplier(
  topic: Topic,
  sprints: Sprint[],
  keyDate: { days: number } | null,
): number {
  const recent = sprints.slice(-REPEAT_WINDOW);
  if (recent.length === 0) return 1;

  const imminent = keyDate !== null && keyDate.days <= IMMINENT_DAYS;
  let multiplier = 1;

  const lastTopic = recent[recent.length - 1]?.topicId;
  if (lastTopic === topic.id) multiplier *= SAME_TOPIC_PENALTY;

  const sameSubjectRun = recent.every((sprint) => sprint.subjectId === topic.subjectId);
  if (sameSubjectRun && recent.length >= REPEAT_WINDOW && !imminent) {
    multiplier *= REPEAT_PENALTY;
  }
  return multiplier;
}

export function reasonFor(options: {
  subjectName: string;
  topicName: string;
  state: TopicState | undefined;
  keyDate: (KeyDate & { days: number }) | null;
  now: number;
}): string {
  const { subjectName, topicName, state, keyDate } = options;
  const untouched = !state || state.seenCount === 0;
  const shaky = !untouched && state!.confidence <= 2;
  const daysSince =
    state?.lastSeenAt != null ? Math.floor((options.now - state.lastSeenAt) / MS_PER_DAY) : null;

  if (keyDate && keyDate.days <= 45) {
    const when = describeDays(keyDate.days);
    if (untouched) return `Your ${subjectName} ${keyDate.kind} is ${when} and you have not touched ${topicName} yet.`;
    if (shaky) return `Your ${subjectName} ${keyDate.kind} is ${when} and ${topicName} is still shaky.`;
    return `Your ${subjectName} ${keyDate.kind} is ${when}. Keeping ${topicName} sharp.`;
  }
  if (untouched) return `You have not touched ${topicName} yet.`;
  if (shaky) return `${topicName} did not stick last time. Worth another go.`;
  if (daysSince !== null && daysSince >= 3) {
    return `You last did ${topicName} ${daysSince} days ago. Time to see if it stuck.`;
  }
  return `Keeping ${subjectName} ticking over.`;
}

/**
 * Which sprint length this student actually finishes. The spec is explicit
 * that the interval is a default and not a rule, so this only changes what is
 * suggested first.
 */
export function preferredMinutes(sprints: Sprint[], fallback: number): number {
  const recent = sprints.slice(-10);
  if (recent.length < 4) return fallback;

  const tally = new Map<number, { done: number; total: number }>();
  for (const sprint of recent) {
    const entry = tally.get(sprint.plannedMinutes) ?? { done: 0, total: 0 };
    entry.total += 1;
    if (sprint.status === 'completed') entry.done += 1;
    tally.set(sprint.plannedMinutes, entry);
  }

  let best = fallback;
  let bestRate = -1;
  for (const [minutes, entry] of tally) {
    if (entry.total < 2) continue;
    const rate = entry.done / entry.total;
    // Ties go to the longer sprint: more revision for the same commitment.
    if (rate > bestRate || (rate === bestRate && minutes > best)) {
      bestRate = rate;
      best = minutes;
    }
  }
  return best;
}

/** Every candidate topic, best first. */
export function rankTopics(input: SelectionInput): SprintSuggestion[] {
  const { profile, topics, topicStates, subjectNames, sprints, now } = input;
  const minutes = preferredMinutes(sprints, profile.defaultMinutes);

  return topics
    .map((topic) => {
      const state = topicStates[topic.id];
      const keyDate = nextKeyDate(profile.keyDates, topic.subjectId, now);
      const base =
        WEIGHTS.urgency * urgencyScore(keyDate) +
        WEIGHTS.weakness * weaknessScore(state) +
        WEIGHTS.overdue * overdueScore(state, now) +
        WEIGHTS.freshness * freshnessScore(state, now);
      const score = base * varietyMultiplier(topic, sprints, keyDate);

      return {
        subjectId: topic.subjectId,
        topicId: topic.id,
        minutes,
        score,
        reason: reasonFor({
          subjectName: subjectNames[topic.subjectId] ?? topic.subjectId,
          topicName: topic.name,
          state,
          keyDate,
          now,
        }),
      };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * The home screen shows one card and a swipe reveals two alternatives, so the
 * engine returns three, each from a different subject where it can: offering
 * three flavours of the same subject is not a choice.
 */
export function chooseSprints(input: SelectionInput, count = 3): SprintSuggestion[] {
  const ranked = rankTopics(input);
  const picked: SprintSuggestion[] = [];
  const usedSubjects = new Set<string>();

  for (const candidate of ranked) {
    if (picked.length >= count) break;
    if (usedSubjects.has(candidate.subjectId)) continue;
    picked.push(candidate);
    usedSubjects.add(candidate.subjectId);
  }
  // Fewer subjects than slots: fill up with the next best whatever they are.
  for (const candidate of ranked) {
    if (picked.length >= count) break;
    if (picked.some((p) => p.topicId === candidate.topicId)) continue;
    picked.push(candidate);
  }
  return picked;
}
