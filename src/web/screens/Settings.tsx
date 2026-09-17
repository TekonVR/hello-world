/**
 * Settings.
 *
 * Section 11 shapes this screen more than anything else: the most protective
 * option is the default, parent visibility is opt-in by the student, and the
 * data the app holds can be read and erased from here.
 */

import { useState } from 'react';

import { subjectName } from '../../content/catalogue';
import { buildParentSummary, nextSummaryDate } from '../../engine/parentSummary';
import { requestNudgePermission } from '../notifications';
import { useStore } from '../../state/store';
import { Button, Card, Chip, Dim, Eyebrow } from '../components';
import type { Route } from '../router';

const LENGTHS = [10, 15, 20, 25];
const TARGETS = [3, 5, 7, 10];

export function Settings({ go }: { go: (route: Route, options?: { replace?: boolean }) => void }) {
  const { state, updateProfile, reset } = useStore();
  const { profile } = state;
  const [time, setTime] = useState(profile.notificationTime ?? '17:30');
  const [email, setEmail] = useState(profile.parentEmail ?? '');
  const [confirming, setConfirming] = useState(false);

  const preview = buildParentSummary({
    sprints: state.sprints.filter((sprint) => sprint.endedAt !== null),
    profile,
    subjectName,
    now: Date.now(),
  });

  return (
    <>
      <h1>Settings</h1>

      <Card>
        <Eyebrow>Sprints</Eyebrow>
        <h2>Default length</h2>
        <div className="row">
          {LENGTHS.map((minutes) => (
            <Chip
              key={minutes}
              label={`${minutes} min`}
              selected={profile.defaultMinutes === minutes}
              onClick={() => updateProfile({ defaultMinutes: minutes })}
            />
          ))}
        </div>
        <Dim>
          The app suggests a length based on what you actually finish. This is the starting point.
        </Dim>

        <h2>Sprints per week</h2>
        <div className="row">
          {TARGETS.map((target) => (
            <Chip
              key={target}
              label={String(target)}
              selected={profile.weeklyTarget === target}
              onClick={() => updateProfile({ weeklyTarget: target })}
            />
          ))}
        </div>
      </Card>

      <Card>
        <Eyebrow>Daily nudge</Eyebrow>
        <Dim>One a day, at a time you pick. Ignore it and nothing else is sent.</Dim>
        <label className="field">
          Time
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            onBlur={async () => {
              updateProfile({ notificationTime: time });
              await requestNudgePermission();
            }}
          />
        </label>
        <Dim>
          A browser can only nudge you while Lock In is open in a tab. Add it to your home screen
          for the reminder to behave like an app.
        </Dim>
        <Button
          variant="link"
          label="Turn the nudge off"
          onClick={() => updateProfile({ notificationTime: null })}
        />
      </Card>

      <Card>
        <Eyebrow>Parent summary</Eyebrow>
        <div className="row-between">
          <Dim>
            Send a weekly email: sprints done, subjects covered, one suggestion. Never what you
            answered, never your scores.
          </Dim>
          <input
            className="switch"
            type="checkbox"
            role="switch"
            aria-label="Send my parent a weekly summary"
            checked={profile.parentSummaryOptIn}
            onChange={(event) => updateProfile({ parentSummaryOptIn: event.target.checked })}
          />
        </div>

        {profile.parentSummaryOptIn ? (
          <>
            <label className="field">
              Their email
              <input
                type="email"
                value={email}
                placeholder="parent@example.com"
                onChange={(event) => setEmail(event.target.value)}
                onBlur={() => updateProfile({ parentEmail: email.trim() || null })}
              />
            </label>
            <div className="card" style={{ background: 'var(--surface-high)' }}>
              <Eyebrow>{`What would go out on ${nextSummaryDate(Date.now())}`}</Eyebrow>
              {preview.body.split('\n\n').map((paragraph) => (
                <Dim key={paragraph}>{paragraph}</Dim>
              ))}
            </div>
          </>
        ) : null}

        <Dim>
          It is your choice, you can turn it off at any time, and it cannot be turned on from your
          parent's phone.
        </Dim>
      </Card>

      <Card>
        <Eyebrow>Your subjects</Eyebrow>
        {profile.subjects.map((subject) => (
          <Dim key={subject.subjectId}>
            {`${subjectName(subject.subjectId)} · ${subject.board}${subject.tier ? ` · ${subject.tier}` : ''}`}
          </Dim>
        ))}
        <Button
          variant="link"
          label="Change subjects, tiers and dates"
          onClick={() => go({ name: 'onboarding', step: 'subjects' })}
        />
      </Card>

      <Card>
        <Eyebrow>Your data</Eyebrow>
        <Dim>
          Everything is stored in this browser. No account, nothing uploaded, no advertising.
        </Dim>
        {confirming ? (
          <>
            <Dim>
              Erase every subject, sprint and score on this device? This cannot be undone.
            </Dim>
            <div className="row">
              <Button variant="ghost" label="Keep it" onClick={() => setConfirming(false)} />
              <Button
                variant="warn"
                label="Yes, erase everything"
                onClick={() => {
                  reset();
                  go({ name: 'onboarding', step: 'subjects' }, { replace: true });
                }}
              />
            </div>
          </>
        ) : (
          <Button variant="warn" label="Erase everything" onClick={() => setConfirming(true)} />
        )}
      </Card>

      <div className="row" style={{ justifyContent: 'center' }}>
        <Button variant="quiet" label="Back" onClick={() => go({ name: 'progress' })} />
      </div>
    </>
  );
}
