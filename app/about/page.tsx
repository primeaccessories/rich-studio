import type { Metadata } from 'next';
import ContactBlock from '@/components/ContactBlock';
import SiteFooter from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'About',
  description:
    'A team of creative creatures focussed on executing high end branding, visuals and roll-out. Over 25 years industry experience.',
};

/* NOTE: /about on the live WordPress site has NO unique body copy at all —
   it renders the shared footer boilerplate and nothing else. Everything on
   this page is therefore assembled from copy Rich has actually written
   elsewhere on his own site. Nothing here is invented. He still owes us a
   real studio bio and a portrait; the slots are marked in the handover. */

const CLIENTS = [
  'SILVERSTONE', 'ADIDAS', 'ODEON', "WALL'S", 'PERNOD RICARD',
  'VIVIENNE WESTWOOD', 'NESTLE', 'ABSOLUT', 'DHL', 'COSTA',
  'SELLOTAPE', 'SONY', "PENHALIGON'S", 'CLOUD NINE', 'MOLTON BROWN',
];

const SECTORS = [
  'DRINKS', 'BEAUTY', 'FASHION', 'CONSUMER GOODS',
  'PROFESSIONAL SERVICES', 'AUTOMOTIVE',
];

export default function About() {
  return (
    <>
      <header className="page-head sheet">
        <span className="t-mono page-label">
          <span className="target" aria-hidden="true" /> ABOUT
        </span>
        <h1 className="t-display page-shout-sm" data-split>
          A TEAM OF CREATIVE CREATURES.
        </h1>
      </header>

      <section className="about sheet" data-reveal="stagger">
        <div className="about-col">
          <span className="t-mono about-label">PRACTICE</span>
          <p className="t-statement about-lead">
            WE HELP BUSINESSES STAND OUT THROUGH CREATIVE PRODUCTION.
          </p>
          <p className="t-body">
            RICH COLVILL&#174; IS A TEAM OF CREATIVE CREATURES FOCUSSED ON
            EXECUTING HIGH END BRANDING, VISUALS AND ROLL-OUT.
          </p>
        </div>

        <div className="about-col">
          <span className="t-mono about-label">SECTORS</span>
          <ul className="about-list">
            {SECTORS.map((s) => (
              <li key={s} className="t-caps about-item">{s}</li>
            ))}
          </ul>
        </div>

        <div className="about-col">
          <span className="t-mono about-label">EXPERIENCE</span>
          <p className="t-statement about-lead">25 YEARS.</p>
          <p className="t-body">
            WITH OVER 25 YEARS INDUSTRY EXPERIENCE, WORKING ACROSS A VARIETY
            OF BRANDS.
          </p>
        </div>
      </section>

      <section className="clients">
        <span className="t-mono about-label sheet">SELECTED CLIENTS</span>
        {/* A running band rather than a static list: 25 years of names is
            a lot of page, and a marquee reads them out instead. */}
        <div className="marquee" aria-label="Selected clients">
          <div className="marquee-track">
            {CLIENTS.map((c) => (
              <span key={c} className="marquee-item t-display">
                {c}
                <span className="marquee-dot" aria-hidden="true" />
              </span>
            ))}
          </div>
        </div>
      </section>

      <ContactBlock />
      <SiteFooter />
    </>
  );
}
