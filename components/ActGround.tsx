'use client';

import { useEffect } from 'react';

/**
 * Repaints the page in a case study's own ground colour — the act change.
 *
 * The colour is sampled at build time from that project's artwork, so all
 * colour on the site still originates in Rich's work rather than in a
 * palette we imposed on him. The ink colour is chosen by luminance so text
 * stays legible on whatever the sampling returns.
 */
export default function ActGround({
  ground,
  ink,
}: {
  ground: string;
  ink: string;
}) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--act', ground);
    root.style.setProperty('--act-ink', ink);
    return () => {
      root.style.removeProperty('--act');
      root.style.removeProperty('--act-ink');
    };
  }, [ground, ink]);

  return null;
}
