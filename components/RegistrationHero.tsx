'use client';

import { useEffect, useRef } from 'react';

/**
 * THE CASE-STUDY HERO
 *
 * Opening a case study prints it. The hero image is separated into C/M/Y/K
 * and run through the press: black down first, then cyan, magenta, yellow,
 * each wiping across the sheet, each landing out of register and pulling
 * itself in, halftone visible while the ink is wet.
 *
 * This is the same `lib/press` module the hero rail uses — imported, not
 * copied, so the two can never drift apart.
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

    let disposed = false;
    const cleanups: Array<() => void> = [];

    (async () => {
      let THREE: typeof import('three');
      let press: typeof import('@/lib/press');
      try {
        [THREE, press] = await Promise.all([import('three'), import('@/lib/press')]);
      } catch {
        return; // the <img> underneath stays visible
      }
      if (disposed) return;

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const ready = () =>
        img.complete && img.naturalWidth
          ? Promise.resolve()
          : new Promise<void>((res) => img.addEventListener('load', () => res(), { once: true }));
      await ready();
      if (disposed) return;

      // The sheet is drawn at the hero's own aspect so the shader's uv maps
      // straight onto a fullscreen quad with no letterboxing maths.
      const narrow = window.innerWidth < 820;
      const SW = narrow ? 620 : 1200;
      const rect = el.getBoundingClientRect();
      const SH = Math.max(
        200,
        Math.round(SW * (rect.height / Math.max(1, rect.width))),
      );

      const sheet = document.createElement('canvas');
      sheet.width = SW;
      sheet.height = SH;
      const ctx = sheet.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      const scale = Math.max(SW / img.naturalWidth, SH / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, (SW - dw) / 2, (SH - dh) / 2, dw, dh);

      let sep: import('three').DataTexture;
      try {
        sep = press.separationTexture(sheet, SW, SH);
      } catch {
        return; // tainted canvas — leave the plain photograph
      }

      const supported = (() => {
        try {
          const t = document.createElement('canvas');
          return !!(t.getContext('webgl2') || t.getContext('webgl'));
        } catch { return false; }
      })();
      if (!supported) { sep.dispose(); return; }

      let renderer: import('three').WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
      } catch {
        sep.dispose();
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(rect.width, rect.height, false);

      const scene = new THREE.Scene();
      const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const mat = press.frontMaterial(sep, 0);
      /* Arrived from the rail, or landed here cold?

         Landing cold, the page prints itself — that is the effect and it
         stays. Arriving from the rail, the reader has just watched this
         exact page zoom up to fill the screen; printing it again drops
         them from a finished page onto a halftone, and that drop is the
         flicker. So the ink is already dry when they get here.

         The flag is consumed on read, so a reload or a direct visit to
         this same URL still prints. */
      let fromRail = false;
      try {
        fromRail = sessionStorage.getItem('rc:from-rail') === '1';
        if (fromRail) sessionStorage.removeItem('rc:from-rail');
      } catch { /* private mode: it prints, which is the safe default */ }

      const PRINT_FROM = fromRail ? 1 : 0;
      mat.uniforms.uProgress.value = reduced ? 1 : PRINT_FROM;
      const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
      scene.add(quad);

      canvas.classList.add('is-live');

      const onResize = () => {
        const r = el.getBoundingClientRect();
        renderer.setSize(r.width, r.height, false);
      };
      window.addEventListener('resize', onResize);
      cleanups.push(() => window.removeEventListener('resize', onResize));

      let t = reduced ? 1 : PRINT_FROM;
      let raf = 0;
      let last = performance.now();
      let settled = false;

      function frame(now: number) {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        if (!settled) {
          t = press.advancePrint(t, dt, reduced);
          mat.uniforms.uProgress.value = t;
          renderer.render(scene, cam);
          // Once the ink is dry the image never changes again, so stop
          // burning frames on a static picture.
          if (t >= 1) settled = true;
        }
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
      cleanups.push(() => cancelAnimationFrame(raf));

      cleanups.push(() => {
        sep.dispose();
        mat.dispose();
        quad.geometry.dispose();
        renderer.dispose();
      });
    })();

    return () => {
      disposed = true;
      cleanups.forEach((f) => {
        try { f(); } catch { /* teardown is best-effort */ }
      });
    };
  }, [src]);

  return (
    <div className="pin-host">
      <div ref={root} className="cs-hero">
        <div className="cs-hero-media">
          {/* The floor: what shows with no WebGL, and during the load. */}
          {/* crossOrigin is not decoration here. The rail preloads this
              exact hero with crossOrigin="anonymous" so it can separate
              it; a request WITHOUT the attribute is a different cache
              entry, so this page was re-downloading an image the browser
              already had. The press pass waits on that download, which is
              why it used to start only after the cinematic had faded off
              it — the ink landing on an image the reader had already been
              looking at for a second. Matching the attribute makes it a
              cache hit, and the print starts under the overlay. */}
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            className="cs-hero-img"
            crossOrigin="anonymous"
          />
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
