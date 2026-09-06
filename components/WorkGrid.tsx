'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import RegisteredImage from './RegisteredImage';
import { useDropTransition } from './DropTransition';
import type { WorkItem } from '@/lib/work';

/**
 * The work index.
 *
 * Tiles are mixed-scale on a shared 12-column module — a uniform card grid
 * is the Behance look the doctrine blacklists. Each tile sits out of
 * register until hovered or focused.
 *
 * Facets are his own (DISCIPLINES / INDUSTRIES), rebuilt as real buttons
 * with aria-pressed rather than the plugin's div soup.
 */

/* A repeating span pattern that breaks the grid without randomising it —
   randomness reflows on every render and looks accidental rather than set. */
const SPANS = [7, 5, 4, 8, 6, 6, 5, 7, 4, 8, 6, 6];

export default function WorkGrid({
  items,
  disciplines,
  industries,
  heading,
}: {
  items: WorkItem[];
  disciplines: string[];
  industries: string[];
  heading: string;
}) {
  const [disc, setDisc] = useState('ALL');
  const [ind, setInd] = useState('ALL');
  const drop = useDropTransition();

  const filtered = useMemo(
    () =>
      items.filter(
        (w) =>
          (disc === 'ALL' || w.disciplines.includes(disc)) &&
          (ind === 'ALL' || w.industries.includes(ind)),
      ),
    [items, disc, ind],
  );

  return (
    <section className="work sheet" id="work">
      <div className="work-head">
        <h2 className="t-display" data-split>{heading}</h2>

        <div className="facets" data-reveal="stagger">
          <fieldset className="facet">
            <legend className="t-mono">DISCIPLINES.</legend>
            {['ALL', ...disciplines].map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={disc === d}
                className={`facet-btn t-mono${disc === d ? ' is-on' : ''}`}
                onClick={() => setDisc(d)}
              >
                {d}
              </button>
            ))}
          </fieldset>

          <fieldset className="facet">
            <legend className="t-mono">INDUSTRIES.</legend>
            {['ALL', ...industries].map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={ind === d}
                className={`facet-btn t-mono${ind === d ? ' is-on' : ''}`}
                onClick={() => setInd(d)}
              >
                {d}
              </button>
            ))}
          </fieldset>
        </div>
      </div>

      {/* aria-live so filtering announces its result to a screen reader
          instead of silently swapping the grid underneath it. */}
      <p className="t-mono work-count" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? 'PROJECT' : 'PROJECTS'}
      </p>

      {filtered.length === 0 ? (
        <p className="t-statement work-empty">NOTHING UNDER THAT COMBINATION.</p>
      ) : (
        <ul className="work-grid grid12" data-reveal="stagger">
          {filtered.map((w, i) => (
            <li
              key={w.slug}
              className="work-tile"
              style={{ ['--span' as string]: SPANS[i % SPANS.length] }}
            >
              <Link
                href={`/work/${w.slug}`}
                className="work-link"
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  drop(
                    `/work/${w.slug}`,
                    e.currentTarget.querySelector<HTMLElement>('.work-thumb'),
                    w.thumb,
                  );
                }}
              >
                <RegisteredImage
                  src={w.thumb}
                  alt={`${w.client} — ${w.title}`}
                  className="work-thumb"
                  /* Nothing here is above the fold on a phone. Eagerly
                     fetching three 1600px heroes was starving the fonts
                     that the text LCP is waiting on. */
                  priority={false}
                />
                <div className="work-cap">
                  <span className="t-mono t-mono-b work-num">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="t-caps work-title">{w.title}</span>
                  <span className="t-mono work-facet">
                    {[...w.disciplines, ...w.industries].slice(0, 2).join(' / ')}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
