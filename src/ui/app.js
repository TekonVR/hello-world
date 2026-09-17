/** Lock In: app shell, views and wiring. */

import {
  currentStreak,
  dailyHistory,
  focusScore,
  formatMinutes,
  makeId,
  minutesBySubject,
  minutesOf,
  minutesOnDay,
  shiftDayKey,
  startSession,
  suggestSubject,
  toDayKey,
  totalMinutes,
  upcomingExams,
  averageFocusScore,
} from '../lib/logic.js';
import { GCSE_SUBJECTS, EXAM_BOARDS, LOCK_LENGTHS } from '../lib/subjects.js';
import { createStore } from '../lib/store.js';
import { html, raw, escapeHtml, safeColour, dayLabel, dateLabel, timeLabel, qs, on } from './dom.js';
import { LockController } from './lock.js';

const root = document.getElementById('app');
const store = createStore(window.localStorage);
store.load();

/** Transient view state: which tab is showing, and which session to debrief. */
const view = { name: 'home', debriefId: null, draft: { subjectId: null, topic: '', minutes: null } };
let lock = null;

const today = () => toDayKey(new Date());
const state = () => store.get();
const subjectById = (id) => state().subjects.find((s) => s.id === id) ?? null;

function subjectName(id) {
  return subjectById(id)?.name ?? 'Deleted subject';
}

function subjectColour(id) {
  return safeColour(subjectById(id)?.colour);
}

function go(name, extra = {}) {
  Object.assign(view, { name }, extra);
  render();
}

/* Views ------------------------------------------------------------------ */

function onboardingView() {
  const chosen = new Set(state().subjects.map((s) => s.name));
  const chips = GCSE_SUBJECTS.map(
    (subject) => html`
      <button
        class="chip"
        type="button"
        data-subject="${subject.name}"
        aria-pressed="${chosen.has(subject.name) ? 'true' : 'false'}"
      >
        ${subject.name}
      </button>
    `,
  );

  return html`
    <header class="topbar"><h1 class="brand">Lock <span>In</span></h1></header>
    <div class="stack">
      <div class="card stack-sm">
        <h2>Which subjects are you sitting?</h2>
        <p class="small muted">Pick the ones you revise. You can add your own later.</p>
        <div class="chips" id="subject-picker">${raw(chips.join(''))}</div>
      </div>
      <div class="card stack-sm">
        <label class="field">
          Daily target
          <select id="goal">
            ${raw(
              [30, 45, 60, 90, 120, 180]
                .map(
                  (m) =>
                    `<option value="${m}" ${m === state().dailyGoalMinutes ? 'selected' : ''}>${formatMinutes(m)} a day</option>`,
                )
                .join(''),
            )}
          </select>
        </label>
        <label class="field">
          Exam board (optional)
          <select id="board">
            <option value="">Not sure</option>
            ${raw(EXAM_BOARDS.map((b) => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join(''))}
          </select>
        </label>
      </div>
      <button class="btn-primary" id="finish-onboarding">Start revising</button>
      <p class="tiny muted" style="text-align:center">
        Everything stays on this device. No account, no sign-in, nothing uploaded.
      </p>
    </div>
  `;
}

function heroCard() {
  const s = state();
  const day = today();
  const done = minutesOnDay(s.sessions, day);
  const goal = s.dailyGoalMinutes;
  const pct = Math.min(100, Math.round((done / Math.max(1, goal)) * 100));
  const streak = currentStreak(s.sessions, { today: day, dailyGoalMinutes: goal });

  return html`
    <div class="card hero stack-sm">
      <p class="streak">${streak}<small>day streak</small></p>
      <div class="progress ${pct >= 100 ? 'is-done' : ''}"><i style="width:${pct}%"></i></div>
      <p class="small muted">
        ${formatMinutes(done)} of ${formatMinutes(goal)} today${pct >= 100 ? ' · target hit' : ''}
      </p>
    </div>
  `;
}

function startCard() {
  const s = state();
  const day = today();
  const suggestion = suggestSubject(s.subjects, s.sessions, { today: day });
  const selectedId = view.draft.subjectId ?? suggestion?.id ?? s.subjects[0]?.id ?? null;
  const minutes = view.draft.minutes ?? s.defaultLockMinutes;

  const subjectChips = s.subjects.map(
    (subject) => html`
      <button
        class="chip"
        type="button"
        data-pick-subject="${subject.id}"
        aria-pressed="${subject.id === selectedId ? 'true' : 'false'}"
      >
        ${subject.name}
      </button>
    `,
  );

  const lengthChips = LOCK_LENGTHS.map(
    (length) => html`
      <button
        class="chip"
        type="button"
        data-pick-minutes="${length}"
        aria-pressed="${length === minutes ? 'true' : 'false'}"
      >
        ${length} min
      </button>
    `,
  );

  return html`
    <div class="card stack-sm">
      <div class="row-between">
        <h2>Next lock</h2>
        ${suggestion
          ? raw(`<span class="badge">Suggested: ${escapeHtml(suggestion.name)}</span>`)
          : ''}
      </div>
      <div class="chips">${raw(subjectChips.join(''))}</div>
      <label class="field">
        What exactly are you revising?
        <input
          id="topic"
          type="text"
          maxlength="80"
          placeholder="e.g. Quadratic simultaneous equations"
          value="${view.draft.topic}"
        />
      </label>
      <div class="chips">${raw(lengthChips.join(''))}</div>
      <button class="btn-primary" id="start-lock" ${selectedId ? '' : 'disabled'}>
        Lock in for ${minutes} minutes
      </button>
    </div>
  `;
}

function weekCard() {
  const s = state();
  const day = today();
  const history = dailyHistory(s.sessions, { today: day, days: 7 });
  const peak = Math.max(s.dailyGoalMinutes, ...history.map((h) => h.minutes));

  const bars = history.map(
    (entry) => html`
      <div class="bar ${entry.dayKey === day ? 'is-today' : ''}" title="${formatMinutes(entry.minutes)}">
        <i style="height:${Math.round((entry.minutes / peak) * 100)}%"></i>
        <span>${dayLabel(entry.dayKey)}</span>
      </div>
    `,
  );

  const weekTotal = history.reduce((sum, h) => sum + h.minutes, 0);

  return html`
    <div class="card stack-sm">
      <div class="row-between">
        <h2>This week</h2>
        <span class="small muted">${formatMinutes(weekTotal)} locked in</span>
      </div>
      <div class="bars">${raw(bars.join(''))}</div>
    </div>
  `;
}

function examsCard() {
  const s = state();
  const exams = upcomingExams(s.subjects, today());
  if (exams.length === 0) return '';

  const items = exams.map(
    ({ subject, days }) => html`
      <div class="list-item">
        <span class="dot" style="background:${safeColour(subject.colour)}"></span>
        <span class="grow truncate">${subject.name}</span>
        <span class="badge ${days <= 14 ? 'warn' : ''}">${days === 0 ? 'today' : `${days} days`}</span>
      </div>
    `,
  );

  return html`
    <div class="card stack-sm">
      <h2>Exams coming up</h2>
      <div class="list">${raw(items.join(''))}</div>
    </div>
  `;
}

function sessionRow(session) {
  const score = focusScore(session);
  const tone = score >= 80 ? 'good' : score >= 50 ? 'warn' : 'bad';
  const detail = [
    timeLabel(session.startedAt),
    formatMinutes(minutesOf(session)),
    session.completed ? 'completed' : 'broke early',
    session.distractions > 0 ? `${session.distractions} slip${session.distractions === 1 ? '' : 's'}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return html`
    <div class="list-item">
      <span class="dot" style="background:${subjectColour(session.subjectId)}"></span>
      <span class="grow">
        <span class="truncate">${session.topic || subjectName(session.subjectId)}</span>
        <br />
        <span class="tiny muted">${subjectName(session.subjectId)} · ${detail}</span>
      </span>
      <span class="badge ${tone}">${score}</span>
    </div>
  `;
}

function recentCard() {
  const recent = state()
    .sessions.filter((s) => s.endedAt)
    .slice(-3)
    .reverse();
  if (recent.length === 0) return '';
  return html`
    <div class="card stack-sm">
      <h2>Recent locks</h2>
      <div class="list">${raw(recent.map(sessionRow).join(''))}</div>
    </div>
  `;
}

function homeView() {
  return html`
    ${raw(topbar())}
    <div class="stack">
      ${raw(heroCard())} ${raw(startCard())} ${raw(weekCard())} ${raw(examsCard())} ${raw(recentCard())}
    </div>
    ${raw(tabs())}
  `;
}

function logView() {
  const s = state();
  const day = today();
  const finished = s.sessions.filter((session) => session.endedAt).reverse();

  const byDay = new Map();
  for (const session of finished) {
    const key = toDayKey(session.startedAt);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(session);
  }

  const groups = [...byDay.entries()].map(
    ([dayKey, sessions]) => html`
      <div class="card stack-sm">
        <div class="row-between">
          <h3>${dayKey === day ? 'Today' : dateLabel(sessions[0].startedAt)}</h3>
          <span class="small muted">${formatMinutes(minutesOnDay(s.sessions, dayKey))}</span>
        </div>
        <div class="list">${raw(sessions.map(sessionRow).join(''))}</div>
      </div>
    `,
  );

  const weekTotals = minutesBySubject(s.sessions, { since: shiftDayKey(day, -6) });
  const ranked = s.subjects
    .map((subject) => ({ subject, minutes: weekTotals[subject.id] ?? 0 }))
    .sort((a, b) => b.minutes - a.minutes);
  const peak = Math.max(1, ...ranked.map((r) => r.minutes));

  const breakdown = ranked.map(
    ({ subject, minutes }) => html`
      <div class="stack-sm">
        <div class="row-between small">
          <span class="truncate">${subject.name}</span>
          <span class="muted">${formatMinutes(minutes)}</span>
        </div>
        <div class="progress">
          <i style="width:${Math.round((minutes / peak) * 100)}%;background:${safeColour(subject.colour)}"></i>
        </div>
      </div>
    `,
  );

  const average = averageFocusScore(s.sessions);

  return html`
    ${raw(topbar())}
    <div class="stack">
      <div class="card stack-sm">
        <h2>All time</h2>
        <div class="row wrap">
          <span class="badge">${formatMinutes(totalMinutes(s.sessions))} locked in</span>
          <span class="badge">${s.sessions.filter((x) => x.completed).length} locks completed</span>
          ${average === null ? '' : raw(`<span class="badge">${average} avg focus</span>`)}
        </div>
      </div>
      ${ranked.length === 0
        ? ''
        : raw(`<div class="card stack"><h2>Last 7 days by subject</h2>${breakdown.join('')}</div>`)}
      ${groups.length === 0
        ? raw('<div class="card"><p class="empty">No locks yet. Your first one is the hard one.</p></div>')
        : raw(groups.join(''))}
    </div>
    ${raw(tabs())}
  `;
}

function settingsView() {
  const s = state();
  const rows = s.subjects.map(
    (subject) => html`
      <div class="list-item">
        <span class="dot" style="background:${safeColour(subject.colour)}"></span>
        <span class="grow truncate">${subject.name}</span>
        <input
          type="date"
          class="small"
          style="width:auto"
          data-exam-for="${subject.id}"
          value="${subject.examDate ?? ''}"
          aria-label="Exam date for ${subject.name}"
        />
        <button class="btn-ghost tiny" data-remove-subject="${subject.id}" aria-label="Remove ${subject.name}">
          Remove
        </button>
      </div>
    `,
  );

  return html`
    ${raw(topbar())}
    <div class="stack">
      <div class="card stack-sm">
        <h2>Targets</h2>
        <label class="field">
          Daily target
          <select id="set-goal">
            ${raw(
              [30, 45, 60, 90, 120, 180]
                .map(
                  (m) =>
                    `<option value="${m}" ${m === s.dailyGoalMinutes ? 'selected' : ''}>${formatMinutes(m)} a day</option>`,
                )
                .join(''),
            )}
          </select>
        </label>
        <label class="field">
          Default lock length
          <select id="set-length">
            ${raw(
              LOCK_LENGTHS.map(
                (m) => `<option value="${m}" ${m === s.defaultLockMinutes ? 'selected' : ''}>${m} minutes</option>`,
              ).join(''),
            )}
          </select>
        </label>
      </div>

      <div class="card stack-sm">
        <h2>Subjects and exam dates</h2>
        <div class="list">${raw(rows.join(''))}</div>
        <div class="row">
          <input id="new-subject" type="text" maxlength="40" placeholder="Add a subject" class="grow" />
          <button class="btn-ghost" id="add-subject">Add</button>
        </div>
      </div>

      <div class="card stack-sm">
        <h2>Your data</h2>
        <p class="small muted">Stored in this browser only. Export it before clearing your browser data.</p>
        <div class="btn-row">
          <button class="btn-ghost" id="export">Export JSON</button>
          <button class="btn-danger" id="reset">Erase everything</button>
        </div>
      </div>
    </div>
    ${raw(tabs())}
  `;
}

function debriefView() {
  const session = state().sessions.find((s) => s.id === view.debriefId);
  if (!session) return homeView();

  const score = focusScore(session);
  const minutes = minutesOf(session);

  return html`
    <header class="topbar"><h1 class="brand">Lock <span>In</span></h1></header>
    <div class="stack">
      <div class="card stack-sm">
        ${session.completed
          ? raw('<p class="done-banner">Lock served in full. That is the whole job.</p>')
          : raw('<p class="small muted">You broke out early. The time you did serve still counts.</p>')}
        <h2>${formatMinutes(minutes)} on ${subjectName(session.subjectId)}</h2>
        ${session.topic ? raw(`<p class="small muted">${escapeHtml(session.topic)}</p>`) : ''}
        <div class="row wrap">
          <span class="badge">Focus ${score}</span>
          <span class="badge ${session.distractions > 0 ? 'warn' : 'good'}">
            ${session.distractions} time${session.distractions === 1 ? '' : 's'} away
          </span>
        </div>
      </div>

      <div class="card stack-sm">
        <h2>Three things, no notes</h2>
        <p class="small muted">
          Write down what you can recall right now. Retrieving it is what makes it stick.
        </p>
        <input type="text" class="recall" maxlength="120" placeholder="1" />
        <input type="text" class="recall" maxlength="120" placeholder="2" />
        <input type="text" class="recall" maxlength="120" placeholder="3" />
      </div>

      <button class="btn-primary" id="save-debrief">Save and finish</button>
    </div>
  `;
}

function topbar() {
  const s = state();
  return html`
    <header class="topbar">
      <h1 class="brand">Lock <span>In</span></h1>
      <span class="small muted">${formatMinutes(minutesOnDay(s.sessions, today()))} today</span>
    </header>
  `;
}

function tabs() {
  const item = (name, label) => html`
    <button data-tab="${name}" ${view.name === name ? raw('aria-current="page"') : ''}>${label}</button>
  `;
  return html`<nav class="tabs">${raw([item('home', 'Today'), item('log', 'Log'), item('settings', 'Settings')].join(''))}</nav>`;
}

/* Wiring ----------------------------------------------------------------- */

function render() {
  const s = state();
  if (!s.onboarded) {
    root.innerHTML = onboardingView();
    bindOnboarding();
    return;
  }

  const views = { home: homeView, log: logView, settings: settingsView, debrief: debriefView };
  root.innerHTML = (views[view.name] ?? homeView)();

  on(root, '[data-tab]', 'click', (e) => go(e.currentTarget.dataset.tab));

  if (view.name === 'home') bindHome();
  if (view.name === 'settings') bindSettings();
  if (view.name === 'debrief') bindDebrief();
}

function bindOnboarding() {
  on(root, '#subject-picker .chip', 'click', (e) => {
    const button = e.currentTarget;
    const pressed = button.getAttribute('aria-pressed') === 'true';
    button.setAttribute('aria-pressed', pressed ? 'false' : 'true');
  });

  qs(root, '#finish-onboarding').addEventListener('click', () => {
    const picked = [...root.querySelectorAll('#subject-picker .chip[aria-pressed="true"]')].map(
      (node) => node.dataset.subject,
    );
    if (picked.length === 0) {
      qs(root, '#subject-picker').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const palette = new Map(GCSE_SUBJECTS.map((s) => [s.name, s.colour]));
    store.update(() => ({
      onboarded: true,
      examBoard: qs(root, '#board').value || null,
      dailyGoalMinutes: Number(qs(root, '#goal').value),
      subjects: picked.map((name) => ({ id: makeId('sub'), name, colour: palette.get(name) ?? '#4f8cff' })),
    }));
    go('home');
  });
}

function bindHome() {
  const topicInput = qs(root, '#topic');
  const s = state();
  const suggestion = suggestSubject(s.subjects, s.sessions, { today: today() });
  view.draft.subjectId = view.draft.subjectId ?? suggestion?.id ?? s.subjects[0]?.id ?? null;
  view.draft.minutes = view.draft.minutes ?? s.defaultLockMinutes;

  topicInput?.addEventListener('input', (e) => {
    view.draft.topic = e.target.value;
  });

  on(root, '[data-pick-subject]', 'click', (e) => {
    view.draft.subjectId = e.currentTarget.dataset.pickSubject;
    render();
  });

  on(root, '[data-pick-minutes]', 'click', (e) => {
    view.draft.minutes = Number(e.currentTarget.dataset.pickMinutes);
    render();
  });

  qs(root, '#start-lock')?.addEventListener('click', () => {
    if (!view.draft.subjectId) return;
    beginLock({
      subjectId: view.draft.subjectId,
      topic: view.draft.topic,
      plannedMinutes: view.draft.minutes,
    });
  });
}

function bindSettings() {
  qs(root, '#set-goal').addEventListener('change', (e) => {
    store.update(() => ({ dailyGoalMinutes: Number(e.target.value) }));
  });

  qs(root, '#set-length').addEventListener('change', (e) => {
    store.update(() => ({ defaultLockMinutes: Number(e.target.value) }));
    view.draft.minutes = null;
  });

  on(root, '[data-exam-for]', 'change', (e) => {
    const id = e.currentTarget.dataset.examFor;
    const value = e.currentTarget.value || null;
    store.update((current) => ({
      subjects: current.subjects.map((s) => (s.id === id ? { ...s, examDate: value } : s)),
    }));
  });

  on(root, '[data-remove-subject]', 'click', (e) => {
    const id = e.currentTarget.dataset.removeSubject;
    const subject = subjectById(id);
    if (!window.confirm(`Remove ${subject?.name}? Your logged sessions stay.`)) return;
    store.update((current) => ({ subjects: current.subjects.filter((s) => s.id !== id) }));
    if (view.draft.subjectId === id) view.draft.subjectId = null;
    render();
  });

  qs(root, '#add-subject').addEventListener('click', () => {
    const input = qs(root, '#new-subject');
    const name = input.value.trim();
    if (!name) return;
    const palette = GCSE_SUBJECTS.map((s) => s.colour);
    const colour = palette[state().subjects.length % palette.length];
    store.update((current) => ({ subjects: [...current.subjects, { id: makeId('sub'), name, colour }] }));
    input.value = '';
    render();
  });

  qs(root, '#export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lock-in-${today()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  qs(root, '#reset').addEventListener('click', () => {
    if (!window.confirm('Erase every subject and session on this device? This cannot be undone.')) return;
    store.reset();
    Object.assign(view, { name: 'home', debriefId: null, draft: { subjectId: null, topic: '', minutes: null } });
    render();
  });
}

function bindDebrief() {
  qs(root, '#save-debrief').addEventListener('click', () => {
    const recall = [...root.querySelectorAll('.recall')].map((input) => input.value.trim()).filter(Boolean);
    store.update((current) => ({
      sessions: current.sessions.map((s) => (s.id === view.debriefId ? { ...s, recall } : s)),
    }));
    view.draft = { subjectId: null, topic: '', minutes: null };
    go('home', { debriefId: null });
  });
}

/* The lock --------------------------------------------------------------- */

function beginLock({ subjectId, topic, plannedMinutes }) {
  const session = startSession({ subjectId, topic, plannedMinutes });
  const subject = subjectById(subjectId);

  lock = new LockController({
    root,
    session,
    subjectName: subject?.name ?? 'Revision',
    subjectColour: subject?.colour ?? '#4f8cff',
    onFinish: ({ session: finished }) => finishLock(finished),
    onBreak: ({ session: broken }) => finishLock(broken),
  });
  lock.start();
}

function finishLock(session) {
  lock = null;
  store.update((current) => ({ sessions: [...current.sessions, session] }));
  go('debrief', { debriefId: session.id });
}

/* Boot ------------------------------------------------------------------- */

render();
