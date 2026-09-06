'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PressHero, { PRESS_PROJECTS, PRESS_START } from './PressHero';

/**
 * The landing hero: the press rail, then the ink band.
 *
 * The band is a normal section following the pinned stage, so it rides up
 * over the hero on scroll while the veil fades the press to black — the
 * same move Black Ink makes, done the way the stage was designed.
 *
 * The giant type block that used to live here is gone: the rail replaces
 * it. The (R) mark still leads the nav, the HUD and the footer.
 */
export default function Masthead() {
  const [idx, setIdx] = useState(PRESS_START);
  const router = useRouter();
  const current = PRESS_PROJECTS[idx];

  // The rail owns its own position; the ticks ask it to move.
  const goTo = useCallback((i: number) => {
    const stage = document.querySelector('.stage') as
      | (HTMLElement & { __goTo?: (n: number) => void })
      | null;
    stage?.__goTo?.(i);
    setIdx(i);
  }, []);

  return (
    <>
      <PressHero
        onIndex={setIdx}
        onOpen={(slug) => router.push(`/work/${slug}`)}
      />

      {/* .pin-host is not decoration: ScrollTrigger's pin reparents the
          band into a .pin-spacer, and React would then unmount it against
          a parent that no longer holds it. The wrapper is a node React
          owns and ScrollTrigger never touches. */}
      <div className="pin-host band-host">
      <section className="masthead-foot hero-band">
        <p className="t-statement masthead-strap" data-split>
          BRANDING / DESIGN /
          <br />
          CREATIVE PRODUCTION
          <br />
          STUDIO
        </p>

        <div className="masthead-feature" aria-live="polite" aria-atomic="true">
          <span className="t-mono">FEATURED</span>
          <Link href={`/work/${current.slug}`} className="feature-link">
            <span className="t-caps feature-line" key={current.slug}>
              {current.title}
            </span>
            <span className="t-mono t-mono-b feature-client">
              / {current.client}
            </span>
          </Link>

          <div className="feature-dots" role="tablist" aria-label="Featured work">
            {PRESS_PROJECTS.map((p, i) => (
              <button
                key={p.slug}
                type="button"
                role="tab"
                aria-selected={i === idx}
                aria-label={`${p.title} / ${p.client}`}
                className={`feature-dot${i === idx ? ' is-on' : ''}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </div>

        <div className="colophon t-mono" data-reveal>
          <span>BY APPOINTMENT ONLY&nbsp;&nbsp;11A&#8211;4P MON / THU</span>
          <span>
            EST. 25 YEARS &nbsp;·&nbsp; SHEET{' '}
            {String(idx + 1).padStart(2, '0')}
          </span>
        </div>

        {/* The rail is a scroll device and invisible to assistive tech.
            This list is the real, complete, always-reachable navigation. */}
        <ul className="hero-index">
          {PRESS_PROJECTS.map((p, i) => (
            <li key={p.slug}>
              <Link href={`/work/${p.slug}`} className="t-mono hero-index-link">
                <span className="hero-index-num">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      </div>
    </>
  );
}
