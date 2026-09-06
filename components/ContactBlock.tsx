import Link from 'next/link';

/* Every address, hour and line here is verbatim from richcolvill.com.
   The previous build invented hello@richcolvill.com, which does not exist. */
const DESKS = [
  { role: 'COLLABORATIONS', email: 'RICH@RICHCOLVILL.COM' },
  { role: 'ENQUIRIES', email: 'TARA@RICHCOLVILL.COM' },
  { role: 'BUSINESS', email: 'CHRIS@RICHCOLVILL.COM' },
];

export default function ContactBlock() {
  return (
    <section className="contact sheet" id="contact">
      <span className="t-mono contact-label">
        <span className="target" aria-hidden="true" /> CONTACT
      </span>

      <h2 className="t-display contact-shout" data-split>
        GET &#174;RICH QUICK.
      </h2>

      <p className="t-body contact-body" data-reveal>
        LET&#39;S GET TOGETHER, OVER E-MAIL, WHATSAPP, ZOOM, PHONE OR EVEN
        BETTER OVER A BEER, HAVE A CHAT AND SEE HOW WE CAN TAKE YOUR BRIEF TO
        THE NEXT LEVEL.
      </p>

      <div className="contact-grid" data-reveal="stagger">
        <div className="contact-cell">
          <span className="t-mono">BY APPOINTMENT ONLY</span>
          <span className="t-mono t-mono-b">11A &#8211; 4P MONDAY, THURSDAY</span>
        </div>

        <div className="contact-cell contact-primary">
          <span className="t-mono">EMAIL TO ARRANGE A TIME</span>
          <a className="contact-email" href="mailto:letsdothis@richcolvill.com">
            LETSDOTHIS@RICHCOLVILL.COM
          </a>
        </div>

        {DESKS.map((d) => (
          <div className="contact-cell" key={d.email}>
            <span className="t-mono">{d.role}</span>
            <a
              className="contact-email contact-email-sm"
              href={`mailto:${d.email.toLowerCase()}`}
            >
              {d.email}
            </a>
          </div>
        ))}
      </div>

      <Link href="/work" className="t-mono contact-more magnetic">
        SEE ALL WORK &#8594;
      </Link>
    </section>
  );
}
