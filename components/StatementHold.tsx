'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

/**
 * The one pinned hold on the homepage.
 *
 * The section pins and his positioning statement is DRAWN as you scroll:
 * each word wiped in from its own baseline, one after another, so the
 * sentence is written rather than faded up. Rich writes in caps, so the
 * words are already the right shape for this.
 *
 * A clip, not an opacity ramp. The line version of this had to be given a
 * 0.45 opacity floor because axe caught the text mid-fade below contrast;
 * a clipped word is either full ink or not painted at all, so there is no
 * halfway state to fail.
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
        // Lines AND words: the lines keep the copy wrapping as it should,
        // the words are what actually get drawn.
        type: 'lines,words',
        linesClass: 'hold-line',
        wordsClass: 'hold-word',
        // SplitText's default aria:"auto" stamps an aria-label onto the
        // element, which is prohibited on a <p> with no role and fails
        // axe's aria-prohibited-attr. Splitting by LINES leaves the DOM in
        // reading order, so the label buys nothing here anyway.
        aria: 'none',
      });

      // NB: the from value is declared on the tween below, not set here.
      // With invalidateOnRefresh, a plain .to() re-reads the CURRENT value
      // as its start on every refresh — so once the words had rendered at
      // 1 the tween became 1 -> 1 and the statement never animated again.
      // That is why the line version of this appeared to work in code and
      // did nothing on the live site.

      gsap
        .timeline({
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: '+=140%',
            pin: true,
            // See Masthead: #smooth-content is a containing block, so a
            // fixed pin cannot work inside it.
            pinType: 'transform',
            scrub: 0.8,
            // Without this the pin measures before webfonts land and the
            // hold ends up the wrong height.
            invalidateOnRefresh: true,
          },
        })
        .fromTo(split.words, { '--wp': 0 }, {
          '--wp': 1,
          // Tight enough that the sentence is written at reading pace
          // rather than crawling a word at a time.
          stagger: 0.045,
          ease: 'none',
          duration: 0.5,
        });
    }, el);

    /* The failure state this animation must never have.

       A clipped word is invisible but its opacity is 1, so the motion
       layer's safety sweep — which looks for things left transparent —
       cannot see it. And this section PINS: if the trigger never resolves,
       the visitor is held on a viewport of blank paper with no way to
       scroll past it.

       So: if the hold is on screen and the timeline has still not moved a
       few seconds in, paint the words and let the scroll go. */
    const backstop = window.setTimeout(() => {
      const r = el.getBoundingClientRect();
      const onScreen = r.top < window.innerHeight && r.bottom > 0;
      const stalled = ScrollTrigger.getAll().every(
        (t) => t.trigger !== el || t.progress === 0,
      );
      if (onScreen && stalled) {
        el.querySelectorAll<HTMLElement>('.hold-word').forEach((w) => {
          w.style.setProperty('--wp', '1');
        });
      }
    }, 5000);

    return () => {
      window.clearTimeout(backstop);
      split?.revert();
      ctx.revert();
    };
  }, []);

  return (
    <div className="pin-host">
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
    </div>
  );
}
