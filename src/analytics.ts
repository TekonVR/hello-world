/**
 * Event-based analytics from day one (section 10).
 *
 * Events are buffered on the device and handed to a sink. The MVP's sink is a
 * no-op in production and a console logger in development; the questions the
 * spec wants answered ("which sprint length and time of day does this student
 * actually complete") are answerable from this event stream alone.
 *
 * Nothing here records what a student answered, only that they answered.
 */

export type AnalyticsEventName =
  | 'onboarding_completed'
  | 'sprint_started'
  | 'sprint_completed'
  | 'sprint_abandoned'
  | 'sprint_left_app'
  | 'move_answered'
  | 'suggestion_swapped'
  | 'notification_tapped';

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  at: number;
  props: Record<string, string | number | boolean>;
}

type Sink = (event: AnalyticsEvent) => void;

let sink: Sink = (event) => {
  if (__DEV__) console.log(`[analytics] ${event.name}`, event.props);
};

export function setAnalyticsSink(next: Sink): void {
  sink = next;
}

export function track(
  name: AnalyticsEventName,
  props: Record<string, string | number | boolean> = {},
): AnalyticsEvent {
  const event: AnalyticsEvent = { name, at: Date.now(), props };
  try {
    sink(event);
  } catch {
    // Analytics must never break a sprint.
  }
  return event;
}
