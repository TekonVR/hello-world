/**
 * The sprint (section 6.2).
 *
 * A visible countdown, no pause button, and a run of 6 to 12 moves. Leaving
 * the app for more than 30 seconds marks the sprint incomplete but keeps
 * everything answered: the only consequence is that it does not count towards
 * the week.
 *
 * On the web, "leaving the app" means hiding the tab, which is the honest
 * equivalent and is what a student on a laptop actually does.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { resolveMoves } from '../../content';
import { subjectName } from '../../content/catalogue';
import { formatClock } from '../../engine/time';
import type { MoveOutcome } from '../../engine/types';
import { useStore, useTracker } from '../../state/store';
import { MoveCard } from '../MoveCard';
import { Button, Track } from '../components';
import type { Route } from '../router';
import { usePhoneDown } from '../usePhoneDown';
import { useWakeLock } from '../useWakeLock';

/** Longer than a glance at a notification, shorter than a scroll. */
const AWAY_LIMIT_MS = 30_000;

export function SprintScreen({
  id,
  go,
}: {
  id: string;
  go: (route: Route, options?: { replace?: boolean }) => void;
}) {
  const { state, recordMove, endSprint } = useStore();
  const track = useTracker();

  const sprint = state.sprints.find((item) => item.id === id);
  const moves = useMemo(
    () => (sprint ? resolveMoves(sprint.topicId, sprint.moveIds) : []),
    [sprint],
  );

  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(() => (sprint ? sprint.plannedMinutes * 60_000 : 0));
  const [incomplete, setIncomplete] = useState(false);

  const phone = usePhoneDown(Boolean(sprint) && sprint?.status === 'running');
  useWakeLock(Boolean(sprint));

  const leftAt = useRef<number | null>(null);
  const finishing = useRef(false);
  // Captured before the sprint changes it, so the summary can show the move.
  const confidenceBefore = useRef(state.topicStates[sprint?.topicId ?? '']?.confidence ?? 0);

  const finish = useCallback(
    (reason: 'time' | 'moves' | 'early') => {
      if (!sprint || finishing.current) return;
      finishing.current = true;

      const status = incomplete || reason === 'early' ? 'abandoned' : 'completed';
      endSprint(sprint.id, status);
      track(status === 'completed' ? 'sprint_completed' : 'sprint_abandoned', {
        subject: sprint.subjectId,
        topic: sprint.topicId,
        minutes: sprint.plannedMinutes,
        answered: sprint.results.length,
        planned: sprint.moveIds.length,
        faceDownSeconds: phone.supported ? phone.faceDownSeconds() : -1,
        reason,
      });
      go(
        {
          name: 'summary',
          id: sprint.id,
          faceDown: phone.supported ? phone.faceDownSeconds() : 0,
          before: confidenceBefore.current,
        },
        { replace: true },
      );
    },
    [sprint, incomplete, endSprint, track, phone, go],
  );

  /* The countdown, driven by wall-clock time so a throttled background tab
     cannot slow it down or speed it up. */
  useEffect(() => {
    if (!sprint) return undefined;
    const endsAt = sprint.startedAt + sprint.plannedMinutes * 60_000;

    const tick = () => {
      const left = endsAt - Date.now();
      setRemaining(left);
      if (left <= 0) finish('time');
    };

    tick();
    const timer = window.setInterval(tick, 500);
    return () => window.clearInterval(timer);
  }, [sprint, finish]);

  /* Leaving the app. */
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        leftAt.current = Date.now();
        return;
      }
      const away = leftAt.current === null ? 0 : Date.now() - leftAt.current;
      leftAt.current = null;
      if (away > AWAY_LIMIT_MS) {
        setIncomplete(true);
        track('sprint_left_app', { seconds: Math.round(away / 1000) });
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [track]);

  /* There is no pause button, so a refresh mid-sprint should not lose it: the
     countdown is derived from the stored start time either way. */
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (finishing.current) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  if (!sprint || moves.length === 0) {
    return (
      <>
        <p className="dim">That sprint has finished.</p>
        <Button label="Back to the home screen" onClick={() => go({ name: 'home' }, { replace: true })} />
      </>
    );
  }

  const move = moves[Math.min(index, moves.length - 1)];

  function answer(outcome: MoveOutcome) {
    recordMove(sprint!.id, {
      moveId: move.id,
      type: move.type,
      outcome,
      answeredAt: Date.now(),
    });
    track('move_answered', { type: move.type, outcome, topic: sprint!.topicId });

    if (index + 1 >= moves.length) finish('moves');
    else setIndex(index + 1);
  }

  return (
    <>
      <div className="sprint-header">
        <div>
          <p className="eyebrow">{subjectName(sprint.subjectId)}</p>
          <p className="dim">
            {sprint.results.length} of {moves.length} answered
          </p>
        </div>
        <p className="clock" role="timer" aria-live="off">
          {formatClock(remaining)}
        </p>
      </div>

      <Track thin fraction={sprint.results.length / moves.length} />

      {incomplete ? (
        <p className="notice">
          You were away for more than 30 seconds, so this one will not count towards your week.
          Everything you have answered is saved. Carry on.
        </p>
      ) : null}

      <MoveCard move={move} index={index} total={moves.length} onAnswer={answer} />

      <div className="sprint-footer">
        <span>
          {phone.isDown ? 'Phone down. Work on paper.' : 'Put the phone face down while you think.'}
        </span>
        <Button variant="quiet" label="End sprint" onClick={() => finish('early')} />
      </div>
    </>
  );
}
