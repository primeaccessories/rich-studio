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
        type: 'lines',
        linesClass: 'hold-line',
        // SplitText's default aria:"auto" stamps an aria-label onto the
        // element, which is prohibited on a <p> with no role and fails
        // axe's aria-prohibited-attr. Splitting by LINES leaves the DOM in
        // reading order, so the label buys nothing here anyway.
        aria: 'none',
      });

      /* Build the roll.

         Each line is turned into a one-line window holding the SAME text
         twice, and the pair is what moves. At rest the real text sits in
         the window; as the hold scrubs, the pair travels down by exactly
         one line so the duplicate takes its place. Because the two faces
         are identical the sentence never disappears and never changes —
         it just turns over, the way a counter does.

         The window is sized from a FACE, measured after the faces are in
         — not from the line box beforehand. Those two are not the same
         number: the line box carries the paragraph's leading, a face is
         its own content box, and sizing the window to the first while the
         roll travels by the second leaves them out of step by a few
         pixels every line. What you see then is the outgoing copy hanging
         below the incoming one, both legible at once. */
      const rolls: HTMLElement[] = [];
      split.lines.forEach((line) => {
        const el = line as HTMLElement;
        const inner = el.innerHTML;

        const roll = document.createElement('span');
        roll.className = 'hold-roll';
        // Duplicate first, real text second: the roll rests at -50% so the
        // REAL line is the one being read, and screen readers still get
        // the sentence exactly once.
        roll.innerHTML =
          `<span class="hold-face" aria-hidden="true">${inner}</span>` +
          `<span class="hold-face">${inner}</span>`;

        el.innerHTML = '';
        el.appendChild(roll);
        rolls.push(roll);
      });

      // Second pass, so every face is laid out before anything is measured.
      rolls.forEach((roll) => {
        const face = roll.firstElementChild as HTMLElement;
        (roll.parentElement as HTMLElement).style.height =
          `${face.getBoundingClientRect().height}px`;
      });

      // NB: the from value is declared on the tween below, not set here.
      // With invalidateOnRefresh, a plain .to() re-reads the CURRENT value
      // as its start on every refresh — so once the rolls had rendered at
      // rest the tween became a no-op and the statement never animated
      // again. That is why the previous version of this appeared to work
      // in code and did nothing at all on the live site.

      gsap
        .timeline({
          scrollTrigger: {
            trigger: el,
            /* Below the hooked band, not behind it. The band is held under
               the header for the whole of this section, so pinning at
               'top top' would put the statement's head underneath it.
               Both measurements are published as custom properties —
               --head-h by the chrome, --band-h by the rail — because
               neither is knowable in CSS here. */
            start: () => {
              const cs = getComputedStyle(document.documentElement);
              const head = parseFloat(cs.getPropertyValue('--head-h')) || 72;
              const band = parseFloat(cs.getPropertyValue('--band-h')) || 0;
              return `top ${Math.round(head + band)}px`;
            },
            end: '+=140%',
            // pin: true,
            // See Masthead: #smooth-content is a containing block, so a
            // fixed pin cannot work inside it.
            // pinType: 'transform',
            scrub: 0.55,
            // Without this the pin measures before webfonts land and the
            // hold ends up the wrong height.
            invalidateOnRefresh: true,
          },
        })
        .fromTo(rolls, { yPercent: -50 }, {
          yPercent: 0,
          // Line after line, like the rows of a board turning over.
          stagger: 0.12,
          ease: 'power2.inOut',
          duration: 0.55,
        });
    }, el);

    /* No backstop needed any more, and that is the point of this shape.
       The previous version hid the words until the scroll revealed them,
       so a trigger that never resolved left the visitor pinned on blank
       paper. Here the text is legible at every value the tween can hold,
       including the one it starts at — a stalled animation costs the roll
       and nothing else. */

    return () => {
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
