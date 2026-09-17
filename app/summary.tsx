/**
 * The end of a sprint (section 6.3).
 *
 * One screen: what was covered, what was solid, what to revisit, and one line
 * on what comes next. The break is not timed. "Next sprint ready when you are"
 * is an offer, and after three in a row the app suggests a longer break.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { resolveMoves, topicsForStudent, TOPIC_BY_ID } from '../src/content';
import { SUBJECT_NAMES, subjectName } from '../src/content/catalogue';
import { breakSuggestion, summariseSprint } from '../src/engine/scoring';
import { chooseSprints } from '../src/engine/select';
import { sprintsInARow } from '../src/engine/streak';
import {
  Body,
  Card,
  Dim,
  Eyebrow,
  GhostButton,
  Heading,
  PrimaryButton,
  Screen,
  Tag,
  Title,
} from '../src/ui/components';
import { useStore } from '../src/state/store';
import { colours, space } from '../src/ui/theme';

export default function SummaryScreen() {
  const router = useRouter();
  const { id, faceDown, before } = useLocalSearchParams<{
    id: string;
    faceDown?: string;
    before?: string;
  }>();
  const { state } = useStore();

  const sprint = state.sprints.find((item) => item.id === id);
  const now = Date.now();

  const next = useMemo(() => {
    if (!state.onboarded) return null;
    const picks = chooseSprints({
      profile: state.profile,
      topics: topicsForStudent(state.profile.subjects),
      topicStates: state.topicStates,
      subjectNames: SUBJECT_NAMES,
      sprints: state.sprints.filter((item) => item.endedAt !== null),
      now,
    });
    return picks[0] ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.onboarded, state.profile, state.topicStates, state.sprints]);

  if (!sprint) {
    return (
      <Screen>
        <Dim>That sprint is no longer here.</Dim>
        <PrimaryButton label="Back to the home screen" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  const topic = TOPIC_BY_ID[sprint.topicId];
  const moves = resolveMoves(sprint.topicId, sprint.moveIds);
  const topicState = state.topicStates[sprint.topicId];
  const nextLine = next
    ? `Next up: ${TOPIC_BY_ID[next.topicId]?.name} in ${subjectName(next.subjectId)}.`
    : 'Next up: add a subject and the app will pick for you.';

  const summary = summariseSprint({
    sprint,
    moves,
    subjectName: subjectName(sprint.subjectId),
    topicName: topic?.name ?? 'Revision',
    confidenceBefore: Number(before ?? 0),
    confidenceAfter: topicState?.confidence ?? 0,
    nextLine,
  });

  const faceDownSeconds = Number(faceDown ?? 0);
  const inARow = sprintsInARow(state.sprints.filter((item) => item.endedAt !== null), now);

  return (
    <Screen>
      <Eyebrow>{summary.subjectName}</Eyebrow>
      <Title>{summary.topicName}</Title>

      <Card>
        <Heading>
          {summary.status !== 'completed'
            ? `${summary.movesAnswered} moves done. This one does not count towards your week.`
            : summary.minutesServed >= 1
              ? `${summary.movesAnswered} moves in ${summary.minutesServed} minutes.`
              : `${summary.movesAnswered} moves done.`}
        </Heading>
        {summary.status !== 'completed' ? (
          <Dim>Everything you answered is saved and the engine has taken it into account.</Dim>
        ) : null}
        <View style={styles.tags}>
          <Tag
            label={
              summary.confidenceAfter > summary.confidenceBefore
                ? `Confidence ${summary.confidenceBefore} to ${summary.confidenceAfter} of 5`
                : `Confidence ${summary.confidenceAfter} of 5`
            }
            tone="accent"
          />
          {faceDownSeconds >= 60 ? (
            <Tag label={`Phone down for ${Math.round(faceDownSeconds / 60)} min`} />
          ) : null}
        </View>
      </Card>

      {summary.solid.length > 0 ? (
        <Card>
          <Eyebrow>Solid</Eyebrow>
          {summary.solid.map((item, index) => (
            <Body key={`${item}-${index}`}>{`· ${item}`}</Body>
          ))}
        </Card>
      ) : null}

      {summary.revisit.length > 0 ? (
        <Card>
          <Eyebrow>Worth another look</Eyebrow>
          {summary.revisit.map((item, index) => (
            <Body key={`${item}-${index}`}>{`· ${item}`}</Body>
          ))}
          <Dim>These come back on their own. You do not need to plan it.</Dim>
        </Card>
      ) : null}

      <Card>
        <Body>{summary.nextLine}</Body>
        <Dim>{breakSuggestion(inARow)}</Dim>
      </Card>

      <View style={styles.actions}>
        <PrimaryButton label="Next sprint when you are ready" onPress={() => router.replace('/')} />
        <GhostButton label="Done for now" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tags: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  actions: { gap: space.sm, marginTop: 'auto', paddingTop: space.lg },
});
