/** The shell: routing, the daily nudge check, and the service worker. */

import { useEffect } from 'react';

import { topicsForStudent, TOPIC_BY_ID } from '../content';
import { SUBJECT_NAMES } from '../content/catalogue';
import { chooseSprints } from '../engine/select';
import { sprintsToday } from '../engine/streak';
import { useStore } from '../state/store';
import { maybeNudge } from './notifications';
import { useRoute } from './router';
import { Home } from './screens/Home';
import { Onboarding } from './screens/Onboarding';
import { Progress } from './screens/Progress';
import { Settings } from './screens/Settings';
import { SprintScreen } from './screens/Sprint';
import { Summary } from './screens/Summary';

export function App() {
  const { route, go } = useRoute();
  const { state, hydrated } = useStore();

  /* The nudge can only fire while the app is open, so check on load and every
     few minutes after that. */
  useEffect(() => {
    if (!hydrated || !state.onboarded) return undefined;

    const check = () => {
      const next = chooseSprints({
        profile: state.profile,
        topics: topicsForStudent(state.profile.subjects),
        topicStates: state.topicStates,
        subjectNames: SUBJECT_NAMES,
        sprints: state.sprints.filter((sprint) => sprint.endedAt !== null),
        now: Date.now(),
      })[0];

      maybeNudge({
        time: state.profile.notificationTime,
        topicName: next ? (TOPIC_BY_ID[next.topicId]?.name ?? null) : null,
        sprintsToday: sprintsToday(state.sprints, Date.now()),
      });
    };

    check();
    const timer = window.setInterval(check, 5 * 60_000);
    return () => window.clearInterval(timer);
  }, [hydrated, state]);

  if (!hydrated) return <main className="app" />;

  if (!state.onboarded && route.name !== 'onboarding') {
    return (
      <main className="app">
        <Onboarding step="subjects" go={go} />
      </main>
    );
  }

  return (
    <main className={`app ${route.name === 'sprint' ? 'app--sprint' : ''}`}>
      {route.name === 'onboarding' ? <Onboarding step={route.step} go={go} /> : null}
      {route.name === 'home' ? <Home go={go} /> : null}
      {route.name === 'sprint' ? <SprintScreen id={route.id} go={go} /> : null}
      {route.name === 'summary' ? (
        <Summary id={route.id} faceDown={route.faceDown} before={route.before} go={go} />
      ) : null}
      {route.name === 'progress' ? <Progress go={go} /> : null}
      {route.name === 'settings' ? <Settings go={go} /> : null}
    </main>
  );
}
