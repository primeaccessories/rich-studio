'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createRegistration, type RegistrationHandle } from '@/lib/registration';

/**
 * The case-study hero — the one place the real shader runs.
 *
 * The section pins and the plates register across the scrub. The press
 * plate coming into register IS the scroll payoff; there is no other
 * reward for the hold, and there does not need to be.
 *
 * If WebGL2 is missing the canvas never appears and the plain <img>
 * underneath stays visible, so the page degrades to a sharp photograph
 * rather than an empty box.
 */
export default function RegistrationHero({
  src,
  alt,
  title,
  client,
  meta,
}: {
  src: string;
  alt: string;
  title: string;
  client: string;
  meta: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = root.current;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!el || !canvas || !img) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let handle: RegistrationHandle | null = null;
    let st: ScrollTrigger | null = null;
    let ro: ResizeObserver | null = null;
    let cancelled = false;

    const start = () => {
      if (cancelled) return;
      handle = createRegistration(canvas, img);
      if (!handle) return; // no WebGL2 — leave the <img> showing

      canvas.classList.add('is-live');

      if (reduced) {
        handle.setProgress(1);
        return;
      }

      handle.setProgress(0);

      st = ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: '+=180%',
        pin: true,
        scrub: 0.7,
        invalidateOnRefresh: true,
        onUpdate: (self) => handle?.setProgress(self.progress),
      });

      ro = new ResizeObserver(() => handle?.resize());
      ro.observe(canvas);
    };

    gsap.registerPlugin(ScrollTrigger);

    if (img.complete && img.naturalWidth) start();
    else img.addEventListener('load', start, { once: true });

    return () => {
      cancelled = true;
      img.removeEventListener('load', start);
      ro?.disconnect();
      // kill(true) REVERTS the pin. ScrollTrigger's pin wraps this element
      // in a .pin-spacer, which changes its DOM parent; without the revert
      // React unmounts against a stale parent and throws
      // "removeChild: node is not a child of this node".
      st?.kill(true);
      handle?.destroy();
    };
  }, []);

  return (
    /* See PortfolioCarousel: the pin reparents this node, so React needs a
       wrapper it can safely remove. */
    <div className="pin-host">
    <div ref={root} className="cs-hero">
      <div className="cs-hero-media">
        <img ref={imgRef} src={src} alt={alt} className="cs-hero-img" />
        <canvas ref={canvasRef} className="cs-hero-canvas" aria-hidden="true" />
      </div>

      <div className="cs-hero-caption sheet">
        <span className="t-mono cs-hero-client">{client}</span>
        <h1 className="t-display cs-hero-title">{title}</h1>
        <span className="t-mono cs-hero-meta">{meta}</span>
      </div>
    </div>
    </div>
  );
}
