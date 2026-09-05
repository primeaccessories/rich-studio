'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/* His own rotating featured straps, verbatim from the live site. */
const STRAPS = [
  { line: 'REBRANDING THE WORLDS MOST ICONIC CIRCUIT', client: 'SILVERSTONE', slug: 'silverstone' },
  { line: 'PEOPLE POWERED BRANDING', client: 'ASTUTE', slug: 'astute' },
  { line: 'UNAPOLOGETICALLY HEALTHY BRANDING', client: 'BY BRYONY™', slug: 'by-bryony' },
  { line: 'A TWIST ON A LOVABLE BRAND', client: "WALL'S", slug: 'walls' },
  { line: 'SUPPORTING MENS MENTAL HEALTH', client: 'WINGMEN', slug: 'wingmen' },
];

/**
 * The masthead.
 *
 * The wordmark loads OUT OF REGISTER — three ink plates, offset and
 * multiply-blended — and pulls into register as you make the first scroll.
 * Nothing autoplays. The thesis is delivered by the visitor's own input,
 * which is the difference between a site that performs at you and one that
 * responds to you.
 */
export default function Masthead() {
  const root = useRef<HTMLElement>(null);
  const [strap, setStrap] = useState(0);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      el.style.setProperty('--p', '1');
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const band = el.querySelector<HTMLElement>('.masthead-foot');

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: '+=110%',
      pin: true,
      // pinType MUST be explicit. #smooth-content carries
      // will-change: transform, which makes it a containing block, so a
      // position:fixed pin does not work inside it. GSAP infers this from
      // the smoother — but React runs CHILD effects before the PARENT's,
      // so these triggers are built before ScrollSmoother exists and the
      // inference silently picks 'fixed'. It worked locally and failed in
      // production, which is exactly the shape of a race.
      pinType: 'transform',
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const t = self.progress;

        // The wordmark registers over the first half of the travel.
        el.style.setProperty('--p', (0.34 + Math.min(1, t / 0.5) * 0.66).toFixed(3));

        // Black Ink's move, in his words via the Black Ink build: "the
        // banner should scroll up and sit under the nav". The band rises
        // from the foot of the hero to just under the header, and its
        // ::after carries the ink down behind it so the page turns black
        // from the bottom up — handing straight over to the dark carousel.
        if (band) {
          const capTop = 58; // clears the nav strip
          const travel = Math.max(
            0,
            window.innerHeight - band.offsetHeight - capTop,
          );
          band.style.transform = `translate3d(0, ${(-travel * t).toFixed(1)}px, 0)`;
        }
      },
    });

    return () => {
      // kill(true) reverts the pin; ScrollTrigger reparents the pinned
      // element into a .pin-spacer and React unmounts against a stale
      // parent otherwise.
      st.kill(true);
      if (band) band.style.transform = '';
    };
  }, []);

  // Strap rotation is the one thing that moves on its own, and only
  // because it is his — the live site cycles these today.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(
      () => setStrap((s) => (s + 1) % STRAPS.length),
      4200,
    );
    return () => window.clearInterval(id);
  }, []);

  const current = STRAPS[strap];

  return (
    <div className="pin-host">
    <section
      ref={root}
      className="masthead sheet"
      /* Starts partly registered, not at full chaos. A rainbow explosion on
         first paint reads as broken rather than as a deliberate misprint. */
      style={{ ['--p' as string]: '0.34' }}
    >
      <h1 className="wordmark t-wordmark">
        <span className="wordmark-stack" aria-hidden="true">
          {(['c', 'm', 'y', 'k'] as const).map((plate) => (
            <span className={`wm-plate wm-${plate}`} key={plate}>
              <span className="wm-line">
                <span className="wm-reg rc-mark" />RICH
              </span>
              <span className="wm-line">COLVILL</span>
            </span>
          ))}
        </span>
        <span className="sr-only">&#174;Rich Colvill</span>
      </h1>

      {/* His work is in the first viewport, not a mood word. It arrives out
          of register with the wordmark and resolves on the same scroll. */}
      <div className="masthead-plate" aria-hidden="true" key={current.slug}>
        {(['c', 'm', 'k'] as const).map((plate) => (
          <img
            key={plate}
            src={`/work/${current.slug}/thumb.webp`}
            alt=""
            className={`mp-img mp-${plate}`}
            /* Never high: the LCP here is the wordmark TEXT, so this image
               must not compete with the font it is waiting on. */
            fetchPriority="low"
            loading="lazy"
            decoding="async"
          />
        ))}
      </div>

      <div className="masthead-foot">
        <p className="t-statement masthead-strap">
          BRANDING / DESIGN /
          <br />
          CREATIVE PRODUCTION
          <br />
          STUDIO
        </p>

        <div className="masthead-feature">
          <span className="t-mono">FEATURED</span>
          <Link href={`/work/${current.slug}`} className="feature-link">
            <span className="t-caps feature-line" key={current.slug}>
              {current.line}
            </span>
            <span className="t-mono t-mono-b feature-client">
              / {current.client}
            </span>
          </Link>
          <div className="feature-dots" role="tablist" aria-label="Featured work">
            {STRAPS.map((s, i) => (
              <button
                key={s.slug}
                type="button"
                role="tab"
                aria-selected={i === strap}
                aria-label={`${s.line} / ${s.client}`}
                className={`feature-dot${i === strap ? ' is-on' : ''}`}
                onClick={() => setStrap(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
    </div>
  );
}
