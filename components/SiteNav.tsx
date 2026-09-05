'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* His own nav labels, verbatim: ABOUT / WORK / CONTACT. */
const LINKS = [
  { href: '/about', label: 'ABOUT' },
  { href: '/work', label: 'WORK' },
  { href: '/#contact', label: 'CONTACT' },
];

/**
 * Nav sits centre-top, between the two HUD blocks, so the whole top edge
 * reads as one slug line rather than as a website header bolted on.
 *
 * It hides the wordmark until you have scrolled past the masthead — no
 * point repeating a wordmark that is already 17rem tall on screen.
 */
export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const onHome = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const showMark = !onHome || scrolled;

  return (
    <nav className="site-nav" aria-label="Primary">
      <Link
        href="/"
        className={`site-nav-mark t-mono t-mono-b${showMark ? ' is-shown' : ''}`}
        aria-hidden={!showMark}
        tabIndex={showMark ? 0 : -1}
      >
        &#174;RICH COLVILL
      </Link>

      <ul className="site-nav-links">
        {LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`t-mono site-nav-link${active ? ' is-on' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
