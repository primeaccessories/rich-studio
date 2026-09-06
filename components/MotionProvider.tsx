'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Starts the site-wide motion layer, and restarts it on every route change
 * — the reveals bind to elements that no longer exist after a client-side
 * navigation, so a single mount-time init would leave every page after the
 * first one static.
 */
export default function MotionProvider() {
  const pathname = usePathname();

  useEffect(() => {
    let dispose: (() => void) | null = null;
    let cancelled = false;

    // A frame's grace so the new route's DOM is in place before anything
    // is measured.
    const id = requestAnimationFrame(() => {
      import('@/lib/motion')
        .then(({ initMotion }) => {
          if (cancelled) return;
          dispose = initMotion();
        })
        .catch(() => {
          /* motion is an enhancement; the page reads fine without it */
        });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
      dispose?.();
    };
  }, [pathname]);

  return null;
}
