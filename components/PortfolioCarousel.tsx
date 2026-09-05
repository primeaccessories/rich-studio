'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createRegistration, type RegistrationHandle } from '@/lib/registration';
import { useDropTransition } from './DropTransition';
import type { WorkItem } from '@/lib/work';

/**
 * THE WORK BANNER — a depth stack.
 *
 * Projects queue receding into the distance. Scrolling pulls the front
 * card forward and past the camera, and the next takes its place: one by
 * one, driven entirely by scroll position.
 *
 * Everything sits on the real 12-column grid rather than on eyeballed
 * viewport percentages — the card spans columns 3-10, the counter aligns
 * to the column 1 edge, the CTA to the column 12 edge, and the caption to
 * the card's own left edge. Rich is exacting about format and position, so
 * every value here resolves from --col, never from a guess.
 *
 * Desktop only. On touch this becomes a native scroll-snap row: same order,
 * no pinning, no hijack, no 3D cost on a mid-range phone.
 */

/** How many cards either side of the front one stay mounted. */
const WINDOW = 2;
/** Z-distance between consecutive cards, px. */
const STEP_Z = 380;

export default function PortfolioCarousel({ items }: { items: WorkItem[] }) {
  const root = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<RegistrationHandle | null>(null);
  const cache = useRef<Map<string, HTMLImageElement>>(new Map());
  const activeRef = useRef(0);

  const [active, setActive] = useState(0);
  const [glReady, setGlReady] = useState(false);
  const [is3D, setIs3D] = useState(false);

  const drop = useDropTransition();
  const n = items.length;

  const load = useCallback(
    (i: number): Promise<HTMLImageElement> | undefined => {
      const item = items[i];
      if (!item) return;
      const hit = cache.current.get(item.slug);
      if (hit) return hit.complete ? Promise.resolve(hit) : undefined;
      const img = new Image();
      img.decoding = 'async';
      img.src = item.thumb;
      cache.current.set(item.slug, img);
      return img.decode().then(() => img).catch(() => img);
    },
    [items],
  );

  useEffect(() => {
    const el = root.current;
    if (!el || n === 0) return;

    const fine = window.matchMedia('(pointer: fine)').matches;
    const wide = window.matchMedia('(min-width: 901px)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const use3D = fine && wide && !reduced;
    setIs3D(use3D);

    gsap.registerPlugin(ScrollTrigger);

    let st: ScrollTrigger | null = null;
    let actIO: IntersectionObserver | null = null;
    let warmIO: IntersectionObserver | null = null;
    let ro: ResizeObserver | null = null;
    let cancelled = false;
    let started = false;

    /** Position every mounted card for a continuous head position `pos`. */
    const layout = (pos: number) => {
      for (let i = 0; i < n; i++) {
        const card = cardRefs.current[i];
        if (!card) continue;
        const d = i - pos; // 0 = front, >0 receding, <0 past the camera

        if (d < -1.15 || d > WINDOW + 0.5) {
          card.style.visibility = 'hidden';
          continue;
        }
        card.style.visibility = 'visible';

        // Behind the front card: recede in even Z steps and dim.
        // In front of it: accelerate past the camera and fade out.
        const z = d >= 0 ? -d * STEP_Z : d * STEP_Z * 2.1;
        // Queued cards also step up and right. Without an offset they sit
        // dead centre behind the front card and, at 72% scale, are hidden
        // by it completely — so the stack never reads as a stack.
        // The offset has to CLEAR the front card, not just nudge: at
        // z -380 a card renders at ~76% scale, so its half-width is ~110px
        // shorter than the front card's. Anything under that stays hidden
        // behind it and the stack reads as a single card.
        const ox = d >= 0 ? d * 170 : 0;
        const oy = d >= 0 ? -d * 118 : 0;
        const opacity =
          d >= 0
            ? Math.max(0, 1 - d / (WINDOW + 0.9))
            : Math.max(0, 1 + d / 1.05);

        card.style.transform =
          `translate3d(calc(-50% + ${ox.toFixed(1)}px), calc(-50% + ${oy.toFixed(1)}px), ${z.toFixed(1)}px)`;
        card.style.opacity = opacity.toFixed(3);
        card.style.zIndex = String(1000 - Math.round(Math.abs(d) * 10));
      }

      // The front slot rides the card currently parked at the front, and
      // only becomes visible as that card settles.
      const slot = frontRef.current;
      if (slot) {
        const nearest = Math.round(pos);
        const dz = nearest - pos;                  // -0.5 .. 0.5
        const z = dz >= 0 ? -dz * STEP_Z : dz * STEP_Z * 2.1;
        slot.style.transform = `translate3d(-50%, -50%, ${z.toFixed(1)}px)`;
        slot.style.opacity = Math.max(0, 1 - Math.abs(dz) / 0.32).toFixed(3);
        slot.style.zIndex = '1001';
      }
    };

    const start = async () => {
      if (started || cancelled) return;
      started = true;

      const first = await load(0);
      if (cancelled || !first) return;

      const canvas = canvasRef.current;
      if (canvas) {
        const handle = createRegistration(canvas, first);
        if (handle) {
          handleRef.current = handle;
          setGlReady(true);
          handle.setProgress(use3D ? 0.42 : 1);
          ro = new ResizeObserver(() => handle.resize());
          ro.observe(canvas);
        }
      }
      load(1);

      if (!use3D) {
        // Row mode is pure CSS flex + scroll-snap. layout() writes inline
        // transforms, opacity and visibility, which would fight it and
        // leave the cards shifted off-screen and dimmed.
        return;
      }

      layout(0);

      st = ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        // One full viewport of scroll per project, so the pace is even and
        // predictable rather than a percentage that drifts with content.
        end: `+=${n * 100}%`,
        pin: true,
        // pinType MUST be explicit. #smooth-content carries
        // will-change: transform, which makes it a containing block, so a
        // position:fixed pin does not work inside it. GSAP infers this from
        // the smoother — but React runs CHILD effects before the PARENT's,
        // so these triggers are built before ScrollSmoother exists and the
        // inference silently picks 'fixed'. It worked locally and failed in
        // production, which is exactly the shape of a race.
        pinType: 'transform',
        scrub: 0.55,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const pos = self.progress * (n - 1);
          layout(pos);

          const idx = Math.min(n - 1, Math.max(0, Math.round(pos)));
          if (idx !== activeRef.current) {
            activeRef.current = idx;
            setActive(idx);
            const img = cache.current.get(items[idx].slug);
            const h = handleRef.current;
            if (h) {
              if (img && img.complete) h.setImage(img);
              else
                load(idx)?.then((im) => {
                  if (!cancelled && activeRef.current === idx) h.setImage(im);
                });
            }
            load(idx + 1);
          }

          // The front card registers as it arrives and holds true while it
          // is the one being read. Floors at 0.42, never 0: this section
          // exists to SHOW the work, and a plate at full misregister is an
          // unreadable dot field.
          const dz = Math.abs(Math.round(pos) - pos);
          handleRef.current?.setProgress(
            0.42 + (1 - Math.min(1, dz / 0.5)) * 0.58,
          );
        },
      });

      ScrollTrigger.refresh();
    };

    warmIO = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          warmIO?.disconnect();
          start();
        }
      },
      { rootMargin: '100% 0px' },
    );
    warmIO.observe(el);

    // The banner is a DARK act, so the whole page turns over to it —
    // otherwise the fixed nav and HUD stay ink-on-ink and disappear.
    // An IntersectionObserver, not a ScrollTrigger: while this section is
    // pinned it is position:fixed, so a second trigger measuring the same
    // element reads a rect that never moves and never fires.
    const rootEl = document.documentElement;
    actIO = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          rootEl.style.setProperty('--act', '#091017');
          rootEl.style.setProperty('--act-ink', '#f0f0ef');
        } else {
          rootEl.style.removeProperty('--act');
          rootEl.style.removeProperty('--act-ink');
        }
      },
      { threshold: 0.9 },
    );
    actIO.observe(el);

    return () => {
      cancelled = true;
      ro?.disconnect();
      actIO?.disconnect();
      warmIO?.disconnect();
      // kill(true) REVERTS the pin. ScrollTrigger's pin wraps this element
      // in a generated .pin-spacer, changing its DOM parent; without the
      // revert React unmounts against a stale parent and throws
      // "removeChild: node is not a child of this node".
      st?.kill(true);
      rootEl.style.removeProperty('--act');
      rootEl.style.removeProperty('--act-ink');
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, [n, items, load]);

  // Touch mode: keep the counter honest as the user swipes.
  const onScrollRow = (e: React.UIEvent<HTMLDivElement>) => {
    if (is3D) return;
    const row = e.currentTarget;
    const i = Math.round((row.scrollLeft / row.scrollWidth) * n);
    if (i !== activeRef.current) {
      activeRef.current = Math.min(n - 1, Math.max(0, i));
      setActive(activeRef.current);
    }
  };

  if (n === 0) return null;
  const item = items[active];

  return (
    /* Wrapper React owns, so ScrollTrigger's pin-spacer is inserted inside
       it. Without this React unmounts against a reparented node. */
    <div className="pin-host">
      <section
        ref={root}
        className={`pf${is3D ? ' is-3d' : ' is-row'}`}
        aria-label="Selected work"
      >
        <div className="pf-spill" aria-hidden="true" />

        {/* Column 1 edge. */}
        <span className="t-mono pf-count" aria-hidden="true">
          {String(active + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
        </span>

        <div
          className="pf-stage"
          ref={stageRef}
          onScroll={onScrollRow}
        >
          {/* ONE canvas, parked at the front slot rather than mounted
              inside a card. A canvas that moves between cards is a NEW DOM
              element each time, while the GL context stays bound to the old
              detached one — which is why the front card rendered black.
              It fades in only as a card parks, so registration stays an
              arrival device and the work is read in register. */}
          {is3D && (
            <div className="pf-front" ref={frontRef} aria-hidden="true">
              <canvas ref={canvasRef} className="pf-canvas" />
            </div>
          )}
          {items.map((w, i) => (
            <div
              key={w.slug}
              ref={(node) => {
                cardRefs.current[i] = node;
              }}
              className={`pf-card${i === active ? ' is-front' : ''}`}
            >
              <div className="pf-plate">
                <img
                  src={w.thumb}
                  alt={`${w.client} — ${w.title}`}
                  className="pf-img"
                  /* All lazy: the banner is below the fold on every
                     viewport, and eager cards here were stealing bandwidth
                     from the masthead's text LCP. */
                  loading="lazy"
                  decoding="async"
                />
              </div>

              {/* Caption aligns to the card's own left edge, not centred —
                  a fixed relationship to the grid rather than to the
                  viewport. */}
              <div className="pf-caption">
                <span className="t-mono pf-num">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="t-statement pf-title">{w.title}</span>
                <span className="t-mono pf-client">{w.client}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Column 12 edge. */}
        <Link
          href={`/work/${item.slug}`}
          className="pf-cta t-mono"
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            const front =
              cardRefs.current[active]?.querySelector<HTMLElement>('.pf-plate') ??
              null;
            drop(`/work/${item.slug}`, front, item.thumb);
          }}
        >
          VIEW PROJECT
        </Link>

        {/* The stack is a scroll device and invisible to assistive tech.
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
