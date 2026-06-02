'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

/** Ticking real-time clock. Respects prefers-reduced-motion (updates every minute when set). */
export function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const interval = reducedMotion ? 60_000 : 1_000;
    const id = setInterval(() => setNow(new Date()), interval);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="font-mono text-3xl font-semibold tabular-nums tracking-tight text-fg">
      {format(now, 'HH:mm:ss')}
    </span>
  );
}
