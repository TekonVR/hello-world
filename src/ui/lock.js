/**
 * The lock itself.
 *
 * A browser tab cannot stop a student opening TikTok, so the lock does the two
 * things it honestly can: it makes leaving deliberate (hold to break, a
 * full-screen view with nothing else on it) and it makes leaving visible
 * (every tab switch is counted and shown afterwards).
 *
 * The countdown is driven by wall-clock time rather than by counting ticks, so
 * a throttled or backgrounded tab still finishes at the right moment.
 */

import { MS_PER_MINUTE, formatClock } from '../lib/logic.js';
import { playChime, buzz, qs, safeColour } from './dom.js';

const BREAK_HOLD_MS = 3000;
const TICK_MS = 250;

export class LockController {
  /**
   * @param {object} options
   * @param {HTMLElement} options.root       element the lock renders into
   * @param {object} options.session         session from `startSession`
   * @param {string} options.subjectName
   * @param {string} options.subjectColour
   * @param {(result: {session: object}) => void} options.onFinish  lock ran to the end
   * @param {(result: {session: object}) => void} options.onBreak   student broke out early
   */
  constructor({ root, session, subjectName, subjectColour, onFinish, onBreak }) {
    this.root = root;
    this.session = session;
    this.subjectName = subjectName;
    this.subjectColour = safeColour(subjectColour);
    this.onFinish = onFinish;
    this.onBreak = onBreak;

    this.durationMs = session.plannedMinutes * MS_PER_MINUTE;
    this.distractions = 0;
    this.leftAt = null;
    this.timer = null;
    this.holdTimer = null;
    this.holdStartedAt = null;
    this.finished = false;
    this.wakeLock = null;

    this.handleVisibility = this.handleVisibility.bind(this);
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
  }

  start() {
    document.body.classList.add('is-locked');
    this.render();
    this.bind();
    this.requestFullscreen();
    this.requestWakeLock();
    this.timer = setInterval(() => this.tick(), TICK_MS);
    this.tick();
  }

  remainingMs() {
    return this.session.startedAt + this.durationMs - Date.now();
  }

  tick() {
    if (this.finished) return;
    const remaining = this.remainingMs();
    const clock = qs(this.root, '.clock');
    if (clock) clock.textContent = formatClock(remaining);

    const ring = qs(this.root, '.ring .run');
    if (ring) {
      const served = Math.min(1, Math.max(0, 1 - remaining / this.durationMs));
      const circumference = Number(ring.dataset.circumference);
      ring.style.strokeDashoffset = String(circumference * (1 - served));
    }

    if (remaining <= 0) this.complete();
  }

  complete() {
    if (this.finished) return;
    this.finished = true;
    const endedAt = this.session.startedAt + this.durationMs;
    this.teardown();
    playChime();
    buzz([80, 60, 80]);
    this.onFinish({
      session: {
        ...this.session,
        endedAt,
        actualMs: this.durationMs,
        distractions: this.distractions,
        completed: true,
      },
    });
  }

  breakLock() {
    if (this.finished) return;
    this.finished = true;
    const endedAt = Date.now();
    this.teardown();
    buzz(120);
    this.onBreak({
      session: {
        ...this.session,
        endedAt,
        actualMs: Math.max(0, endedAt - this.session.startedAt),
        distractions: this.distractions,
        completed: false,
      },
    });
  }

  /* Leaving the tab ------------------------------------------------------ */

  handleVisibility() {
    if (this.finished) return;
    if (document.hidden) {
      this.leftAt = Date.now();
      return;
    }
    if (this.leftAt === null) return;
    const awayMs = Date.now() - this.leftAt;
    this.leftAt = null;
    // Ignore a momentary blur: only a real trip away from the app counts.
    if (awayMs < 2000) return;
    this.distractions += 1;
    this.showWarning(
      `You left the lock ${this.distractions} time${this.distractions === 1 ? '' : 's'}. Get back to it.`,
    );
    buzz(60);
  }

  handleBeforeUnload(event) {
    if (this.finished) return;
    event.preventDefault();
    event.returnValue = '';
  }

  showWarning(message) {
    const node = qs(this.root, '.warning');
    if (node) node.textContent = message;
  }

  /* Hold to break -------------------------------------------------------- */

  startHold(event) {
    event.preventDefault();
    if (this.finished || this.holdTimer) return;
    this.holdStartedAt = Date.now();
    const fill = qs(this.root, '.hold > i');
    this.holdTimer = setInterval(() => {
      const held = Date.now() - this.holdStartedAt;
      if (fill) fill.style.width = `${Math.min(100, (held / BREAK_HOLD_MS) * 100)}%`;
      if (held >= BREAK_HOLD_MS) {
        this.cancelHold();
        this.breakLock();
      }
    }, 40);
  }

  cancelHold() {
    if (this.holdTimer) clearInterval(this.holdTimer);
    this.holdTimer = null;
    this.holdStartedAt = null;
    const fill = qs(this.root, '.hold > i');
    if (fill) fill.style.width = '0%';
  }

  /* Screen --------------------------------------------------------------- */

  async requestFullscreen() {
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      // Full screen is a nudge, not a requirement: iOS Safari refuses it.
    }
  }

  async requestWakeLock() {
    try {
      this.wakeLock = (await navigator.wakeLock?.request('screen')) ?? null;
    } catch {
      // Screen may sleep. The wall-clock timer survives it either way.
    }
  }

  async exitFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      // Nothing to do if the browser will not leave full screen.
    }
  }

  teardown() {
    clearInterval(this.timer);
    this.cancelHold();
    document.removeEventListener('visibilitychange', this.handleVisibility);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    document.body.classList.remove('is-locked');
    this.wakeLock?.release?.().catch(() => {});
    this.wakeLock = null;
    this.exitFullscreen();
  }

  bind() {
    document.addEventListener('visibilitychange', this.handleVisibility);
    window.addEventListener('beforeunload', this.handleBeforeUnload);

    const hold = qs(this.root, '.hold');
    const down = (event) => this.startHold(event);
    const up = () => this.cancelHold();
    hold.addEventListener('pointerdown', down);
    hold.addEventListener('pointerup', up);
    hold.addEventListener('pointercancel', up);
    hold.addEventListener('pointerleave', up);
  }

  render() {
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    this.root.innerHTML = `
      <section class="lock">
        <p class="subject" style="color:${this.subjectColour}"></p>
        ${this.session.topic ? '<p class="topic"></p>' : ''}
        <svg class="ring" viewBox="0 0 280 280" aria-hidden="true">
          <circle class="track" cx="140" cy="140" r="${radius}"></circle>
          <circle
            class="run"
            cx="140"
            cy="140"
            r="${radius}"
            transform="rotate(-90 140 140)"
            data-circumference="${circumference}"
            style="stroke-dasharray:${circumference};stroke-dashoffset:${circumference};stroke:${this.subjectColour}"
          ></circle>
        </svg>
        <p class="clock" role="timer" aria-live="off">${formatClock(this.durationMs)}</p>
        <p class="warning" aria-live="polite"></p>
        <button class="hold" type="button" aria-label="Hold for three seconds to break the lock">
          <i></i><span>Hold to break the lock</span>
        </button>
        <p class="tiny muted">Phone face down. Nothing else open. This is the bit that counts.</p>
      </section>
    `;
    // The topic is set from the student's own input, so escape it after the fact.
    const topic = qs(this.root, '.topic');
    if (topic) topic.textContent = this.session.topic;
    const subject = qs(this.root, '.subject');
    if (subject) subject.textContent = this.subjectName;
  }
}
