'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

/**
 * The one pinned hold on the homepage.
 *
 * The section pins, and his positioning statement registers line by line —
 * each line arriving out of register and pulling true. Rich writes in caps,
 * so the lines are already the right shape for this.
 *
 * Under reduced motion the pin is never created and the statement is simply
 * present and in register. Nothing is lost but the performance.
 */
export default function StatementHold() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.registerPlugin(ScrollTrigger, SplitText);

    const target = el.querySelector<HTMLElement>('.hold-copy');
    if (!target) return;

    let split: SplitText | null = null;
    const ctx = gsap.context(() => {
      split = new SplitText(target, {
        type: 'lines',
        linesClass: 'hold-line',
        // SplitText's default aria:"auto" stamps an aria-label onto the
        // element, which is prohibited on a <p> with no role and fails
        // axe's aria-prohibited-attr. Splitting by LINES leaves the DOM in
        // reading order, so the label buys nothing here anyway.
        aria: 'none',
      });

      gsap.set(split.lines, { '--lp': 0 });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: '+=140%',
            pin: true,
            scrub: 0.8,
            // Without this the pin measures before webfonts land and the
            // hold ends up the wrong height.
            invalidateOnRefresh: true,
          },
        })
        .to(split.lines, {
          '--lp': 1,
          stagger: 0.16,
          ease: 'expo.out',
          duration: 1,
        });
    }, el);

    return () => {
      split?.revert();
      ctx.revert();
    };
  }, []);

  return (
    <div ref={root} className="hold">
      <div className="sheet hold-inner">
        <span className="t-mono hold-label">
          <span className="target" aria-hidden="true" /> STATEMENT OF PRACTICE
        </span>

        {/* Verbatim from his site. */}
        <p className="t-statement hold-copy">
          WE HELP BUSINESSES STAND OUT THROUGH CREATIVE PRODUCTION. RICH
          COLVILL&#174; IS A TEAM OF CREATIVE CREATURES FOCUSSED ON EXECUTING
          HIGH END BRANDING, VISUALS AND ROLL-OUT IN THE DRINKS / BEAUTY /
          FASHION / CONSUMER GOODS PROFESSIONAL SERVICES / AUTOMOTIVE
          INDUSTRIES.
        </p>

        <p className="t-body hold-body">
          WITH OVER 25 YEARS INDUSTRY EXPERIENCE, WORKING ACROSS A VARIETY OF
          BRANDS INCLUDING SILVERSTONE, ADIDAS, ODEON, WALL&#39;S, PERNOD
          RICARD, VIVIENNE WESTWOOD, NESTLE, ABSOLUT, DHL, COSTA, SELLOTAPE,
          SONY, PENHALIGON&#39;S, CLOUD NINE AND MOLTON BROWN
        </p>
      </div>
    </div>
  );
}
