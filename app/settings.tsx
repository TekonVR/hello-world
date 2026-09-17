/**
 * Settings.
 *
 * Section 11 shapes this screen more than anything else: the most protective
 * option is the default, parent visibility is opt-in by the student, and the
 * data the app holds can be seen and erased from here.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { subjectName } from '../src/content/catalogue';
import { buildParentSummary, nextSummaryDate } from '../src/engine/parentSummary';
import { cancelNudges, scheduleDailyNudge } from '../src/notifications';
import { Card, Chip, Dim, Eyebrow, Heading, Row, Screen, Title } from '../src/ui/components';
import { useStore } from '../src/state/store';
import { colours, radius, space, type } from '../src/ui/theme';

const LENGTHS = [10, 15, 20, 25];
const TARGETS = [3, 5, 7, 10];

export default function SettingsScreen() {
  const router = useRouter();
  const { state, updateProfile, reset } = useStore();
  const { profile } = state;
  const [time, setTime] = useState(profile.notificationTime ?? '17:30');
  const [email, setEmail] = useState(profile.parentEmail ?? '');

  function confirmReset() {
    const wipe = () => {
      reset();
      router.replace('/onboarding');
    };
    if (Platform.OS === 'web') {
      wipe();
      return;
    }
    Alert.alert(
      'Erase everything?',
      'Your subjects, sprints and progress are stored on this device only. This cannot be undone.',
      [
        { text: 'Keep it', style: 'cancel' },
        { text: 'Erase', style: 'destructive', onPress: wipe },
      ],
    );
  }

  return (
    <Screen>
      <Title>Settings</Title>

      <Card>
        <Eyebrow>Sprints</Eyebrow>
        <Heading>Default length</Heading>
        <Row>
          {LENGTHS.map((minutes) => (
            <Chip
              key={minutes}
              label={`${minutes} min`}
              selected={profile.defaultMinutes === minutes}
              onPress={() => updateProfile({ defaultMinutes: minutes })}
            />
          ))}
        </Row>
        <Dim>The app suggests a length based on what you actually finish. This is the starting point.</Dim>

        <Heading>Sprints per week</Heading>
        <Row>
          {TARGETS.map((target) => (
            <Chip
              key={target}
              label={`${target}`}
              selected={profile.weeklyTarget === target}
              onPress={() => updateProfile({ weeklyTarget: target })}
            />
          ))}
        </Row>
      </Card>

      <Card>
        <Eyebrow>Daily nudge</Eyebrow>
        <Dim>One a day, at a time you pick. Ignore it and nothing else is sent.</Dim>
        <TextInput
          value={time}
          onChangeText={setTime}
          placeholder="17:30"
          placeholderTextColor={colours.textFaint}
          style={styles.input}
          keyboardType="numbers-and-punctuation"
          onBlur={() => {
            updateProfile({ notificationTime: time });
            scheduleDailyNudge(time, null);
          }}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            updateProfile({ notificationTime: null });
            cancelNudges();
          }}
        >
          <Text style={styles.link}>Turn the nudge off</Text>
        </Pressable>
      </Card>

      <Card>
        <Eyebrow>Parent summary</Eyebrow>
        <View style={styles.switchRow}>
          <Dim style={styles.switchLabel}>
            Send a weekly email: sprints done, subjects covered, one suggestion. Never what you
            answered, never your scores.
          </Dim>
          <Switch
            value={profile.parentSummaryOptIn}
            onValueChange={(value) => updateProfile({ parentSummaryOptIn: value })}
            trackColor={{ true: colours.accent, false: colours.line }}
          />
        </View>
        {profile.parentSummaryOptIn ? (
          <View style={styles.preview}>
            <Eyebrow>{`What would go out on ${nextSummaryDate(Date.now())}`}</Eyebrow>
            <Dim>
              {
                buildParentSummary({
                  sprints: state.sprints.filter((sprint) => sprint.endedAt !== null),
                  profile,
                  subjectName,
                  now: Date.now(),
                }).body
              }
            </Dim>
          </View>
        ) : null}
        {profile.parentSummaryOptIn ? (
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="parent@example.com"
            placeholderTextColor={colours.textFaint}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            onBlur={() => updateProfile({ parentEmail: email.trim() || null })}
          />
        ) : null}
        <Dim>
          It is your choice, you can turn it off at any time, and the email cannot be turned on from
          your parent's phone.
        </Dim>
      </Card>

      <Card>
        <Eyebrow>Your subjects</Eyebrow>
        {profile.subjects.map((subject) => (
          <Dim key={subject.subjectId}>
            {`${subjectName(subject.subjectId)} · ${subject.board}${subject.tier ? ` · ${subject.tier}` : ''}`}
          </Dim>
        ))}
        <Pressable accessibilityRole="button" onPress={() => router.push('/onboarding')}>
          <Text style={styles.link}>Change subjects, tiers and dates</Text>
        </Pressable>
      </Card>

      <Card>
        <Eyebrow>Your data</Eyebrow>
        <Dim>
          Everything is stored on this device. No account, nothing uploaded, no advertising.
        </Dim>
        <Pressable accessibilityRole="button" onPress={confirmReset}>
          <Text style={styles.danger}>Erase everything</Text>
        </Pressable>
      </Card>

      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
        <Text style={styles.link}>Back</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colours.line,
    borderRadius: radius.sm,
    backgroundColor: colours.surfaceHigh,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    color: colours.text,
    ...type.body,
  },
  preview: {
    borderWidth: 1,
    borderColor: colours.line,
    borderRadius: radius.sm,
    padding: space.md,
    gap: space.sm,
    backgroundColor: colours.surfaceHigh,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  switchLabel: { flex: 1 },
  link: { ...type.small, color: colours.accent },
  danger: { ...type.small, color: colours.amber },
  back: { alignSelf: 'center', paddingVertical: space.md },
});
