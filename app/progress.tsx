/**
 * Progress (section 6.5).
 *
 * The subject map is the thing a student never otherwise has: an accurate
 * picture of how much of the course they actually know. Streaks are counted in
 * sprints per week, so one missed evening does not reset anything, and the
 * record board only ever shows personal bests.
 */

import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { topicsForStudent } from '../src/content';
import { subjectName } from '../src/content/catalogue';
import { topicStatus } from '../src/engine/spacing';
import { personalRecords, weekProgress } from '../src/engine/streak';
import { Card, Dim, Eyebrow, Heading, Row, Screen, Tag, Title } from '../src/ui/components';
import { plural } from '../src/ui/format';
import { useStore } from '../src/state/store';
import { colours, radius, space, type } from '../src/ui/theme';

const TILE_COLOUR = {
  untouched: colours.grey,
  shaky: colours.amber,
  solid: colours.accent,
} as const;

export default function ProgressScreen() {
  const router = useRouter();
  const { state } = useStore();
  const now = Date.now();

  const finished = state.sprints.filter((sprint) => sprint.endedAt !== null);
  const week = weekProgress(finished, now, state.profile.weeklyTarget);
  const records = personalRecords(finished);
  const topics = topicsForStudent(state.profile.subjects);

  const bySubject = state.profile.subjects.map((subject) => ({
    subjectId: subject.subjectId,
    topics: topics.filter((topic) => topic.subjectId === subject.subjectId),
  }));

  return (
    <Screen>
      <View style={styles.topRow}>
        <Title>Progress</Title>
        <Pressable accessibilityRole="button" onPress={() => router.push('/settings')}>
          <Text style={styles.link}>Settings</Text>
        </Pressable>
      </View>

      <Card>
        <Eyebrow>This week</Eyebrow>
        <Heading>{`${week.done} of ${week.target} sprints`}</Heading>
        <View style={styles.trackOuter}>
          <View style={[styles.trackInner, { width: `${Math.round(week.fraction * 100)}%` }]} />
        </View>
        <Dim>
          Sprints per week, not days in a row. Miss an evening and nothing resets.
        </Dim>
      </Card>

      <Card>
        <Eyebrow>Records</Eyebrow>
        <Row>
          <Tag label={plural(records.totalSprints, 'sprint')} tone="accent" />
          <Tag label={plural(records.totalMinutes, 'minute')} />
          <Tag label={`Best week: ${records.bestWeek}`} />
          <Tag label={`Best day: ${records.bestDay}`} />
        </Row>
      </Card>

      {bySubject.map(({ subjectId, topics: subjectTopics }) => (
        <Card key={subjectId}>
          <Eyebrow>{subjectName(subjectId)}</Eyebrow>
          <View style={styles.map}>
            {subjectTopics.map((topic) => {
              const status = topicStatus(state.topicStates[topic.id]);
              return (
                <View
                  key={topic.id}
                  accessibilityLabel={`${topic.name}: ${status}`}
                  style={[styles.tile, { backgroundColor: TILE_COLOUR[status] }]}
                />
              );
            })}
          </View>
          <Dim>
            {`${subjectTopics.filter((t) => topicStatus(state.topicStates[t.id]) === 'solid').length} of ${subjectTopics.length} topics solid`}
          </Dim>
        </Card>
      ))}

      <Row style={styles.legend}>
        <View style={[styles.dot, { backgroundColor: colours.grey }]} />
        <Dim>Untouched</Dim>
        <View style={[styles.dot, { backgroundColor: colours.amber }]} />
        <Dim>Getting there</Dim>
        <View style={[styles.dot, { backgroundColor: colours.accent }]} />
        <Dim>Solid</Dim>
      </Row>

      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
        <Text style={styles.link}>Back</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { ...type.small, color: colours.accent },
  trackOuter: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colours.surfaceHigh,
    overflow: 'hidden',
  },
  trackInner: { height: 8, backgroundColor: colours.accent, borderRadius: radius.pill },
  map: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tile: { width: 26, height: 26, borderRadius: 7 },
  legend: { justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  back: { alignSelf: 'center', paddingVertical: space.md },
});
