/**
 * Hash routing, by hand.
 *
 * Six screens and no nested layouts do not need a router library, and hash
 * routes mean the app can be served as static files from anywhere without
 * server rewrites.
 */

import { useCallback, useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'onboarding'; step: 'subjects' | 'details' | 'dates' }
  | { name: 'sprint'; id: string }
  | { name: 'summary'; id: string; faceDown: number; before: number }
  | { name: 'progress' }
  | { name: 'settings' };

export function toHash(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'onboarding':
      return `#/onboarding/${route.step}`;
    case 'sprint':
      return `#/sprint/${route.id}`;
    case 'summary':
      return `#/summary/${route.id}?faceDown=${route.faceDown}&before=${route.before}`;
    default:
      return `#/${route.name}`;
  }
}

export function parseHash(hash: string): Route {
  const [path, query] = hash.replace(/^#\/?/, '').split('?');
  const parts = path.split('/').filter(Boolean);
  const params = new URLSearchParams(query ?? '');

  if (parts[0] === 'onboarding') {
    const step = parts[1];
    if (step === 'details' || step === 'dates') return { name: 'onboarding', step };
    return { name: 'onboarding', step: 'subjects' };
  }
  if (parts[0] === 'sprint' && parts[1]) return { name: 'sprint', id: parts[1] };
  if (parts[0] === 'summary' && parts[1]) {
    return {
      name: 'summary',
      id: parts[1],
      faceDown: Number(params.get('faceDown') ?? 0),
      before: Number(params.get('before') ?? 0),
    };
  }
  if (parts[0] === 'progress') return { name: 'progress' };
  if (parts[0] === 'settings') return { name: 'settings' };
  return { name: 'home' };
}

export function useRoute() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  /** Push a new screen, or replace the current one where going back would be wrong. */
  const go = useCallback((next: Route, { replace = false } = {}) => {
    const hash = toHash(next);
    if (replace) window.history.replaceState(null, '', hash);
    else window.history.pushState(null, '', hash);
    setRoute(next);
    window.scrollTo(0, 0);
  }, []);

  return { route, go };
}
