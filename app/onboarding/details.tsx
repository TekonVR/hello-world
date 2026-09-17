/**
 * Onboarding, step two: boards, tiers and set texts.
 *
 * This is what makes the content exam-board correct rather than generic, so it
 * is worth the extra screen. Everything has a sensible default and can be
 * changed later.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SUBJECT_BY_ID } from '../../src/content/catalogue';
import type { ExamBoard, StudentSubject, Tier } from '../../src/engine/types';
import { useStore } from '../../src/state/store';
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
import { space } from '../../src/ui/theme';

export default function SubjectDetails() {
  const router = useRouter();
  const { state, updateProfile } = useStore();
  const [subjects, setSubjects] = useState<StudentSubject[]>(state.profile.subjects);

  function patch(subjectId: string, change: Partial<StudentSubject>) {
    setSubjects((current) =>
      current.map((subject) =>
        subject.subjectId === subjectId ? { ...subject, ...change } : subject,
      ),
    );
  }

  function toggleSetText(subjectId: string, setTextId: string) {
    setSubjects((current) =>
      current.map((subject) => {
        if (subject.subjectId !== subjectId) return subject;
        const texts = subject.setTextIds ?? [];
        return {
          ...subject,
          setTextIds: texts.includes(setTextId)
            ? texts.filter((id) => id !== setTextId)
            : [...texts, setTextId],
        };
      }),
    );
  }

  function next() {
    updateProfile({ subjects });
    router.push('/onboarding/dates');
  }

  return (
    <Screen>
      <Eyebrow>Step 2 of 3</Eyebrow>
      <Title>Boards and tiers</Title>
      <Dim>Not sure? Leave it. Your teacher will have said it on the front of a past paper.</Dim>

      {subjects.map((subject) => {
        const definition = SUBJECT_BY_ID[subject.subjectId];
        if (!definition) return null;
        return (
          <Card key={subject.subjectId}>
            <Heading>{definition.name}</Heading>

            <Eyebrow>Exam board</Eyebrow>
            <Row>
              {definition.boards.map((board) => (
                <Chip
                  key={board}
                  label={board}
                  selected={subject.board === board}
                  onPress={() => patch(subject.subjectId, { board: board as ExamBoard })}
                />
              ))}
            </Row>

            {definition.tiered ? (
              <>
                <Eyebrow>Tier</Eyebrow>
                <Row>
                  {(['Foundation', 'Higher'] as Tier[]).map((tier) => (
                    <Chip
                      key={tier}
                      label={tier}
                      selected={subject.tier === tier}
                      onPress={() => patch(subject.subjectId, { tier })}
                    />
                  ))}
                </Row>
              </>
            ) : null}

            {definition.setTexts ? (
              <>
                <Eyebrow>Set texts</Eyebrow>
                <Row>
                  {definition.setTexts.map((text) => (
                    <Chip
                      key={text.id}
                      label={text.name}
                      selected={(subject.setTextIds ?? []).includes(text.id)}
                      onPress={() => toggleSetText(subject.subjectId, text.id)}
                    />
                  ))}
                </Row>
              </>
            ) : null}
          </Card>
        );
      })}

      <View style={styles.actions}>
        <PrimaryButton label="Next" onPress={next} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { marginTop: 'auto', paddingTop: space.lg },
});
