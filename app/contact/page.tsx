import type { Metadata } from 'next';
import SiteFooter from '@/components/SiteFooter';
import { DESKS, HOURS, STUDIO_EMAIL } from '@/lib/contact';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get ®Rich quick. Collaborations, enquiries and business — by appointment only, 11a–4p Monday and Thursday.',
};

/* His own words, from his own site. "GET ®RICH QUICK." is the line he
   already uses for this; nothing on this page is written for him. */
export default function Contact() {
  return (
    <>
      <header className="page-head sheet">
        <span className="t-mono page-label">
          <span className="target" aria-hidden="true" /> CONTACT
        </span>
        <h1 className="t-wordmark page-shout" data-split>
          GET &#174;RICH QUICK.
        </h1>
        <p className="t-body page-body" data-reveal>
          LET&#39;S GET TOGETHER, OVER E-MAIL, WHATSAPP, ZOOM, PHONE OR EVEN
          BETTER OVER A BEER, HAVE A CHAT AND SEE HOW WE CAN TAKE YOUR BRIEF
          TO THE NEXT LEVEL.
        </p>
      </header>

      <section className="sheet contact-page">
        <div className="contact-primary" data-reveal>
          <span className="t-mono contact-role">EMAIL TO ARRANGE A TIME</span>
          <a className="contact-address" href={`mailto:${STUDIO_EMAIL}`}>
            {STUDIO_EMAIL.toUpperCase()}
          </a>
          <span className="t-mono contact-hours">{HOURS}</span>
        </div>

        <ul className="contact-desks" data-reveal="stagger">
          {DESKS.map((d) => (
            <li key={d.email}>
              <span className="t-mono contact-role">{d.role}</span>
              <a
                className="t-mono contact-desk"
                href={`mailto:${d.email.toLowerCase()}`}
              >
                {d.email}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <SiteFooter contact={false} />
    </>
  );
}
