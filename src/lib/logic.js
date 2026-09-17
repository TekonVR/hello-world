/**
 * Pure logic for Lock In. No DOM, no storage: everything here is a plain
 * function over plain data so it can be unit tested with `node --test`.
 */

export const MS_PER_MINUTE = 60_000;

/** Turn a Date into a local YYYY-MM-DD key. Sessions are bucketed by local day. */
export function toDayKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Shift a YYYY-MM-DD key by a whole number of days. */
export function shiftDayKey(dayKey, days) {
  const [y, m, d] = dayKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toDayKey(date);
}

/** "25:00" / "1:05:00" for a millisecond duration, clamped at zero. */
export function formatClock(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

/** "1h 25m" for a whole number of minutes. */
export function formatMinutes(minutes) {
  const mins = Math.max(0, Math.round(minutes));
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export function minutesOf(session) {
  return Math.round((session.actualMs ?? 0) / MS_PER_MINUTE);
}

/**
 * A session counts towards stats once it is finished and the student actually
 * stayed locked in for a minute or more. Abandoned sessions still count the
 * time served: quitting early is honest, deleting the evidence is not.
 */
export function isCounted(session) {
  return Boolean(session.endedAt) && (session.actualMs ?? 0) >= MS_PER_MINUTE;
}

export function countedSessions(sessions) {
  return sessions.filter(isCounted);
}

export function totalMinutes(sessions) {
  return countedSessions(sessions).reduce((sum, s) => sum + minutesOf(s), 0);
}

export function minutesOnDay(sessions, dayKey) {
  return countedSessions(sessions)
    .filter((s) => toDayKey(s.startedAt) === dayKey)
    .reduce((sum, s) => sum + minutesOf(s), 0);
}

/** { [subjectId]: minutes }, optionally limited to sessions since a day key. */
export function minutesBySubject(sessions, { since } = {}) {
  const totals = {};
  for (const session of countedSessions(sessions)) {
    if (since && toDayKey(session.startedAt) < since) continue;
    totals[session.subjectId] = (totals[session.subjectId] ?? 0) + minutesOf(session);
  }
  return totals;
}

/**
 * Consecutive days, ending today or yesterday, that hit the daily goal.
 * Yesterday is allowed as the anchor so the streak does not look broken
 * first thing in the morning before any revision has happened.
 */
export function currentStreak(sessions, { today, dailyGoalMinutes }) {
  const goal = Math.max(1, dailyGoalMinutes);
  const hit = (dayKey) => minutesOnDay(sessions, dayKey) >= goal;

  let cursor = today;
  if (!hit(cursor)) {
    cursor = shiftDayKey(cursor, -1);
    if (!hit(cursor)) return 0;
  }

  let streak = 0;
  while (hit(cursor)) {
    streak += 1;
    cursor = shiftDayKey(cursor, -1);
  }
  return streak;
}

/** Last `days` days, oldest first, for the dashboard bar chart. */
export function dailyHistory(sessions, { today, days = 7 }) {
  const history = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const dayKey = shiftDayKey(today, -offset);
    history.push({ dayKey, minutes: minutesOnDay(sessions, dayKey) });
  }
  return history;
}

/**
 * 100 for a clean session, minus 8 per time the student left the app, minus
 * the share of the planned time they did not serve. Deliberately blunt: it is
 * a nudge, not a grade.
 */
export function focusScore(session) {
  if (!isCounted(session)) return 0;
  const planned = Math.max(1, session.plannedMinutes) * MS_PER_MINUTE;
  const served = Math.min(1, (session.actualMs ?? 0) / planned);
  const score = 100 * served - 8 * (session.distractions ?? 0);
  return Math.max(0, Math.min(100, Math.round(score)));
}

/** Whole-app focus score across counted sessions, or null when there are none. */
export function averageFocusScore(sessions) {
  const counted = countedSessions(sessions);
  if (counted.length === 0) return null;
  const sum = counted.reduce((total, s) => total + focusScore(s), 0);
  return Math.round(sum / counted.length);
}

/**
 * The subject to revise next: the one with the least time in the last week,
 * with the nearest exam breaking ties. Neglected subjects rise to the top.
 */
export function suggestSubject(subjects, sessions, { today, windowDays = 7 } = {}) {
  if (subjects.length === 0) return null;
  const since = shiftDayKey(today, -(windowDays - 1));
  const totals = minutesBySubject(sessions, { since });

  return [...subjects].sort((a, b) => {
    const diff = (totals[a.id] ?? 0) - (totals[b.id] ?? 0);
    if (diff !== 0) return diff;
    const examA = a.examDate ?? '9999-99-99';
    const examB = b.examDate ?? '9999-99-99';
    if (examA !== examB) return examA < examB ? -1 : 1;
    return a.name.localeCompare(b.name);
  })[0];
}

/** Whole days from today until an exam date. Negative once it has passed. */
export function daysUntil(examDate, today) {
  const parse = (key) => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
  };
  return Math.round((parse(examDate) - parse(today)) / 86_400_000);
}

/** Subjects with an upcoming exam, soonest first. */
export function upcomingExams(subjects, today, { limit = 3 } = {}) {
  return subjects
    .filter((s) => s.examDate && daysUntil(s.examDate, today) >= 0)
    .sort((a, b) => (a.examDate < b.examDate ? -1 : 1))
    .slice(0, limit)
    .map((s) => ({ subject: s, days: daysUntil(s.examDate, today) }));
}

let idCounter = 0;
export function makeId(prefix = 'id') {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}`;
}

export function startSession({ subjectId, topic, plannedMinutes, startedAt = Date.now() }) {
  return {
    id: makeId('ses'),
    subjectId,
    topic: (topic ?? '').trim(),
    plannedMinutes,
    startedAt,
    endedAt: null,
    actualMs: 0,
    distractions: 0,
    completed: false,
    recall: [],
  };
}

export function endSession(session, { endedAt = Date.now(), completed = false } = {}) {
  return {
    ...session,
    endedAt,
    actualMs: Math.max(0, endedAt - session.startedAt),
    completed,
  };
}
