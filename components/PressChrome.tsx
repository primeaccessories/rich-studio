'use client';

import { useEffect, useState } from 'react';

/**
 * The print furniture: corner crop marks, the margin HUD, visible column
 * rules and the grain plate. Restrained by ruling — corners and HUD only;
 * colour bars are reserved for act transitions.
 *
 * All of this lives OUTSIDE #smooth-content so ScrollSmoother's transform
 * never drags it around.
 */

function useLondonClock() {
  // Rendered null on the server and on first paint, then filled in. A live
  // clock in SSR output is a guaranteed hydration mismatch.
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hhmm = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Europe/London',
      }).format(now);
      const tz = new Intl.DateTimeFormat('en-GB', {
        timeZoneName: 'short',
        timeZone: 'Europe/London',
      })
        .formatToParts(now)
        .find((p) => p.type === 'timeZoneName')?.value;
      setTime(`${hhmm} (${tz})`);
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return time;
}

export function ColumnRules({ count = 12 }: { count?: number }) {
  return (
    <div className="column-rules" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}

export default function PressChrome() {
  const time = useLondonClock();
  return (
    <>
      <ColumnRules />

      <div className="furniture" aria-hidden="true">
        <span className="crop crop-tl" />
        <span className="crop crop-tr" />
        <span className="crop crop-bl" />
        <span className="crop crop-br" />
      </div>

      {/* The slug line. Screen-reader-hidden: it is furniture, not content. */}
      <div className="hud hud-l t-mono" aria-hidden="true">
        <span className="t-mono-b"><span className="rc-mark" />RICH COLVILL</span>
        <br />
        BRANDING / DESIGN
      </div>

      <div className="hud hud-r t-mono" aria-hidden="true">
        C 15&#176; &nbsp; M 75&#176; &nbsp; Y 45&#176;
        <br />
        {time ?? ' '}
      </div>

      <div className="grain" aria-hidden="true" />
    </>
  );
}
