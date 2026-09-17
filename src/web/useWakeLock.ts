/**
 * Hold the screen awake for the length of a sprint, where the browser allows
 * it. Safari and Firefox may not, and a sprint works fine without it.
 */

import { useEffect } from 'react';

export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return undefined;

    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
      } catch {
        // Denied, or the page is not visible. Nothing depends on it.
      }
    };

    // The lock is dropped whenever the tab is hidden, so take it again on return.
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !cancelled) request();
    };

    request();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      lock?.release().catch(() => {});
    };
  }, [active]);
}
