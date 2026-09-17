/**
 * Onboarding (section 8).
 *
 * Three steps: what you are sitting, which boards and tiers, and the dates that
 * drive the engine. Section 11 means the app asks for a year group and nothing
 * else about the student: no name, no date of birth, no school.
 */

import { useState } from 'react';

import { SUBJECTS, SUBJECT_BY_ID, subjectName } from '../../content/catalogue';
import type { ExamBoard, KeyDate, StudentSubject, Tier, YearGroup } from '../../engine/types';
import { useStore, useTracker } from '../../state/store';
import { requestNudgePermission } from '../notifications';
import { Button, Card, Chip, Dim, Eyebrow } from '../components';
import type { Route } from '../router';

const TIMES = ['16:00', '17:30', '19:00', '20:30'];

type Go = (route: Route, options?: { replace?: boolean }) => void;

export function Onboarding({ step, go }: { step: 'subjects' | 'details' | 'dates'; go: Go }) {
  if (step === 'details') return <DetailsStep go={go} />;
  if (step === 'dates') return <DatesStep go={go} />;
  return <SubjectsStep go={go} />;
}

function SubjectsStep({ go }: { go: Go }) {
  const { state, updateProfile } = useStore();
  const [yearGroup, setYearGroup] = useState<YearGroup>(state.profile.yearGroup);
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
        (subjectId) => existing.get(subjectId) ?? { subjectId, board: 'AQA' as ExamBoard },
      ),
    });
    go({ name: 'onboarding', step: 'details' });
  }

  return (
    <>
      <Eyebrow>Step 1 of 3</Eyebrow>
      <h1>What are you sitting?</h1>
      <Dim>
        Pick everything you are taking. The app works out what to revise and when, so this is the
        only list you will have to make.
      </Dim>

      <Card>
        <Eyebrow>Year</Eyebrow>
        <div className="row">
          <Chip label="Year 10" selected={yearGroup === 10} onClick={() => setYearGroup(10)} />
          <Chip label="Year 11" selected={yearGroup === 11} onClick={() => setYearGroup(11)} />
        </div>
      </Card>

      <Card>
        <Eyebrow>Subjects</Eyebrow>
        <div className="row">
          {SUBJECTS.map((subject) => (
            <Chip
              key={subject.id}
              label={subject.name}
              selected={chosen.includes(subject.id)}
              onClick={() => toggle(subject.id)}
            />
          ))}
        </div>
      </Card>

      <div className="push-bottom">
        <Button
          label={chosen.length === 0 ? 'Pick at least one subject' : 'Next'}
          disabled={chosen.length === 0}
          onClick={next}
        />
      </div>
    </>
  );
}

function DetailsStep({ go }: { go: Go }) {
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

  return (
    <>
      <Eyebrow>Step 2 of 3</Eyebrow>
      <h1>Boards and tiers</h1>
      <Dim>Not sure? Leave it. Your teacher will have said it on the front of a past paper.</Dim>

      {subjects.map((subject) => {
        const definition = SUBJECT_BY_ID[subject.subjectId];
        if (!definition) return null;
        return (
          <Card key={subject.subjectId}>
            <h2>{definition.name}</h2>

            <Eyebrow>Exam board</Eyebrow>
            <div className="row">
              {definition.boards.map((board) => (
                <Chip
                  key={board}
                  label={board}
                  selected={subject.board === board}
                  onClick={() => patch(subject.subjectId, { board })}
                />
              ))}
            </div>

            {definition.tiered ? (
              <>
                <Eyebrow>Tier</Eyebrow>
                <div className="row">
                  {(['Foundation', 'Higher'] as Tier[]).map((tier) => (
                    <Chip
                      key={tier}
                      label={tier}
                      selected={subject.tier === tier}
                      onClick={() => patch(subject.subjectId, { tier })}
                    />
                  ))}
                </div>
              </>
            ) : null}

            {definition.setTexts ? (
              <>
                <Eyebrow>Set texts</Eyebrow>
                <div className="row">
                  {definition.setTexts.map((text) => (
                    <Chip
                      key={text.id}
                      label={text.name}
                      selected={(subject.setTextIds ?? []).includes(text.id)}
                      onClick={() => toggleSetText(subject.subjectId, text.id)}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </Card>
        );
      })}

      <div className="push-bottom">
        <Button
          label="Next"
          onClick={() => {
            updateProfile({ subjects });
            go({ name: 'onboarding', step: 'dates' });
          }}
        />
      </div>
    </>
  );
}

function DatesStep({ go }: { go: Go }) {
  const { state, completeOnboarding } = useStore();
  const track = useTracker();

  const [dates, setDates] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      state.profile.keyDates
        .filter((date) => date.kind === 'mock')
        .map((date) => [date.subjectId, date.date]),
    ),
  );
  const [time, setTime] = useState(state.profile.notificationTime ?? '17:30');

  async function finish() {
    const keyDates: KeyDate[] = Object.entries(dates)
      .filter(([, value]) => Boolean(value))
      .map(([subjectId, date]) => ({ subjectId, kind: 'mock' as const, date }));

    const profile = { ...state.profile, keyDates, notificationTime: time };
    completeOnboarding(profile);
    track('onboarding_completed', {
      subjects: profile.subjects.length,
      dates: keyDates.length,
      yearGroup: profile.yearGroup,
    });
    await requestNudgePermission();
    go({ name: 'home' }, { replace: true });
  }

  return (
    <>
      <Eyebrow>Step 3 of 3</Eyebrow>
      <h1>When are your mocks?</h1>
      <Dim>
        Any you know. The app pushes a subject up the list as its date gets closer, and you can add
        the rest later.
      </Dim>

      <Card>
        {state.profile.subjects.map((subject) => (
          <label className="field" key={subject.subjectId}>
            {subjectName(subject.subjectId)}
            <input
              type="date"
              value={dates[subject.subjectId] ?? ''}
              onChange={(event) =>
                setDates((current) => ({ ...current, [subject.subjectId]: event.target.value }))
              }
            />
          </label>
        ))}
      </Card>

      <Card>
        <Eyebrow>One nudge a day</Eyebrow>
        <Dim>Phrased as an offer, never a telling off. Ignore it and nothing else is sent.</Dim>
        <div className="row">
          {TIMES.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={time === option}
              onClick={() => setTime(option)}
            />
          ))}
        </div>
      </Card>

      <div className="push-bottom stack-sm">
        <Button label="Start" onClick={finish} />
        <Dim>Everything stays in this browser. No account, no sign-in, nothing uploaded.</Dim>
      </div>
    </>
  );
}
