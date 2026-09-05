'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createRegistration, type RegistrationHandle } from '@/lib/registration';
import { useDropTransition } from './DropTransition';
import type { WorkItem } from '@/lib/work';

/**
 * THE PORTFOLIO CAROUSEL.
 *
 * A pinned dark act. One project holds the centre of the screen at a time;
 * scrolling steps through them. Each project arrives OUT OF REGISTER and
 * pulls true within its own slice of the scrub, so the mechanic that names
 * the site is also the thing that carries its centrepiece.
 *
 * Deliberately ONE WebGL context with a swapped texture, not one per
 * project. Nine contexts would sit near the browser's ~16 ceiling for no
 * reason, and only one is ever visible.
 */
export default function PortfolioCarousel({ items }: { items: WorkItem[] }) {
  const root = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drop = useDropTransition();
  const handleRef = useRef<RegistrationHandle | null>(null);
  const cache = useRef<Map<string, HTMLImageElement>>(new Map());
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [glReady, setGlReady] = useState(false);

  const n = items.length;

  // Load (and remember) one project's plate.
  function load(i: number): Promise<HTMLImageElement> | undefined {
    const item = items[i];
    if (!item) return;
    const hit = cache.current.get(item.slug);
    if (hit) return hit.complete ? Promise.resolve(hit) : undefined;
    const img = new Image();
    img.decoding = 'async';
    img.src = item.thumb;
    cache.current.set(item.slug, img);
    return img.decode().then(() => img).catch(() => img);
  }

  useEffect(() => {
    const el = root.current;
    const canvas = canvasRef.current;
    if (!el || !canvas || n === 0) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.registerPlugin(ScrollTrigger);
    let st: ScrollTrigger | null = null;
    let actIO: IntersectionObserver | null = null;
    let warmIO: IntersectionObserver | null = null;
    let ro: ResizeObserver | null = null;
    let cancelled = false;

    // Defer everything expensive until the carousel is within a screen of
    // the viewport. Creating the GL context and uploading the first texture
    // during initial load cost ~160ms of blocking time for a section the
    // visitor has not reached yet.
    let started = false;
    const start = async () => {
      if (started || cancelled) return;
      started = true;
      const first = await load(0);
      if (cancelled || !first) return;

      const handle = createRegistration(canvas, first);
      if (!handle) return; // no WebGL2 — the <img> fallback stays visible
      handleRef.current = handle;
      setGlReady(true);
      handle.setProgress(reduced ? 1 : 0);

      ro = new ResizeObserver(() => handle.resize());
      ro.observe(canvas);

      // (the dark-act trigger is created after the pin below — creating it
      //  first leaves it measuring a document height the pin then changes)

      // Warm the next plate so stepping forward never shows an empty panel.
      load(1);

      if (reduced) {
        // No pin, no scrub. The carousel becomes a plain list further down.
        return;
      }

      st = ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: `+=${n * 90}%`,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const t = self.progress * n;
          const idx = Math.min(n - 1, Math.max(0, Math.floor(t)));
          const sub = t - idx;

          if (idx !== activeRef.current) {
            activeRef.current = idx;
            setActive(idx);
            const img = cache.current.get(items[idx].slug);
            if (img && img.complete) handle.setImage(img);
            else load(idx)?.then((im) => {
              if (!cancelled && activeRef.current === idx) handle.setImage(im);
            });
            load(idx + 1);
          }

          // Registers from 0.42, never from 0. This is the one section
          // whose job is to SHOW the work — a plate at full misregister is
          // an unreadable dot field, and you cannot tell whose project you
          // are looking at. It reads as a misprint, then resolves.
          handle.setProgress(0.42 + Math.min(1, sub / 0.55) * 0.58);
        },
      });

      ScrollTrigger.refresh();
    };

    const warm = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          warm.disconnect();
          start();
        }
      },
      { rootMargin: '100% 0px' },
    );
    warm.observe(el);
    warmIO = warm;

    // The carousel is a DARK act, so the whole page turns over to it —
    // otherwise the fixed nav and HUD stay ink-on-ink and disappear.
    //
    // Deliberately an IntersectionObserver rather than a ScrollTrigger:
    // while the section is pinned it is position:fixed, so a second
    // ScrollTrigger measuring the same element reads a rect that never
    // moves and never fires. IO is immune to that, and it also works
    // under reduced motion where no pin is created at all.
    const rootEl = document.documentElement;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          rootEl.style.setProperty('--act', '#091017');
          rootEl.style.setProperty('--act-ink', '#f0f0ef');
        } else {
          rootEl.style.removeProperty('--act');
          rootEl.style.removeProperty('--act-ink');
        }
      },
      // 0.9, not 0.5: at half-visible the page turned dark while the
      // masthead was still on screen, which reads as a bug rather than as
      // an act change. The turnover happens when the carousel owns the
      // viewport.
      { threshold: 0.9 },
    );
    io.observe(el);
    actIO = io;

    return () => {
      cancelled = true;
      ro?.disconnect();
      // kill(true) REVERTS the pin. ScrollTrigger's pin wraps this element
      // in a .pin-spacer, which changes its DOM parent; without the revert
      // React unmounts against a stale parent and throws
      // "removeChild: node is not a child of this node".
      st?.kill(true);
      actIO?.disconnect();
      warmIO?.disconnect();
      document.documentElement.style.removeProperty('--act');
      document.documentElement.style.removeProperty('--act-ink');
      handleRef.current?.destroy();
      handleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  if (n === 0) return null;
  const item = items[active];

  return (
    /* This wrapper exists so ScrollTrigger's pin-spacer is inserted INSIDE
       a node React owns. Pinning reparents .pf into a generated spacer;
       without the wrapper React unmounts against a stale parent and throws
       "removeChild: node is not a child of this node", which kills the
       destination page mid-navigation. */
    <div className="pin-host">
    <section ref={root} className="pf" aria-label="Selected work">
      {/* Light spill along the bottom edge — the reference does this in
          electric blue; his brand is paper and ink, so the spill is paper. */}
      <div className="pf-spill" aria-hidden="true" />

      <span className="t-mono pf-count" aria-hidden="true">
        {String(active + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
      </span>

      <div className="pf-stage">
        <div className="pf-panel" ref={panelRef}>
          {/* The <img> is the floor for no-WebGL and for first paint. */}
          <img
            src={item.thumb}
            alt=""
            aria-hidden="true"
            className={`pf-img${glReady ? ' is-hidden' : ''}`}
          />
          <canvas ref={canvasRef} className="pf-canvas" aria-hidden="true" />
        </div>

        {/* The reference sets the project name OVER the image, but its
            images are abstract renders. Rich's work is graphic design and
            usually already contains type — laying a headline across a
            Wall's campaign lockup just fights it. The name sits under the
            plate instead, as a caption. */}
        <div className="pf-caption">
          <span className="t-statement pf-title">{item.title}</span>
          <span className="t-mono pf-client">{item.client}</span>
        </div>
      </div>

      {/* A real Link, so middle-click, ctrl-click and crawlers all behave.
          The handler only intercepts a plain left click. */}
      <Link
        href={`/work/${item.slug}`}
        className="pf-cta t-mono"
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          drop(`/work/${item.slug}`, panelRef.current, item.thumb);
        }}
      >
        VIEW PROJECT
      </Link>

      {/* The carousel is a scroll device and invisible to assistive tech.
          This list is the real, complete, always-reachable navigation. */}
      <ul className="pf-index">
        {items.map((w, i) => (
          <li key={w.slug}>
            <Link
              href={`/work/${w.slug}`}
              className={`t-mono pf-index-link${i === active ? ' is-on' : ''}`}
            >
              <span className="pf-index-num">
                {String(i + 1).padStart(2, '0')}
              </span>
              {w.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
    </div>
  );
}
