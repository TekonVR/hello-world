/**
 * Turning a finished sprint into the one screen the student sees afterwards
 * (section 6.3): what was covered, what was solid, what to revisit, and one
 * line on what is next.
 */

import { sprintAccuracy } from './spacing';
import type { Move, MoveResult, Sprint } from './types';

export interface SprintSummary {
  subjectName: string;
  topicName: string;
  minutesServed: number;
  status: Sprint['status'];
  movesAnswered: number;
  movesPlanned: number;
  accuracy: number;
  solid: string[];
  revisit: string[];
  confidenceBefore: number;
  confidenceAfter: number;
  nextLine: string;
}

/** A short label for a move, used in the solid and revisit lists. */
export function moveLabel(move: Move): string {
  const stripped = move.prompt.replace(/\s+/g, ' ').trim();
  if (stripped.length <= 64) return stripped;
  return `${stripped.slice(0, 61)}...`;
}

export function summariseSprint(options: {
  sprint: Sprint;
  moves: Move[];
  subjectName: string;
  topicName: string;
  confidenceBefore: number;
  confidenceAfter: number;
  nextLine: string;
}): SprintSummary {
  const { sprint, moves, confidenceBefore, confidenceAfter } = options;
  const byId = new Map(moves.map((move) => [move.id, move]));
  const labelFor = (result: MoveResult) => {
    const move = byId.get(result.moveId);
    return move ? moveLabel(move) : 'Question';
  };

  return {
    subjectName: options.subjectName,
    topicName: options.topicName,
    minutesServed: Math.max(
      0,
      Math.round(((sprint.endedAt ?? sprint.startedAt) - sprint.startedAt) / 60_000),
    ),
    status: sprint.status,
    movesAnswered: sprint.results.length,
    movesPlanned: sprint.moveIds.length,
    accuracy: sprintAccuracy(sprint.results),
    solid: sprint.results.filter((r) => r.outcome === 'solid').map(labelFor),
    revisit: sprint.results.filter((r) => r.outcome !== 'solid').map(labelFor),
    confidenceBefore,
    confidenceAfter,
    nextLine: options.nextLine,
  };
}

/**
 * The break line. The app never times the break (section 6.3), and after three
 * sprints in a row it suggests a longer one.
 */
export function breakSuggestion(sprintsInARow: number): string {
  if (sprintsInARow >= 3) {
    return 'Three in a row. Take a proper break: twenty minutes, away from the desk.';
  }
  const suggestions = [
    'Get a drink of water.',
    'Stand up and move for a few minutes.',
    'Look out of a window, not at a screen.',
    'Stretch. Do not open social media, it will eat the next hour.',
  ];
  return suggestions[sprintsInARow % suggestions.length];
}
