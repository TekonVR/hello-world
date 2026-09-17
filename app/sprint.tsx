/**
 * The sprint (section 6.2).
 *
 * A visible countdown, no pause button, and a run of 6 to 12 moves. Leaving
 * the app for more than 30 seconds marks the sprint incomplete but keeps
 * everything answered: the only consequence is that it does not count towards
 * the week.
 *
 * Phone-down is a feature, not a lock. The accelerometer notices when the
 * phone is face down and the app says thank you afterwards; it never blocks
 * anything, because a third-party app cannot honestly promise that.
 */

import { Accelerometer } from 'expo-sensors';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { resolveMoves } from '../src/content';
import { subjectName } from '../src/content/catalogue';
import { formatClock } from '../src/engine/time';
import type { MoveOutcome } from '../src/engine/types';
import { useStore, useTracker } from '../src/state/store';
import { MoveCard } from '../src/ui/MoveCard';
import { Dim, Screen } from '../src/ui/components';
import { colours, radius, space, type } from '../src/ui/theme';

/** Longer than a glance at a notification, shorter than a scroll. */
const AWAY_LIMIT_MS = 30_000;
const FACE_DOWN_Z = -0.75;

export default function SprintScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, recordMove, endSprint } = useStore();
  const track = useTracker();

  const sprint = state.sprints.find((item) => item.id === id);
  const moves = useMemo(
    () => (sprint ? resolveMoves(sprint.topicId, sprint.moveIds) : []),
    [sprint],
  );

  // Captured before the sprint updates it, so the summary can show the change.
  const confidenceBefore = useRef(state.topicStates[sprint?.topicId ?? '']?.confidence ?? 0);

  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(() =>
    sprint ? sprint.plannedMinutes * 60_000 : 0,
  );
  const [incomplete, setIncomplete] = useState(false);
  const [faceDownMs, setFaceDownMs] = useState(0);
  const [phoneIsDown, setPhoneIsDown] = useState(false);

  const leftAt = useRef<number | null>(null);
  const finishing = useRef(false);

  const finish = useCallback(
    (reason: 'time' | 'moves' | 'early') => {
      if (!sprint || finishing.current) return;
      finishing.current = true;

      const status = incomplete || reason === 'early' ? 'abandoned' : 'completed';
      endSprint(sprint.id, status);
      track(status === 'completed' ? 'sprint_completed' : 'sprint_abandoned', {
        subject: sprint.subjectId,
        topic: sprint.topicId,
        minutes: sprint.plannedMinutes,
        answered: sprint.results.length,
        planned: sprint.moveIds.length,
        faceDownSeconds: Math.round(faceDownMs / 1000),
        reason,
      });
      router.replace({
        pathname: '/summary',
        params: {
          id: sprint.id,
          faceDown: String(Math.round(faceDownMs / 1000)),
          before: String(confidenceBefore.current),
        },
      });
    },
    [sprint, incomplete, endSprint, track, faceDownMs, router],
  );

  /* The countdown. Driven by wall-clock time so a throttled or sleeping
     screen cannot slow it down or speed it up. */
  useEffect(() => {
    if (!sprint) return undefined;
    const endsAt = sprint.startedAt + sprint.plannedMinutes * 60_000;

    const tick = () => {
      const left = endsAt - Date.now();
      setRemaining(left);
      if (left <= 0) finish('time');
    };

    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [sprint, finish]);

  /* Leaving the app. */
  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next === 'active') {
        const away = leftAt.current === null ? 0 : Date.now() - leftAt.current;
        leftAt.current = null;
        if (away > AWAY_LIMIT_MS) {
          setIncomplete(true);
          track('sprint_left_app', { seconds: Math.round(away / 1000) });
        }
        return;
      }
      leftAt.current = Date.now();
    };

    const subscription = AppState.addEventListener('change', onChange);
    return () => subscription.remove();
  }, [track]);

  /* Keep the screen on while a sprint runs, where the platform allows it. */
  useEffect(() => {
    let awake = false;
    activateKeepAwakeAsync()
      .then(() => {
        awake = true;
      })
      .catch(() => {
        // Web, or a device that will not hold the lock. The sprint is unaffected.
      });
    return () => {
      if (awake) {
        try {
          deactivateKeepAwake();
        } catch {
          // Already released.
        }
      }
    };
  }, []);

  /* Face-down detection. Best effort: no sensor, no problem. */
  useEffect(() => {
    let mounted = true;
    let lastAt = Date.now();
    let subscription: { remove: () => void } | null = null;

    Accelerometer.isAvailableAsync()
      .then((available) => {
        if (!mounted || !available) return;
        Accelerometer.setUpdateInterval(1000);
        subscription = Accelerometer.addListener(({ z }) => {
          if (!mounted) return;
          const now = Date.now();
          const elapsed = now - lastAt;
          lastAt = now;
          const down = z < FACE_DOWN_Z;
          setPhoneIsDown(down);
          if (down) setFaceDownMs((total) => total + elapsed);
        });
      })
      .catch(() => {
        // No accelerometer here: the hint below simply stays generic.
      });

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  if (!sprint || moves.length === 0) {
    return (
      <Screen scroll={false}>
        <Dim>That sprint has finished.</Dim>
        <Pressable accessibilityRole="button" onPress={() => router.replace('/')}>
          <Text style={styles.link}>Back to the home screen</Text>
        </Pressable>
      </Screen>
    );
  }

  const move = moves[Math.min(index, moves.length - 1)];

  function answer(outcome: MoveOutcome) {
    Haptics.selectionAsync().catch(() => {});
    recordMove(sprint!.id, {
      moveId: move.id,
      type: move.type,
      outcome,
      answeredAt: Date.now(),
    });
    track('move_answered', { type: move.type, outcome, topic: sprint!.topicId });

    if (index + 1 >= moves.length) finish('moves');
    else setIndex(index + 1);
  }

  return (
    <Screen scroll={false} style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.subject}>{subjectName(sprint.subjectId)}</Text>
          <Dim>{`${sprint.results.length} of ${moves.length} answered`}</Dim>
        </View>
        <Text style={styles.clock}>{formatClock(remaining)}</Text>
      </View>

      <View style={styles.trackOuter}>
        <View
          style={[
            styles.trackInner,
            { width: `${Math.round((sprint.results.length / moves.length) * 100)}%` },
          ]}
        />
      </View>

      {incomplete ? (
        <View style={styles.notice}>
          <Dim style={styles.noticeText}>
            You were away for more than 30 seconds, so this one will not count towards your week.
            Everything you have answered is saved. Carry on.
          </Dim>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.moveArea}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <MoveCard move={move} index={index} total={moves.length} onAnswer={answer} />
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.phoneHint}>
          {phoneIsDown ? 'Phone down. Work on paper.' : 'Put the phone face down while you think.'}
        </Text>
        <Pressable accessibilityRole="button" onPress={() => finish('early')}>
          <Text style={styles.end}>End sprint</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { gap: space.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  subject: { ...type.tiny, color: colours.textDim, textTransform: 'uppercase' },
  clock: { ...type.title, color: colours.text, fontVariant: ['tabular-nums'], fontSize: 30 },
  trackOuter: {
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colours.surfaceHigh,
    overflow: 'hidden',
  },
  trackInner: { height: 4, backgroundColor: colours.accent, borderRadius: radius.pill },
  notice: {
    borderRadius: radius.sm,
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.line,
    padding: space.md,
  },
  noticeText: { color: colours.amber },
  moveArea: { paddingVertical: space.lg, gap: space.lg },
  footer: {
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colours.line,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.md,
  },
  phoneHint: { ...type.small, color: colours.textFaint, flex: 1 },
  end: { ...type.small, color: colours.textDim },
  link: { ...type.body, color: colours.accent },
});
