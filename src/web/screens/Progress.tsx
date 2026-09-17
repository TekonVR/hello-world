/**
 * Progress (section 6.5).
 *
 * The subject map is the thing a student never otherwise has: an accurate
 * picture of how much of the course they actually know. Streaks are counted in
 * sprints per week, so one missed evening does not reset anything, and the
 * record board only ever shows personal bests.
 */

import { topicsForStudent } from '../../content';
import { subjectName } from '../../content/catalogue';
import { topicStatus } from '../../engine/spacing';
import { personalRecords, weekProgress } from '../../engine/streak';
import { useStore } from '../../state/store';
import { Button, Card, Dim, Eyebrow, Tag, Track } from '../components';
import { plural } from '../format';
import type { Route } from '../router';

export function Progress({ go }: { go: (route: Route) => void }) {
  const { state } = useStore();
  const now = Date.now();

  const finished = state.sprints.filter((sprint) => sprint.endedAt !== null);
  const week = weekProgress(finished, now, state.profile.weeklyTarget);
  const records = personalRecords(finished);
  const topics = topicsForStudent(state.profile.subjects);

  return (
    <>
      <header className="row-between">
        <h1>Progress</h1>
        <Button variant="link" label="Settings" onClick={() => go({ name: 'settings' })} />
      </header>

      <Card>
        <Eyebrow>This week</Eyebrow>
        <h2>{`${week.done} of ${week.target} sprints`}</h2>
        <Track fraction={week.fraction} />
        <Dim>Sprints per week, not days in a row. Miss an evening and nothing resets.</Dim>
      </Card>

      <Card>
        <Eyebrow>Records</Eyebrow>
        <div className="row">
          <Tag accent label={plural(records.totalSprints, 'sprint')} />
          <Tag label={plural(records.totalMinutes, 'minute')} />
          <Tag label={`Best week: ${records.bestWeek}`} />
          <Tag label={`Best day: ${records.bestDay}`} />
        </div>
      </Card>

      {state.profile.subjects.map((subject) => {
        const subjectTopics = topics.filter((topic) => topic.subjectId === subject.subjectId);
        const solid = subjectTopics.filter(
          (topic) => topicStatus(state.topicStates[topic.id]) === 'solid',
        ).length;

        return (
          <Card key={subject.subjectId}>
            <Eyebrow>{subjectName(subject.subjectId)}</Eyebrow>
            <div className="map">
              {subjectTopics.map((topic) => {
                const status = topicStatus(state.topicStates[topic.id]);
                return (
                  <span
                    key={topic.id}
                    className={`tile ${status === 'solid' ? 'tile--solid' : ''} ${
                      status === 'shaky' ? 'tile--shaky' : ''
                    }`}
                    title={`${topic.name}: ${status}`}
                  />
                );
              })}
            </div>
            <Dim>{`${solid} of ${subjectTopics.length} topics solid`}</Dim>
          </Card>
        );
      })}

      <div className="row legend">
        <span className="dot" style={{ background: 'var(--grey)' }} /> Untouched
        <span className="dot" style={{ background: 'var(--amber)' }} /> Getting there
        <span className="dot" style={{ background: 'var(--accent)' }} /> Solid
      </div>

      <div className="row" style={{ justifyContent: 'center' }}>
        <Button variant="quiet" label="Back" onClick={() => go({ name: 'home' })} />
      </div>
    </>
  );
}
