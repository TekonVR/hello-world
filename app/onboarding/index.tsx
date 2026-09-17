/**
 * Onboarding, step one: who you are and what you are sitting.
 *
 * Section 11 says data minimisation, so the app asks for a year group and
 * nothing else about the student. No name, no date of birth, no school.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SUBJECTS } from '../../src/content/catalogue';
import { useStore } from '../../src/state/store';
import {
  Card,
  Chip,
  Dim,
  Eyebrow,
  PrimaryButton,
  Row,
  Screen,
  Title,
} from '../../src/ui/components';
import { space } from '../../src/ui/theme';

export default function ChooseSubjects() {
  const router = useRouter();
  const { state, updateProfile } = useStore();
  const [yearGroup, setYearGroup] = useState(state.profile.yearGroup);
  const [chosen, setChosen] = useState<string[]>(
    state.profile.subjects.map((subject) => subject.subjectId),
  );

  function toggle(subjectId: string) {
    setChosen((current) =>
      current.includes(subjectId)
        ? current.filter((id) => id !== subjectId)
        : [...current, subjectId],
    );
  }

  function next() {
    const existing = new Map(state.profile.subjects.map((s) => [s.subjectId, s]));
    updateProfile({
      yearGroup,
      subjects: chosen.map(
        (subjectId) => existing.get(subjectId) ?? { subjectId, board: 'AQA' as const },
      ),
    });
    router.push('/onboarding/details');
  }

  return (
    <Screen>
      <Eyebrow>Step 1 of 3</Eyebrow>
      <Title>What are you sitting?</Title>
      <Dim>
        Pick everything you are taking. The app works out what to revise and when, so this is the
        only list you will have to make.
      </Dim>

      <Card>
        <Eyebrow>Year</Eyebrow>
        <Row>
          <Chip label="Year 10" selected={yearGroup === 10} onPress={() => setYearGroup(10)} />
          <Chip label="Year 11" selected={yearGroup === 11} onPress={() => setYearGroup(11)} />
        </Row>
      </Card>

      <Card>
        <Eyebrow>Subjects</Eyebrow>
        <Row>
          {SUBJECTS.map((subject) => (
            <Chip
              key={subject.id}
              label={subject.name}
              selected={chosen.includes(subject.id)}
              onPress={() => toggle(subject.id)}
            />
          ))}
        </Row>
      </Card>

      <View style={styles.actions}>
        <PrimaryButton
          label={chosen.length === 0 ? 'Pick at least one subject' : 'Next'}
          disabled={chosen.length === 0}
          onPress={next}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { marginTop: 'auto', paddingTop: space.lg },
});
