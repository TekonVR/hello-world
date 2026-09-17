# Lock In

A focus-first GCSE revision app for Year 10 and Year 11. The app never asks a
student to "revise": it asks them to do one short, timed sprint on one specific
thing, then decides what the next sprint should be.

This repository is the MVP build of *Lock In: concept and product
specification*, version 0.1. Section numbers below refer to that document.

## Running it

```bash
npm install
npm start          # Expo dev server: press i, a or w
npm test           # engine and content tests (56)
npm run typecheck  # tsc --noEmit
```

React Native with Expo (SDK 57), one codebase for iOS, Android and web, as set
out in section 10. Everything is stored on the device, so there is no backend to
run and no account to create.

To check a build without a device:

```bash
npx expo export --platform web --output-dir dist
npx http-server dist -p 8099
```

## What is built

| Section | Feature | State |
| --- | --- | --- |
| 6.1 | Home screen: one card with subject, topic, length, start button and the reason it was chosen | Built |
| 6.1 | Two alternatives behind one tap | Built |
| 6.1 | One daily notification, phrased as an offer, at a time the student sets | Built |
| 6.2 | Sprint of 6 to 12 moves, 10/15/20/25 minutes, no pause button | Built |
| 6.2 | Face-down detection, rewarded rather than policed | Built |
| 6.2 | Leaving the app for 30 seconds marks the sprint incomplete but keeps every answer | Built |
| 6.3 | Single-screen summary: covered, solid, revisit, what is next | Built |
| 6.3 | Untimed break, longer one suggested after three sprints in a row | Built |
| 6.4 | Sequencing by exam proximity, weakness, spacing and variety | Built |
| 6.5 | Subject map, sprints-per-week streak, personal records | Built |
| 7 | Depth 1 authored content, depth 2 self-study frameworks for every other subject | Pilot content, see below |
| 8 | Onboarding: subjects, boards, tiers, set texts, mock dates, notification time | Built |
| 8 | Parent weekly summary, opt-in by the student | Text built, sending needs a backend |
| 10 | Event-based analytics from day one | Built, local buffer with a pluggable sink |
| 11 | Data minimisation, no account, no advertising, erase everything | Built |

### The sprint

A sprint is a topic, a length and a run of moves. There is no pause button: the
way out is to end the sprint, which keeps everything answered and simply does
not count towards the week. Leaving the app for more than 30 seconds has the
same effect and says so on screen, once, without a telling off.

Move types, all seven from section 6.2: quick recall self-marked against a model
answer, multiple choice with distractors built from real misconceptions, "explain
it to a Year 7", exam-style questions with a mark scheme reveal, quote and key
term matching, structured worked problems revealed a step at a time, and the
depth 2 brain dump.

Self-marking is deliberate. The app cannot tell whether a student really recalled
something, and pretending otherwise would make the confidence scores worthless.

### The engine

`src/engine/select.ts` scores every topic the student is studying on four
weighted factors, in the order section 6.4 gives them: proximity of the next mock
or exam, weakness of the topic, how far past its spacing interval it is, and how
recently it was seen. A variety multiplier stops the same subject being served
three sprints running, unless an exam is within seven days.

The reason line under the home card is generated from whichever factor won, so it
is the literal truth about why that sprint was chosen, not marketing copy:

> Your Physics mock is in 12 days and you have not touched Forces yet.

Spacing is a Leitner-style ladder (1, 1, 2, 4, 8, 16 days) against a confidence
score of 0 to 5, which moves by at most one step per sprint. It is deliberately
simple so it can be explained to a parent in one sentence.

### Content status

Section 7 asks for two depths. Depth 1 subjects have authored move banks; depth 2
subjects know their specification and get self-study frameworks instead.

Authored in this build, as the pilot costing exercise from section 15:

- Maths: quadratic equations (12 moves)
- English Literature: Macbeth, quotations and themes (10 moves)
- Combined Science: forces (8 moves) and cell biology (6 moves)
- English Language: Paper 1 Question 2 (8 moves)

Every other topic in the catalogue, including the rest of the depth 1 subjects,
falls back to the depth 2 frameworks and is labelled as structured self-study in
the app. Triple science borrows the combined science banks where the content is
the same.

Specification references on the authored moves are human-readable placeholders.
Real board references, an author and a reviewer are attached by the content
pipeline described in section 7, and no move should ship to students without
them.

## What is not built

Phase 2 and later items from section 8, plus the pieces that need infrastructure:

- No backend. No Supabase, no accounts, no sync, no row-level security, because
  there is nothing to secure yet: the device holds everything.
- The parent weekly email is generated but not sent. `src/engine/parentSummary.ts`
  builds the exact text and the student can read it in settings before opting in.
- No iOS Screen Time or Android Digital Wellbeing integration (phase 2, and both
  need approval and parent set-up).
- No paper-mode photo upload, no voice answers, no AI marking.
- Mock dates are typed as YYYY-MM-DD rather than picked from a calendar.
- Analytics events are buffered locally. `setAnalyticsSink` is where a real
  destination gets wired in.

## Layout

```
app/                     screens (expo-router)
  index.tsx              the home card
  sprint.tsx             the sprint itself
  summary.tsx            end of sprint
  progress.tsx           subject map, week, records
  settings.tsx           targets, nudge, parent summary, data
  onboarding/            subjects, boards and tiers, dates
src/
  engine/                pure logic: selection, spacing, scoring, streaks
  content/               subject catalogue, authored banks, frameworks
  state/                 persisted store
  ui/                    theme and components
  analytics.ts           event stream
  notifications.ts       the one daily nudge
test/                    node --test suites over the pure modules
```

The engine and content modules are pure and have no React or native imports,
which is why they can be tested with `node --test` and no test runner.

## Notes on tone

Section 5 is a product constraint, not a style guide, and the copy in this build
follows it: no guilt notifications, no red warnings, nothing that counts days
missed. Nothing in the palette is red. The streak counts sprints per week, so one
missed evening resets nothing.
