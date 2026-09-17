/**
 * Onboarding, step three: the dates that drive the engine, and the one
 * notification a day.
 *
 * Mock dates matter more than exam dates in Year 10 and early Year 11, which
 * is why they are asked for first and why either can be left blank.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { subjectName } from '../../src/content/catalogue';
import { scheduleDailyNudge } from '../../src/notifications';
import type { KeyDate } from '../../src/engine/types';
import { useStore, useTracker } from '../../src/state/store';
import {
  Card,
  Chip,
  Dim,
  Eyebrow,
  Heading,
  PrimaryButton,
  Row,
  Screen,
  Title,
} from '../../src/ui/components';
import { colours, radius, space, type } from '../../src/ui/theme';

const TIMES = ['16:00', '17:30', '19:00', '20:30'];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default function KeyDates() {
  const router = useRouter();
  const { state, updateProfile, completeOnboarding } = useStore();
  const track = useTracker();

  const [dates, setDates] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      state.profile.keyDates
        .filter((date) => date.kind === 'mock')
        .map((date) => [date.subjectId, date.date]),
    ),
  );
  const [time, setTime] = useState(state.profile.notificationTime ?? '17:30');

  function finish() {
    const keyDates: KeyDate[] = Object.entries(dates)
      .filter(([, value]) => DATE_PATTERN.test(value))
      .map(([subjectId, date]) => ({ subjectId, kind: 'mock' as const, date }));

    const profile = { ...state.profile, keyDates, notificationTime: time };
    completeOnboarding(profile);
    updateProfile(profile);
    track('onboarding_completed', {
      subjects: profile.subjects.length,
      dates: keyDates.length,
      yearGroup: profile.yearGroup,
    });
    scheduleDailyNudge(time, null);
    router.replace('/');
  }

  return (
    <Screen>
      <Eyebrow>Step 3 of 3</Eyebrow>
      <Title>When are your mocks?</Title>
      <Dim>
        Any you know. The app pushes a subject up the list as its date gets closer, and you can add
        the rest later.
      </Dim>

      <Card>
        {state.profile.subjects.map((subject) => (
          <View key={subject.subjectId} style={styles.dateRow}>
            <Heading style={styles.dateLabel}>{subjectName(subject.subjectId)}</Heading>
            <TextInput
              value={dates[subject.subjectId] ?? ''}
              onChangeText={(value) =>
                setDates((current) => ({ ...current, [subject.subjectId]: value }))
              }
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colours.textFaint}
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              style={styles.input}
            />
          </View>
        ))}
      </Card>

      <Card>
        <Eyebrow>One nudge a day</Eyebrow>
        <Dim>Phrased as an offer, never a telling off. Ignore it and nothing else is sent.</Dim>
        <Row>
          {TIMES.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={time === option}
              onPress={() => setTime(option)}
            />
          ))}
        </Row>
      </Card>

      <View style={styles.actions}>
        <PrimaryButton label="Start" onPress={finish} />
        <Dim style={styles.note}>
          Everything stays on this phone. No account, no sign-in, nothing uploaded.
        </Dim>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  dateLabel: { flex: 1 },
  input: {
    width: 150,
    borderWidth: 1,
    borderColor: colours.line,
    borderRadius: radius.sm,
    backgroundColor: colours.surfaceHigh,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    color: colours.text,
    ...type.small,
  },
  actions: { marginTop: 'auto', paddingTop: space.lg, gap: space.sm },
  note: { textAlign: 'center' },
});
