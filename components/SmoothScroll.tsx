'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

/**
 * ScrollSmoother wrapper.
 *
 * Deliberately desktop-pointer-only. On touch, hijacked scrolling is the
 * single most resented thing a site can do, and on reduced-motion it is a
 * straight accessibility failure — both keep native scroll, and every
 * ScrollTrigger pin still works exactly the same because ScrollTrigger
 * does not depend on the smoother.
 */
export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  const smootherRef = useRef<ScrollSmoother | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (!fine || reduced) {
      // Native scroll. Still refresh so any pins measure correctly.
      ScrollTrigger.refresh();
      return;
    }

    smootherRef.current = ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 1.05,
      effects: true,
      normalizeScroll: true,
      ignoreMobileResize: true,
    });

    return () => {
      smootherRef.current?.kill();
      smootherRef.current = null;
    };
  }, []);

  return (
    <div id="smooth-wrapper">
      <div id="smooth-content">{children}</div>
    </div>
  );
}
