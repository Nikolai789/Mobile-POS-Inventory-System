import { useEffect } from 'react';

/** Routing itself is smoke-tested separately; hook tests control focus as a lifecycle. */
export const focus = { active: true };
export function useTestFocusEffect(effect: () => void | (() => void)) {
  const active = focus.active;
  useEffect(() => {
    if (active) return effect();
  }, [effect, active]);
}
