import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Returns `false` during SSR and the initial hydration pass, then `true` on the
 * client. Use it to gate UI that depends on client-only state (e.g. a persisted
 * Zustand store) so the first client render matches the server and there is no
 * hydration mismatch — without a `setState`-in-effect mount flag.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
