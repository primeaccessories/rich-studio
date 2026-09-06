/**
 * THE MOTION LAYER
 *
 * One set of primitives, applied by data attribute across every page, so
 * the whole site moves in the same language as the press hero rather than
 * collecting unrelated effects.
 *
 * Everything here is opt-in from markup:
 *   data-reveal            an element arrives out of register and settles
 *   data-reveal="stagger"  its children arrive one after another
 *   data-split             a heading splits to lines, each registering in
 *   data-speed="0.9"       parallax, via ScrollSmoother's own effects
 *   .roll                  a label that rolls to its duplicate on hover
 *   .magnetic              a control that leans toward the cursor
 *   .marquee               a band that runs, and answers scroll direction
 *
 * Every primitive is a no-op under prefers-reduced-motion: elements are
 * simply present and in register.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

let started = false;

export function initMotion(): () => void {
  if (typeof window === 'undefined') return () => {};
  if (started) return () => {};
  started = true;

  gsap.registerPlugin(ScrollTrigger, SplitText);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cleanups: Array<() => void> = [];

  const ctx = gsap.context(() => {
    /* ---------- reveals ----------
       Elements arrive fractionally out of register — a small offset and a
       colour fringe — and settle. Same idea as the plates, at a scale that
       suits body content rather than a hero. */
    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
      const mode = el.dataset.reveal;
      const targets =
        mode === 'stagger'
          ? (gsap.utils.toArray<HTMLElement>(el.children) as HTMLElement[])
          : [el];
      if (!targets.length) return;

      if (reduced) {
        gsap.set(targets, { opacity: 1, y: 0, clearProps: 'all' });
        return;
      }

      gsap.set(targets, { opacity: 0, y: 22 });
      ScrollTrigger.create({
        trigger: el,
        // Fire a little before the element is fully on screen, so content
        // is already settled by the time it is actually being read.
        start: 'top 88%',
        once: true,
        onEnter: () =>
          gsap.to(targets, {
            opacity: 1,
            y: 0,
            duration: 0.72,
            ease: 'expo.out',
            stagger: mode === 'stagger' ? 0.055 : 0,
          }),
      });
    });

    /* ---------- split headings ---------- */
    gsap.utils.toArray<HTMLElement>('[data-split]').forEach((el) => {
      if (reduced) return;
      // aria:"none" — SplitText's default stamps an aria-label, which is
      // prohibited on most of the elements this runs on.
      const split = new SplitText(el, { type: 'lines', linesClass: 'm-line', aria: 'none' });
      gsap.set(split.lines, { yPercent: 108, opacity: 0 });
      ScrollTrigger.create({
        trigger: el,
        start: 'top 86%',
        once: true,
        onEnter: () =>
          gsap.to(split.lines, {
            yPercent: 0,
            opacity: 1,
            duration: 0.82,
            ease: 'expo.out',
            stagger: 0.07,
          }),
      });
      cleanups.push(() => split.revert());
    });

    /* ---------- magnetic controls ---------- */
    if (!reduced && window.matchMedia('(pointer: fine)').matches) {
      gsap.utils.toArray<HTMLElement>('.magnetic').forEach((el) => {
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          gsap.to(el, {
            x: (e.clientX - (r.left + r.width / 2)) * 0.28,
            y: (e.clientY - (r.top + r.height / 2)) * 0.32,
            duration: 0.5,
            ease: 'power3.out',
          });
        };
        const reset = () =>
          gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerleave', reset);
        cleanups.push(() => {
          el.removeEventListener('pointermove', move);
          el.removeEventListener('pointerleave', reset);
          gsap.set(el, { x: 0, y: 0 });
        });
      });
    }

    /* ---------- marquees ----------
       The band runs on its own and takes its direction from the scroll, so
       it reads as part of the same mechanism rather than a loose loop. */
    gsap.utils.toArray<HTMLElement>('.marquee').forEach((el) => {
      const track = el.querySelector<HTMLElement>('.marquee-track');
      if (!track) return;
      // Duplicate the run so the loop has no seam.
      const original = track.innerHTML;
      track.innerHTML = original + original;
      if (reduced) return;

      const half = () => track.scrollWidth / 2;
      const tween = gsap.to(track, {
        x: () => -half(),
        duration: 26,
        ease: 'none',
        repeat: -1,
        modifiers: { x: (v) => `${gsap.utils.wrap(-half(), 0, parseFloat(v))}px` },
      });

      let last = window.scrollY;
      const onScroll = () => {
        const dir = window.scrollY > last ? 1 : -1;
        last = window.scrollY;
        // Scrolling nudges the speed, and it eases back to its own pace.
        gsap.to(tween, { timeScale: dir * 3.2, duration: 0.25, overwrite: true });
        gsap.to(tween, { timeScale: dir, duration: 1.1, delay: 0.25, overwrite: false });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      cleanups.push(() => {
        window.removeEventListener('scroll', onScroll);
        tween.kill();
      });
    });

    // Pins and reveals are measured before webfonts land, which shifts
    // every start position. Re-measure once they have.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    /* ---------- safety sweep ----------
       The one failure a motion layer must never have is leaving content
       invisible. If any revealed element is on screen and still hidden a
       few seconds in — a trigger that never resolved, a refresh that raced
       a pin, a tween killed mid-flight — show it. */
    const sweep = window.setInterval(() => {
      const vh = window.innerHeight;
      document
        .querySelectorAll<HTMLElement>('[data-reveal], [data-reveal] > *, .m-line')
        .forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.bottom < 0 || r.top > vh || !r.height) return;
          if (parseFloat(getComputedStyle(el).opacity) > 0.05) return;
          gsap.to(el, { opacity: 1, y: 0, yPercent: 0, duration: 0.3, ease: 'power2.out' });
        });
    }, 1500);
    cleanups.push(() => window.clearInterval(sweep));
  });

  return () => {
    cleanups.forEach((f) => {
      try { f(); } catch { /* teardown is best-effort */ }
    });
    ctx.revert();
    started = false;
  };
}
