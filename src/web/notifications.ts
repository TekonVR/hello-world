/**
 * The one daily nudge (section 6.1), as far as a web app can honestly take it.
 *
 * A browser tab cannot wake itself at half past five. Real scheduled nudges
 * need a service worker plus a push service, which is backend work and is not
 * in this build. What is here: permission, the copy, and a check that fires the
 * notification if the app is open at the chosen time and nothing has been done
 * that day. If it is ignored, nothing else is sent.
 */

import { toDayKey } from '../engine/time';

const LAST_NUDGE_KEY = 'lockin.lastNudge';

/** Offers, not demands. One is picked at random each day. */
export function nudgeBody(topicName: string | null): string {
  const offers = topicName
    ? [
        `15 minutes on ${topicName}? Your call.`,
        `${topicName} is queued up if you fancy it.`,
        `Got 15 minutes? ${topicName} is ready when you are.`,
      ]
    : ['15 minutes, one topic, your call.', 'A sprint is ready when you are.'];
  return offers[Math.floor(Math.random() * offers.length)];
}

export function parseTime(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export async function requestNudgePermission(): Promise<boolean> {
  try {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

/** True if the nudge for today has already gone out. */
function alreadyNudgedToday(now: number): boolean {
  try {
    return window.localStorage.getItem(LAST_NUDGE_KEY) === toDayKey(now);
  } catch {
    return false;
  }
}

function markNudged(now: number): void {
  try {
    window.localStorage.setItem(LAST_NUDGE_KEY, toDayKey(now));
  } catch {
    // Nothing to do: at worst the nudge is offered twice in one day.
  }
}

export function maybeNudge(options: {
  time: string | null;
  topicName: string | null;
  sprintsToday: number;
  now?: number;
}): boolean {
  const now = options.now ?? Date.now();
  if (!options.time || options.sprintsToday > 0) return false;

  const parsed = parseTime(options.time);
  if (!parsed) return false;

  const date = new Date(now);
  const due =
    date.getHours() > parsed.hour ||
    (date.getHours() === parsed.hour && date.getMinutes() >= parsed.minute);
  if (!due || alreadyNudgedToday(now)) return false;

  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return false;
    new Notification('Lock In', { body: nudgeBody(options.topicName), icon: '/icon-192.png' });
    markNudged(now);
    return true;
  } catch {
    return false;
  }
}
