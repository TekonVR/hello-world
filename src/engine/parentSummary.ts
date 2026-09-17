/**
 * The weekly parent summary (section 8, MVP row).
 *
 * Section 11 draws the line this file has to respect: the parent sees that
 * revision is happening and roughly where, never what their child got wrong.
 * No scores, no confidence numbers, no topic-level detail, and the student
 * turns it on rather than the parent.
 *
 * Sending it needs a backend. This builds the exact text that would be sent,
 * which is also what the student is shown before they opt in.
 */

import { toDayKey, weekStartKey } from './time';
import { sprintsInWeek } from './streak';
import type { Sprint, StudentProfile } from './types';

export interface ParentSummary {
  weekStart: string;
  sprintsDone: number;
  minutes: number;
  subjectsCovered: string[];
  suggestion: string;
  body: string;
}

function listOut(items: string[]): string {
  if (items.length === 0) return 'nothing yet';
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export function buildParentSummary(options: {
  sprints: Sprint[];
  profile: StudentProfile;
  subjectName: (subjectId: string) => string;
  now: number;
}): ParentSummary {
  const { sprints, profile, subjectName, now } = options;
  const weekStart = weekStartKey(now);
  const thisWeek = sprints.filter(
    (sprint) => sprint.status === 'completed' && weekStartKey(sprint.startedAt) === weekStart,
  );

  const minutes = thisWeek.reduce(
    (total, sprint) => total + Math.round(((sprint.endedAt ?? sprint.startedAt) - sprint.startedAt) / 60_000),
    0,
  );
  const covered = [...new Set(thisWeek.map((sprint) => sprint.subjectId))].map(subjectName);
  const done = sprintsInWeek(sprints, now);

  // One suggestion, and never a telling off: the subject with no sprints this
  // week is the useful thing to mention, otherwise say what is going well.
  const untouched = profile.subjects
    .map((subject) => subject.subjectId)
    .filter((id) => !thisWeek.some((sprint) => sprint.subjectId === id))
    .map(subjectName);

  const suggestion =
    done === 0
      ? 'Nothing this week. A good opening question is "what is the next thing you have to revise?" rather than "have you revised?".'
      : untouched.length > 0
        ? `${untouched[0]} has not come up this week. Worth asking about, without making it a row.`
        : `Every subject has had a turn this week. Saying you noticed is worth more than you would think.`;

  const body = [
    `This week your child did ${done} sprint${done === 1 ? '' : 's'} on Lock In, ${minutes} minutes in total.`,
    `Subjects covered: ${listOut(covered)}.`,
    suggestion,
  ].join('\n\n');

  return {
    weekStart,
    sprintsDone: done,
    minutes,
    subjectsCovered: covered,
    suggestion,
    body,
  };
}

/** The Monday the next summary would go out. */
export function nextSummaryDate(now: number): string {
  const start = weekStartKey(now);
  const [year, month, day] = start.split('-').map(Number);
  const next = new Date(year, month - 1, day + 7);
  return toDayKey(next);
}
