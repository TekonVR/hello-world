/**
 * The home screen (section 6.1).
 *
 * One card: subject, topic, sprint length, start button, and the reason the
 * app chose it. Two alternatives sit behind one tap. Progress and settings
 * live behind a single icon. That is the whole screen, on purpose.
 */

import { Redirect, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { buildSprint, subjectDepth, topicsForStudent, TOPIC_BY_ID } from '../src/content';
import { SUBJECT_NAMES, subjectName } from '../src/content/catalogue';
import { chooseSprints } from '../src/engine/select';
import { sprintsInWeek } from '../src/engine/streak';
import type { Sprint, SprintSuggestion } from '../src/engine/types';
import { useStore, useTracker } from '../src/state/store';
import {
  Body,
  Card,
  Chip,
  Dim,
  Eyebrow,
  PrimaryButton,
  Row,
  Screen,
  Tag,
  Title,
} from '../src/ui/components';
import { colours, radius, space, type } from '../src/ui/theme';

const LENGTHS = [10, 15, 20, 25];

export default function Home() {
  const router = useRouter();
  const { state, hydrated, startSprint } = useStore();
  const track = useTracker();
  const [alternativesOpen, setAlternativesOpen] = useState(false);
  const [pickedIndex, setPickedIndex] = useState(0);
  const [minutes, setMinutes] = useState<number | null>(null);

  const now = Date.now();
  const finished = useMemo(
    () => state.sprints.filter((sprint) => sprint.endedAt !== null),
    [state.sprints],
  );

  const suggestions = useMemo(() => {
    if (!state.onboarded) return [];
    return chooseSprints({
      profile: state.profile,
      topics: topicsForStudent(state.profile.subjects),
      topicStates: state.topicStates,
      subjectNames: SUBJECT_NAMES,
      sprints: finished,
      now,
    });
    // `now` deliberately left out: the card should not shuffle while it is read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.onboarded, state.profile, state.topicStates, finished]);

  if (!hydrated) return <Screen scroll={false} />;
  if (!state.onboarded) return <Redirect href="/onboarding" />;

  const chosen: SprintSuggestion | undefined = suggestions[pickedIndex] ?? suggestions[0];
  const alternatives = suggestions.filter((_, index) => index !== pickedIndex);
  const length = minutes ?? chosen?.minutes ?? state.profile.defaultMinutes;
  const doneThisWeek = sprintsInWeek(finished, now);

  function start() {
    if (!chosen) return;
    const topic = TOPIC_BY_ID[chosen.topicId];
    if (!topic) return;

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
    router.push({ pathname: '/sprint', params: { id: sprint.id } });
  }

  return (
    <Screen>
      <View style={styles.topRow}>
        <Text style={styles.brand}>Lock In</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Progress and settings"
          onPress={() => router.push('/progress')}
          style={styles.iconButton}
        >
          <Text style={styles.icon}>▦</Text>
        </Pressable>
      </View>

      {chosen ? (
        <>
          <Card style={styles.mainCard}>
            <Eyebrow>{subjectName(chosen.subjectId)}</Eyebrow>
            <Title style={styles.topic}>{TOPIC_BY_ID[chosen.topicId]?.name ?? 'Revision'}</Title>
            <Dim>{chosen.reason}</Dim>

            <Row>
              {LENGTHS.map((option) => (
                <Chip
                  key={option}
                  label={`${option} min`}
                  selected={option === length}
                  onPress={() => setMinutes(option)}
                />
              ))}
            </Row>

            <PrimaryButton label={`Start ${length} minute sprint`} onPress={start} />
            {subjectDepth(chosen.subjectId) === 2 ? (
              <Dim style={styles.depthNote}>
                Structured self-study: you will need your notes or textbook for this one.
              </Dim>
            ) : null}
          </Card>

          {alternatives.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setAlternativesOpen((open) => !open)}
              style={styles.swap}
            >
              <Text style={styles.swapLabel}>
                {alternativesOpen ? 'Hide alternatives' : 'Something else'}
              </Text>
            </Pressable>
          ) : null}

          {alternativesOpen
            ? alternatives.map((alternative) => (
                <Pressable
                  key={alternative.topicId}
                  accessibilityRole="button"
                  onPress={() => {
                    const index = suggestions.findIndex((s) => s.topicId === alternative.topicId);
                    setPickedIndex(index === -1 ? 0 : index);
                    setAlternativesOpen(false);
                    track('suggestion_swapped', { to: alternative.topicId });
                  }}
                >
                  <Card style={styles.altCard}>
                    <Eyebrow>{subjectName(alternative.subjectId)}</Eyebrow>
                    <Body>{TOPIC_BY_ID[alternative.topicId]?.name}</Body>
                    <Dim>{alternative.reason}</Dim>
                  </Card>
                </Pressable>
              ))
            : null}
        </>
      ) : (
        <Card>
          <Body>No subjects set up yet.</Body>
          <Dim>Add your subjects and the app will start choosing sprints for you.</Dim>
          <PrimaryButton label="Set up subjects" onPress={() => router.push('/onboarding')} />
        </Card>
      )}

      <View style={styles.footer}>
        <Tag
          label={`${doneThisWeek} of ${state.profile.weeklyTarget} sprints this week`}
          tone={doneThisWeek >= state.profile.weeklyTarget ? 'accent' : 'plain'}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { ...type.heading, color: colours.text, letterSpacing: -0.3 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.line,
  },
  icon: { color: colours.textDim, fontSize: 16 },
  mainCard: { gap: space.md, paddingVertical: space.xl },
  topic: { fontSize: 30, lineHeight: 36 },
  depthNote: { color: colours.textFaint },
  swap: { alignSelf: 'center', paddingVertical: space.sm },
  swapLabel: { ...type.small, color: colours.textDim },
  altCard: { paddingVertical: space.md, gap: space.xs },
  footer: { alignItems: 'center', marginTop: 'auto', paddingTop: space.lg },
});
