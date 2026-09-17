/**
 * Persistence for Lock In. Everything lives in one JSON blob in localStorage:
 * there is no account, no server and no data leaving the device.
 *
 * `createStore` takes a storage adapter so the same code runs under tests with
 * a plain in-memory object.
 */

export const STORAGE_KEY = 'lockin.state.v1';
export const SCHEMA_VERSION = 1;

export function defaultState() {
  return {
    version: SCHEMA_VERSION,
    onboarded: false,
    examBoard: null,
    dailyGoalMinutes: 60,
    defaultLockMinutes: 25,
    subjects: [],
    sessions: [],
  };
}

/** Fill in anything a stored blob is missing so an old save never crashes the app. */
export function migrate(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  return {
    ...base,
    ...raw,
    version: SCHEMA_VERSION,
    subjects: Array.isArray(raw.subjects) ? raw.subjects : base.subjects,
    sessions: Array.isArray(raw.sessions) ? raw.sessions : base.sessions,
    dailyGoalMinutes: Number(raw.dailyGoalMinutes) || base.dailyGoalMinutes,
    defaultLockMinutes: Number(raw.defaultLockMinutes) || base.defaultLockMinutes,
  };
}

export function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  };
}

export function createStore(storage) {
  let state = defaultState();
  const listeners = new Set();

  function read() {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      state = migrate(raw ? JSON.parse(raw) : null);
    } catch {
      // A corrupt or unreadable save should not lock the student out of the app.
      state = defaultState();
    }
    return state;
  }

  function write() {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Private browsing or a full quota: keep running from memory this session.
    }
  }

  function notify() {
    for (const listener of listeners) listener(state);
  }

  return {
    load: read,
    get: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    /** `updater` receives the current state and returns the next one. */
    update(updater) {
      state = { ...state, ...updater(state) };
      write();
      notify();
      return state;
    },
    reset() {
      state = defaultState();
      try {
        storage.removeItem(STORAGE_KEY);
      } catch {
        // Nothing to do: the in-memory reset above is what the student sees.
      }
      notify();
      return state;
    },
  };
}
