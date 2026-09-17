/**
 * One notification a day, at a time the student picks, phrased as an offer
 * (section 6.1). If it is ignored, nothing else is sent that day. There are no
 * streak-loss warnings and no guilt.
 */

import * as Notifications from 'expo-notifications';

import { track } from './analytics';

const CHANNEL_ID = 'daily-nudge';

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

function parseTime(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export async function scheduleDailyNudge(time: string, topicName: string | null): Promise<boolean> {
  const parsed = parseTime(time);
  if (!parsed) return false;

  try {
    const permission = await Notifications.getPermissionsAsync();
    const granted =
      permission.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return false;

    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Lock In', body: nudgeBody(topicName) },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: parsed.hour,
        minute: parsed.minute,
        channelId: CHANNEL_ID,
      },
    });
    track('notification_tapped', { scheduled: true, time });
    return true;
  } catch {
    // Web, a simulator without permissions, or a user who said no: the app
    // works without the nudge.
    return false;
  }
}

export async function cancelNudges(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Nothing scheduled, or no notification support here.
  }
}
