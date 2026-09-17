/**
 * The home screen (section 6.1).
 *
 * One card: subject, topic, sprint length, start button, and the reason the
 * app chose it. Two alternatives sit behind one tap. Progress and settings
 * live behind a single icon. That is the whole screen, on purpose.
 */

import { useMemo, useState } from 'react';

import { buildSprint, subjectDepth, topicsForStudent, TOPIC_BY_ID } from '../../content';
import { SUBJECT_NAMES, subjectName } from '../../content/catalogue';
import { chooseSprints } from '../../engine/select';
import { sprintsInWeek } from '../../engine/streak';
import type { Sprint } from '../../engine/types';
import { useStore, useTracker } from '../../state/store';
import { Button, Card, Chip, Dim, Eyebrow, Tag } from '../components';
import type { Route } from '../router';

const LENGTHS = [10, 15, 20, 25];

export function Home({ go }: { go: (route: Route, options?: { replace?: boolean }) => void }) {
  const { state, startSprint } = useStore();
  const track = useTracker();
  const [alternativesOpen, setAlternativesOpen] = useState(false);
  const [pickedTopicId, setPickedTopicId] = useState<string | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);

  const finished = useMemo(
    () => state.sprints.filter((sprint) => sprint.endedAt !== null),
    [state.sprints],
  );

  // Pinned to the moment the screen was opened: the card should not reshuffle
  // itself while it is being read.
  const suggestions = useMemo(
    () =>
      chooseSprints({
        profile: state.profile,
        topics: topicsForStudent(state.profile.subjects),
        topicStates: state.topicStates,
        subjectNames: SUBJECT_NAMES,
        sprints: finished,
        now: Date.now(),
      }),
    [state.profile, state.topicStates, finished],
  );

  const chosen = suggestions.find((s) => s.topicId === pickedTopicId) ?? suggestions[0];
  const alternatives = suggestions.filter((s) => s.topicId !== chosen?.topicId);
  const length = minutes ?? chosen?.minutes ?? state.profile.defaultMinutes;
  const doneThisWeek = sprintsInWeek(finished, Date.now());

  function start() {
    if (!chosen) return;
    const topic = TOPIC_BY_ID[chosen.topicId];
    if (!topic) return;

    const now = Date.now();
    const moves = buildSprint({
      topic,
      minutes: length,
      state: state.topicStates[topic.id],
      seed: now % 100000,
    });

    const sprint: Sprint = {
      id: `sp_${now.toString(36)}`,
      subjectId: chosen.subjectId,
      topicId: chosen.topicId,
      plannedMinutes: length,
      startedAt: now,
      endedAt: null,
      status: 'running',
      moveIds: moves.map((move) => move.id),
      results: [],
    };

    startSprint(sprint);
    track('sprint_started', {
      subject: chosen.subjectId,
      topic: chosen.topicId,
      minutes: length,
      moves: moves.length,
      depth: subjectDepth(chosen.subjectId),
      hour: new Date(now).getHours(),
    });
    go({ name: 'sprint', id: sprint.id });
  }

  if (!chosen) {
    return (
      <>
        <header className="row-between">
          <h1>Lock In</h1>
        </header>
        <Card>
          <h2>No subjects set up yet</h2>
          <Dim>Add your subjects and the app will start choosing sprints for you.</Dim>
          <Button
            label="Set up subjects"
            onClick={() => go({ name: 'onboarding', step: 'subjects' })}
          />
        </Card>
      </>
    );
  }

  return (
    <>
      <header className="row-between">
        <h1>Lock In</h1>
        <button
          type="button"
          className="icon-button"
          aria-label="Progress and settings"
          onClick={() => go({ name: 'progress' })}
        >
          ▦
        </button>
      </header>

      <Card className="card--main">
        <Eyebrow>{subjectName(chosen.subjectId)}</Eyebrow>
        <h2 className="topic">{TOPIC_BY_ID[chosen.topicId]?.name ?? 'Revision'}</h2>
        <Dim>{chosen.reason}</Dim>

        <div className="row">
          {LENGTHS.map((option) => (
            <Chip
              key={option}
              label={`${option} min`}
              selected={option === length}
              onClick={() => setMinutes(option)}
            />
          ))}
        </div>

        <Button label={`Start ${length} minute sprint`} onClick={start} />

        {subjectDepth(chosen.subjectId) === 2 ? (
          <Dim>Structured self-study: you will need your notes or textbook for this one.</Dim>
        ) : null}
      </Card>

      {alternatives.length > 0 ? (
        <div className="row" style={{ justifyContent: 'center' }}>
          <Button
            variant="quiet"
            label={alternativesOpen ? 'Hide alternatives' : 'Something else'}
            onClick={() => setAlternativesOpen((open) => !open)}
          />
        </div>
      ) : null}

      {alternativesOpen
        ? alternatives.map((alternative) => (
            <button
              key={alternative.topicId}
              type="button"
              className="card card--button"
              onClick={() => {
                setPickedTopicId(alternative.topicId);
                setAlternativesOpen(false);
                track('suggestion_swapped', { to: alternative.topicId });
              }}
            >
              <p className="eyebrow">{subjectName(alternative.subjectId)}</p>
              <span>{TOPIC_BY_ID[alternative.topicId]?.name}</span>
              <span className="dim">{alternative.reason}</span>
            </button>
          ))
        : null}

      <div className="push-bottom row" style={{ justifyContent: 'center' }}>
        <Tag
          label={`${doneThisWeek} of ${state.profile.weeklyTarget} sprints this week`}
          accent={doneThisWeek >= state.profile.weeklyTarget}
        />
      </div>
    </>
  );
}
