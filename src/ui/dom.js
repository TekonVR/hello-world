/** Tiny DOM helpers. Not a framework: just enough to keep views readable. */

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Mark a string as already-safe HTML so `html` leaves it alone. */
export function raw(value) {
  return { isRaw: true, value: String(value) };
}

function render(value) {
  if (value && value.isRaw) return value.value;
  if (Array.isArray(value)) return value.map(render).join('');
  return escapeHtml(value);
}

/** Tagged template that escapes every interpolated value unless it is `raw`. */
export function html(strings, ...values) {
  return strings.reduce((out, chunk, i) => (i === 0 ? chunk : out + render(values[i - 1]) + chunk), '');
}

/** Only ever let a known-shaped colour reach a style attribute. */
export function safeColour(value) {
  return /^#[0-9a-f]{3,8}$/i.test(String(value ?? '')) ? String(value) : '#4f8cff';
}

export function on(root, selector, event, handler) {
  root.querySelectorAll(selector).forEach((node) => node.addEventListener(event, handler));
}

export function qs(root, selector) {
  return root.querySelector(selector);
}

/** Short day label for the history chart, e.g. "Mon". */
export function dayLabel(dayKey) {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'short' });
}

export function dateLabel(value) {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function timeLabel(value) {
  return new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/** A short rising chime, so the lock ending is audible without an audio file. */
export function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.16 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.16 + 0.42);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.16);
      osc.stop(now + i * 0.16 + 0.45);
    });
    setTimeout(() => ctx.close(), 1600);
  } catch {
    // No audio permission or no AudioContext: the visual end state is enough.
  }
}

export function buzz(pattern = 40) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Vibration is a nice-to-have.
  }
}
