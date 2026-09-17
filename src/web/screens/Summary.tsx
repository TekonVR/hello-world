/**
 * The end of a sprint (section 6.3).
 *
 * One screen: what was covered, what was solid, what to revisit, and one line
 * on what comes next. The break is not timed. "Next sprint ready when you are"
 * is an offer, and after three in a row the app suggests a longer break.
 */

import { useMemo } from 'react';

import { resolveMoves, topicsForStudent, TOPIC_BY_ID } from '../../content';
import { SUBJECT_NAMES, subjectName } from '../../content/catalogue';
import { breakSuggestion, summariseSprint } from '../../engine/scoring';
import { chooseSprints } from '../../engine/select';
import { sprintsInARow } from '../../engine/streak';
import { useStore } from '../../state/store';
import { Button, Card, Dim, Eyebrow, Tag } from '../components';
import type { Route } from '../router';

export function Summary({
  id,
  faceDown,
  before,
  go,
}: {
  id: string;
  faceDown: number;
  before: number;
  go: (route: Route, options?: { replace?: boolean }) => void;
}) {
  const { state } = useStore();
  const sprint = state.sprints.find((item) => item.id === id);

  const next = useMemo(() => {
    const picks = chooseSprints({
      profile: state.profile,
      topics: topicsForStudent(state.profile.subjects),
      topicStates: state.topicStates,
      subjectNames: SUBJECT_NAMES,
      sprints: state.sprints.filter((item) => item.endedAt !== null),
      now: Date.now(),
    });
    return picks[0] ?? null;
  }, [state.profile, state.topicStates, state.sprints]);

  if (!sprint) {
    return (
      <>
        <Dim>That sprint is no longer here.</Dim>
        <Button label="Back to the home screen" onClick={() => go({ name: 'home' }, { replace: true })} />
      </>
    );
  }

  const topic = TOPIC_BY_ID[sprint.topicId];
  const topicState = state.topicStates[sprint.topicId];
  const summary = summariseSprint({
    sprint,
    moves: resolveMoves(sprint.topicId, sprint.moveIds),
    subjectName: subjectName(sprint.subjectId),
    topicName: topic?.name ?? 'Revision',
    confidenceBefore: before,
    confidenceAfter: topicState?.confidence ?? 0,
    nextLine: next
      ? `Next up: ${TOPIC_BY_ID[next.topicId]?.name} in ${subjectName(next.subjectId)}.`
      : 'Next up: add a subject and the app will pick for you.',
  });

  const inARow = sprintsInARow(
    state.sprints.filter((item) => item.endedAt !== null),
    Date.now(),
  );

  return (
    <>
      <Eyebrow>{summary.subjectName}</Eyebrow>
      <h1 className="topic">{summary.topicName}</h1>

      <Card>
        <h2>
          {summary.status !== 'completed'
            ? `${summary.movesAnswered} moves done. This one does not count towards your week.`
            : summary.minutesServed >= 1
              ? `${summary.movesAnswered} moves in ${summary.minutesServed} minutes.`
              : `${summary.movesAnswered} moves done.`}
        </h2>
        {summary.status !== 'completed' ? (
          <Dim>Everything you answered is saved and the engine has taken it into account.</Dim>
        ) : null}
        <div className="row">
          <Tag
            accent
            label={
              summary.confidenceAfter > summary.confidenceBefore
                ? `Confidence ${summary.confidenceBefore} to ${summary.confidenceAfter} of 5`
                : `Confidence ${summary.confidenceAfter} of 5`
            }
          />
          {faceDown >= 60 ? <Tag label={`Phone down for ${Math.round(faceDown / 60)} min`} /> : null}
        </div>
      </Card>

      {summary.solid.length > 0 ? (
        <Card>
          <Eyebrow>Solid</Eyebrow>
          <div className="list">
            {summary.solid.map((item, itemIndex) => (
              <p key={`${item}-${itemIndex}`}>· {item}</p>
            ))}
          </div>
        </Card>
      ) : null}

      {summary.revisit.length > 0 ? (
        <Card>
          <Eyebrow>Worth another look</Eyebrow>
          <div className="list">
            {summary.revisit.map((item, itemIndex) => (
              <p key={`${item}-${itemIndex}`}>· {item}</p>
            ))}
          </div>
          <Dim>These come back on their own. You do not need to plan it.</Dim>
        </Card>
      ) : null}

      <Card>
        <p>{summary.nextLine}</p>
        <Dim>{breakSuggestion(inARow)}</Dim>
      </Card>

      <div className="push-bottom stack-sm">
        <Button
          label="Next sprint when you are ready"
          onClick={() => go({ name: 'home' }, { replace: true })}
        />
      </div>
    </>
  );
}
