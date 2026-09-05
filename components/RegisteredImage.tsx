'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A grid tile that arrives out of register and resolves under the cursor.
 *
 * This is the CSS path — three stacked copies of the image, offset and
 * multiply-blended. It is used for every thumbnail because a page of 30
 * WebGL contexts would blow the browser's context limit (~16) and drop
 * tiles silently. The shader path is reserved for heroes, where there is
 * only ever one on screen.
 *
 * Registration is driven by hover AND focus-within, so keyboard users get
 * the same behaviour rather than a dead image.
 */
export default function RegisteredImage({
  src,
  alt,
  className = '',
  sizes = '(max-width: 900px) 100vw, 33vw',
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(priority);

  // Only mount the three plate copies once the tile is near the viewport.
  // Three <img> per tile across 30 tiles is 90 requests if mounted eagerly.
  useEffect(() => {
    if (near || !ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '400px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  return (
    <div ref={ref} className={`reg reg-fallback ${className}`}>
      {near && (
        <>
          {/* Base plate carries the alt text; the colour plates are decorative. */}
          <img
            src={src}
            alt={alt}
            sizes={sizes}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="reg-base"
          />
          <img
            src={src}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="reg-plate reg-plate-c"
          />
          <img
            src={src}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="reg-plate reg-plate-m"
          />
          <img
            src={src}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="reg-plate reg-plate-y"
          />
        </>
      )}
    </div>
  );
}
