/**
 * "Phone down" on the web.
 *
 * Section 5 asks for phone-down to be rewarded rather than policed. A web app
 * cannot read the proximity sensor, but device motion is available on Android
 * Chrome without a permission prompt, and on iOS Safari only after an explicit
 * gesture, which is not worth interrupting a sprint for.
 *
 * So this is strictly best effort: where readings arrive, face-down time is
 * counted and the student is thanked for it afterwards; where they do not, the
 * app simply says nothing about it.
 */

import { useEffect, useRef, useState } from 'react';

/** Gravity points into the screen when the phone is face down. */
const FACE_DOWN_Z = -7.5;

export function usePhoneDown(active: boolean) {
  const [supported, setSupported] = useState(false);
  const [isDown, setIsDown] = useState(false);
  const faceDownMs = useRef(0);
  const lastAt = useRef(Date.now());

  useEffect(() => {
    if (!active || typeof window === 'undefined' || !('DeviceMotionEvent' in window)) {
      return undefined;
    }

    const onMotion = (event: DeviceMotionEvent) => {
      const z = event.accelerationIncludingGravity?.z;
      if (typeof z !== 'number') return;

      setSupported(true);
      const now = Date.now();
      const elapsed = Math.min(now - lastAt.current, 2000);
      lastAt.current = now;

      const down = z < FACE_DOWN_Z;
      setIsDown(down);
      if (down) faceDownMs.current += elapsed;
    };

    window.addEventListener('devicemotion', onMotion);
    return () => window.removeEventListener('devicemotion', onMotion);
  }, [active]);

  return {
    supported,
    isDown,
    faceDownSeconds: () => Math.round(faceDownMs.current / 1000),
  };
}
