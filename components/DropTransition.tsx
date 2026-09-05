'use client';

import { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';

/**
 * "The work drops down to another page."
 *
 * On activating a project, the plate the visitor is looking at detaches,
 * drops, and expands to fill the viewport while the case study loads
 * behind it. Because the destination hero is the same image full-bleed,
 * the cut reads as one continuous object rather than as a page swap.
 *
 * Hand-rolled rather than React's <ViewTransition>: that is not exported
 * from the React in this build, so depending on it would be a bet. This
 * works everywhere, and degrades to a plain navigation when it cannot.
 */
export function useDropTransition() {
  const router = useRouter();
  const busy = useRef(false);

  return useCallback(
    (href: string, from: HTMLElement | null, src: string) => {
      if (busy.current) return;

      const reduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;

      // No source element, or motion is unwelcome: just go. Navigation
      // must never depend on an animation succeeding.
      if (!from || reduced) {
        router.push(href);
        return;
      }

      busy.current = true;
      const r = from.getBoundingClientRect();

      const el = document.createElement('div');
      el.setAttribute('aria-hidden', 'true');
      el.style.cssText = [
        'position:fixed',
        `left:${r.left}px`,
        `top:${r.top}px`,
        `width:${r.width}px`,
        `height:${r.height}px`,
        `background-image:url("${src}")`,
        'background-size:cover',
        'background-position:center',
        'z-index:900',
        'pointer-events:none',
        'will-change:top,left,width,height',
      ].join(';');
      document.body.appendChild(el);

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        gsap.to(el, {
          opacity: 0,
          duration: 0.28,
          ease: 'power2.out',
          onComplete: () => {
            el.remove();
            busy.current = false;
          },
        });
      };

      gsap
        .timeline({
          onComplete: () => {
            router.push(href);
            // The destination paints under the overlay; hold a beat so the
            // hero is there before we reveal it, then dissolve.
            window.setTimeout(finish, 260);
          },
        })
        .to(el, {
          left: 0,
          top: 0,
          width: '100vw',
          height: '100svh',
          duration: 0.62,
          ease: 'expo.inOut',
        });

      // Belt and braces: if the timeline never completes (interrupted
      // navigation, tab backgrounded), the overlay must not be left
      // covering the page forever.
      window.setTimeout(finish, 2200);
    },
    [router],
  );
}
