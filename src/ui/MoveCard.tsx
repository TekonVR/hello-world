/**
 * One move inside a sprint.
 *
 * Every move type follows the same contract: attempt it on paper first, then
 * reveal, then say honestly how it went. Self-marking is the point. The app
 * cannot tell whether a student really recalled something, and pretending
 * otherwise would make the confidence scores worthless.
 */

import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Move, MoveOutcome } from '../engine/types';
import { Body, Dim, Eyebrow, GhostButton, Heading } from './components';
import { colours, radius, space, type } from './theme';

const TYPE_LABEL: Record<Move['type'], string> = {
  recall: 'Quick recall',
  mcq: 'Diagnostic',
  explain: 'Explain it to a Year 7',
  exam: 'Exam style',
  match: 'Matching',
  worked: 'Worked problem',
  brainDump: 'Brain dump',
};

export function MoveCard({
  move,
  index,
  total,
  onAnswer,
}: {
  move: Move;
  index: number;
  total: number;
  onAnswer: (outcome: MoveOutcome) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [choice, setChoice] = useState<number | null>(null);
  const [step, setStep] = useState(0);

  // A new move always starts hidden, whatever the last one was doing.
  useEffect(() => {
    setRevealed(false);
    setChoice(null);
    setStep(0);
  }, [move.id]);

  const chosen = choice === null || move.type !== 'mcq' ? null : move.options[choice];

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Eyebrow>{TYPE_LABEL[move.type]}</Eyebrow>
        <Text style={styles.counter}>
          {index + 1} of {total}
        </Text>
      </View>

      <Heading style={styles.prompt}>{move.prompt}</Heading>
      {move.type === 'exam' && move.marks > 0 ? <Dim>{move.marks} marks</Dim> : null}

      {move.type === 'mcq' ? (
        <View style={styles.options}>
          {move.options.map((option, optionIndex) => {
            const picked = choice === optionIndex;
            const showAnswer = choice !== null;
            return (
              <Pressable
                key={option.text}
                accessibilityRole="button"
                disabled={showAnswer}
                onPress={() => setChoice(optionIndex)}
                style={[
                  styles.option,
                  picked && styles.optionPicked,
                  showAnswer && option.correct && styles.optionCorrect,
                ]}
              >
                <Body>{option.text}</Body>
                {showAnswer && picked && option.misconception ? (
                  <Dim style={styles.misconception}>{option.misconception}</Dim>
                ) : null}
                {showAnswer && option.correct && !picked ? (
                  <Dim style={styles.misconception}>This was the answer.</Dim>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {move.type === 'match' ? (
        <View style={styles.pairs}>
          {move.pairs.map((pair) => (
            <View key={pair.left} style={styles.pairRow}>
              <Body style={styles.pairLeft}>{pair.left}</Body>
              <Text style={styles.pairRight}>{revealed ? pair.right : '?'}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {move.type === 'worked' ? (
        <View style={styles.steps}>
          {move.steps.slice(0, step + 1).map((item, stepIndex) => (
            <View key={item.prompt} style={styles.step}>
              <Dim>{`Step ${stepIndex + 1}`}</Dim>
              <Body>{item.prompt}</Body>
              {stepIndex < step || revealed ? <Text style={styles.reveal}>{item.reveal}</Text> : null}
            </View>
          ))}
          {step < move.steps.length - 1 ? (
            <GhostButton
              label="Show this step, then the next"
              onPress={() => {
                setStep(step + 1);
                setRevealed(false);
              }}
            />
          ) : null}
        </View>
      ) : null}

      {move.type === 'brainDump' && revealed ? (
        <View style={styles.list}>
          <Dim>A good dump would include:</Dim>
          {move.checklist.map((item) => (
            <Body key={item}>{`· ${item}`}</Body>
          ))}
        </View>
      ) : null}

      {move.type === 'exam' && revealed ? (
        <View style={styles.list}>
          <Dim>Mark scheme</Dim>
          {move.markScheme.map((item) => (
            <Body key={item}>{`· ${item}`}</Body>
          ))}
        </View>
      ) : null}

      {(move.type === 'recall' || move.type === 'explain') && revealed ? (
        <View style={styles.list}>
          <Dim>Model answer</Dim>
          <Body>{move.modelAnswer}</Body>
        </View>
      ) : null}

      {move.type !== 'mcq' && !revealed ? (
        <GhostButton
          label={move.type === 'worked' ? 'Reveal the working' : 'I have attempted it. Reveal.'}
          onPress={() => {
            if (move.type === 'worked') setStep(move.steps.length - 1);
            setRevealed(true);
          }}
        />
      ) : null}

      {move.type === 'mcq' && chosen ? (
        <RateRow
          labels={['Got it', 'Lucky guess', 'Wrong']}
          onPick={(outcome) => onAnswer(outcome)}
          prefill={chosen.correct ? 'solid' : 'missed'}
        />
      ) : null}

      {move.type !== 'mcq' && revealed ? (
        <RateRow labels={['Solid', 'Shaky', 'Missed it']} onPick={onAnswer} />
      ) : null}
    </View>
  );
}

/**
 * Honest self-marking, three buttons. On a multiple choice move the app
 * already knows whether the answer was right, so the middle option exists only
 * for a student who admits they guessed.
 */
function RateRow({
  labels,
  onPick,
  prefill,
}: {
  labels: [string, string, string];
  onPick: (outcome: MoveOutcome) => void;
  prefill?: MoveOutcome;
}) {
  const outcomes: MoveOutcome[] = ['solid', 'shaky', 'missed'];
  return (
    <View style={styles.rate}>
      {labels.map((label, index) => (
        <Pressable
          key={label}
          accessibilityRole="button"
          onPress={() => onPick(outcomes[index])}
          style={({ pressed }) => [
            styles.rateButton,
            prefill === outcomes[index] && styles.rateSuggested,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.rateLabel}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counter: { ...type.tiny, color: colours.textFaint },
  prompt: { fontSize: 20, lineHeight: 28 },
  options: { gap: space.sm },
  option: {
    borderWidth: 1,
    borderColor: colours.line,
    backgroundColor: colours.surfaceHigh,
    borderRadius: radius.sm,
    padding: space.md,
    gap: space.xs,
  },
  optionPicked: { borderColor: colours.textDim },
  optionCorrect: { borderColor: colours.accent },
  misconception: { color: colours.amber },
  pairs: { gap: space.sm },
  pairRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colours.line,
    paddingBottom: space.sm,
  },
  pairLeft: { flex: 1 },
  pairRight: { ...type.body, color: colours.accent, flex: 1, textAlign: 'right' },
  steps: { gap: space.md },
  step: { gap: space.xs },
  reveal: { ...type.body, color: colours.accent, lineHeight: 22 },
  list: { gap: space.sm },
  rate: { flexDirection: 'row', gap: space.sm },
  rateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colours.line,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  rateSuggested: { borderColor: colours.accent },
  rateLabel: { ...type.small, color: colours.text },
  pressed: { opacity: 0.7 },
});
