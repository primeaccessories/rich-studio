import Link from 'next/link';

/* One copy of the real details, shared with /contact — see lib/contact. */
import { DESKS, STUDIO_EMAIL } from '@/lib/contact';

/**
 * THE FOOT
 *
 * Contact used to be a full section of its own on four pages — a display
 * shout, a paragraph and a five cell grid — repeated above this footer
 * every time. It now lives here, set small, as the last thing on the page
 * rather than a section competing with the work above it.
 *
 * The id stays on this element: the nav points at /#contact and that has
 * to keep landing somewhere real.
 */
export default function SiteFooter({
  /* /contact says all of this above the fold in full size. Repeating it
     immediately underneath reads as a mistake, so that page asks for the
     sign-off only. */
  contact = true,
}: { contact?: boolean } = {}) {
  const year = new Date().getFullYear().toString().slice(-2);

  return (
    <footer className="site-footer sheet" id="contact">
      {contact ? (
      <div className="footer-contact" data-reveal="stagger">
        <div className="footer-col">
          <h2 className="t-mono footer-h">GET &#174;RICH QUICK.</h2>
          <a className="footer-email" href={`mailto:${STUDIO_EMAIL}`}>
            LETSDOTHIS@RICHCOLVILL.COM
          </a>
          <span className="t-mono footer-note">
            BY APPOINTMENT ONLY &nbsp;11A &#8211; 4P MONDAY, THURSDAY
          </span>
        </div>

        <ul className="footer-desks">
          {DESKS.map((d) => (
            <li key={d.email}>
              <span className="t-mono footer-role">{d.role}</span>
              <a className="t-mono footer-desk" href={`mailto:${d.email.toLowerCase()}`}>
                {d.email}
              </a>
            </li>
          ))}
        </ul>

        <Link href="/work" className="t-mono footer-more magnetic">
          SEE ALL WORK &#8594;
        </Link>
      </div>
      ) : null}

      <div className="footer-rule" aria-hidden="true" />

      <div className="footer-meta">
        <span className="t-mono">
          <span className="rc-mark" aria-hidden="true" />RICH COLVILL &#169;COPYRIGHT {year}, ALL RIGHTS RESERVED
        </span>
        <span className="t-mono">
          <a href="https://www.instagram.com/" rel="noopener noreferrer" target="_blank">
            STALK US
          </a>
        </span>
      </div>

      {/* His sign-off, last thing on the page and the full width of it.
          The mask is what it rises out of — data-rise animates the child,
          so the two elements are not interchangeable. */}
      <div className="footer-shout-mask" data-rise>
        <p className="t-display footer-shout">THAT&#39;S ALL F**KS</p>
      </div>
    </footer>
  );
}
