'use client';

import { useEffect, useRef, useState } from 'react';
import type { Facet } from '@/lib/work';

/**
 * THE INDEX BY INDUSTRY
 *
 * The categories set large and centred, one per line, with a sample from
 * that category standing either side of the name. Picking one filters the
 * archive below it rather than navigating away — the samples are there to
 * tell you what is behind the word before you commit to it.
 *
 * Which line is live is decided differently by input:
 *   fine pointer   hover, or keyboard focus
 *   coarse pointer whichever line is nearest the middle of the screen,
 *                  since there is no hover to give and nothing should be
 *                  unreachable on a phone
 *
 * Every sample stays mounted and is revealed by opacity, so moving down
 * the list never blinks through an empty frame waiting on a fetch. That
 * is affordable only because these are 420px derivatives; with the grid
 * thumbs it would be three quarters of a megabyte.
 */
export default function WorkCategories({
  facets,
  active,
  onPick,
}: {
  facets: Facet[];
  active: string;
  onPick: (name: string) => void;
}) {
  const [live, setLive] = useState<string>(facets[0]?.name ?? '');
  const rootRef = useRef<HTMLDivElement>(null);

  // Coarse pointers get the nearest line to the middle of the viewport.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: fine)').matches) return;
    const root = rootRef.current;
    if (!root) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const mid = window.innerHeight / 2;
        let best: string | null = null;
        let bestD = Infinity;
        root.querySelectorAll<HTMLElement>('[data-facet]').forEach((el) => {
          const r = el.getBoundingClientRect();
          const d = Math.abs(r.top + r.height / 2 - mid);
          if (d < bestD) {
            bestD = d;
            best = el.dataset.facet ?? null;
          }
        });
        if (best) setLive(best);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="cats" aria-labelledby="cats-h">
      <div className="cats-head">
        <span className="t-mono page-label" id="cats-h">
          <span className="target" aria-hidden="true" /> BY INDUSTRY
        </span>
      </div>

      <div className="cats-stage" ref={rootRef}>
        {/* The two sheets. Every facet's pair is here; only the live one
            is shown. aria-hidden because the sample says nothing the
            category name has not already said. */}
        <div className="cats-plate cats-plate-l" aria-hidden="true">
          {facets.map((f) => (
            <img
              key={f.name}
              src={f.samples[0]}
              alt=""
              loading="lazy"
              decoding="async"
              width={420}
              height={560}
              className={`cats-img${live === f.name ? ' is-live' : ''}`}
            />
          ))}
        </div>

        <ul className="cats-list">
          {facets.map((f) => (
            <li key={f.name} data-facet={f.name}>
              <button
                type="button"
                className={`cats-item t-wordmark${active === f.name ? ' is-on' : ''}`}
                aria-pressed={active === f.name}
                onMouseEnter={() => setLive(f.name)}
                onFocus={() => setLive(f.name)}
                onClick={() => onPick(active === f.name ? 'ALL' : f.name)}
              >
                {f.name}
                <span className="t-mono cats-count">
                  {String(f.count).padStart(2, '0')}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="cats-plate cats-plate-r" aria-hidden="true">
          {facets.map((f) =>
            // LUXURY holds a single project. One sheet, not the same
            // picture twice pretending to be two.
            f.samples[1] ? (
              <img
                key={f.name}
                src={f.samples[1]}
                alt=""
                loading="lazy"
                decoding="async"
                width={420}
                height={560}
                className={`cats-img${live === f.name ? ' is-live' : ''}`}
              />
            ) : null,
          )}
        </div>
      </div>
    </section>
  );
}
