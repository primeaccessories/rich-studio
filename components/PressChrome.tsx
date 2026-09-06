'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * The print furniture: corner crop marks, the margin HUD, visible column
 * rules and the grain plate. Restrained by ruling — corners and HUD only;
 * colour bars are reserved for act transitions.
 *
 * All of this lives OUTSIDE #smooth-content so ScrollSmoother's transform
 * never drags it around.
 */

/* Where the reader is, to the nearest city.

   Taken from their IANA time zone, which the browser hands over with no
   permission prompt and no network call. Real coordinates would mean the
   Geolocation API, and a permission dialog on top of a portfolio hero is
   a bad trade for a line of furniture.

   So these are the CITY's coordinates, not the reader's — honest at the
   resolution it claims. A zone that is not listed shows its UTC offset
   instead; nothing here invents a location it does not know. */
const ZONES: Record<string, [string, string]> = {
  'Europe/London': ['LONDON', '51.5074° N  0.1278° W'],
  'Europe/Dublin': ['DUBLIN', '53.3498° N  6.2603° W'],
  'Europe/Paris': ['PARIS', '48.8566° N  2.3522° E'],
  'Europe/Madrid': ['MADRID', '40.4168° N  3.7038° W'],
  'Europe/Lisbon': ['LISBON', '38.7223° N  9.1393° W'],
  'Europe/Berlin': ['BERLIN', '52.5200° N  13.4050° E'],
  'Europe/Amsterdam': ['AMSTERDAM', '52.3676° N  4.9041° E'],
  'Europe/Brussels': ['BRUSSELS', '50.8476° N  4.3572° E'],
  'Europe/Zurich': ['ZURICH', '47.3769° N  8.5417° E'],
  'Europe/Rome': ['ROME', '41.9028° N  12.4964° E'],
  'Europe/Copenhagen': ['COPENHAGEN', '55.6761° N  12.5683° E'],
  'Europe/Stockholm': ['STOCKHOLM', '59.3293° N  18.0686° E'],
  'Europe/Oslo': ['OSLO', '59.9139° N  10.7522° E'],
  'Europe/Warsaw': ['WARSAW', '52.2297° N  21.0122° E'],
  'Europe/Istanbul': ['ISTANBUL', '41.0082° N  28.9784° E'],
  'America/New_York': ['NEW YORK', '40.7128° N  74.0060° W'],
  'America/Chicago': ['CHICAGO', '41.8781° N  87.6298° W'],
  'America/Denver': ['DENVER', '39.7392° N  104.9903° W'],
  'America/Los_Angeles': ['LOS ANGELES', '34.0522° N  118.2437° W'],
  'America/Toronto': ['TORONTO', '43.6532° N  79.3832° W'],
  'America/Vancouver': ['VANCOUVER', '49.2827° N  123.1207° W'],
  'America/Sao_Paulo': ['SÃO PAULO', '23.5505° S  46.6333° W'],
  'America/Mexico_City': ['MEXICO CITY', '19.4326° N  99.1332° W'],
  'Asia/Dubai': ['DUBAI', '25.2048° N  55.2708° E'],
  'Asia/Tokyo': ['TOKYO', '35.6762° N  139.6503° E'],
  'Asia/Shanghai': ['SHANGHAI', '31.2304° N  121.4737° E'],
  'Asia/Hong_Kong': ['HONG KONG', '22.3193° N  114.1694° E'],
  'Asia/Singapore': ['SINGAPORE', '1.3521° N  103.8198° E'],
  'Asia/Kolkata': ['MUMBAI', '19.0760° N  72.8777° E'],
  'Australia/Sydney': ['SYDNEY', '33.8688° S  151.2093° E'],
  'Australia/Melbourne': ['MELBOURNE', '37.8136° S  144.9631° E'],
  'Pacific/Auckland': ['AUCKLAND', '36.8509° S  174.7645° E'],
  'Africa/Johannesburg': ['JOHANNESBURG', '26.2041° S  28.0473° E'],
  'Africa/Lagos': ['LAGOS', '6.5244° N  3.3792° E'],
};

function utcOffset(now: Date, zone: string): string {
  const name = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    timeZoneName: 'longOffset',
  })
    .formatToParts(now)
    .find((p) => p.type === 'timeZoneName')?.value;
  return name && name !== 'GMT' ? name : 'UTC+00:00';
}

function useHere() {
  // Rendered null on the server and on first paint, then filled in. A live
  // clock in SSR output is a guaranteed hydration mismatch.
  const [here, setHere] = useState<{ place: string; coords: string } | null>(null);

  useEffect(() => {
    let zone = 'Europe/London';
    try {
      zone = Intl.DateTimeFormat().resolvedOptions().timeZone || zone;
    } catch { /* keep the studio's own zone */ }

    const known = ZONES[zone];
    // Unknown zone: name the place off the zone itself rather than guess
    // at somewhere it might be.
    const place =
      known?.[0] ??
      (zone.split('/').pop() ?? zone).replace(/_/g, ' ').toUpperCase();

    const tick = () => {
      const now = new Date();
      const clock = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: zone,
      }).format(now);
      setHere({
        place: `${place}  ${clock}`,
        coords: known?.[1] ?? utcOffset(now, zone),
      });
    };
    tick();
    // Every second: the seconds ticking are the point — it is the one
    // thing on the page that is always moving.
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return here;
}

export function ColumnRules({ count = 12 }: { count?: number }) {
  return (
    <div className="column-rules" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}

export default function PressChrome() {
  const here = useHere();
  return (
    <>
      <ColumnRules />

      {/* The header's own ground. Fixed chrome over a scrolling page has
          to sit on something of its own, or it sits on whatever happens to
          be passing underneath and the slug line vanishes into the band. */}
      <div className="head-bar" aria-hidden="true" />

      <div className="furniture" aria-hidden="true">
        <span className="crop crop-tl" />
        <span className="crop crop-tr" />
        <span className="crop crop-bl" />
        <span className="crop crop-br" />
      </div>

      {/* The slug line. Screen-reader-hidden: it is furniture, not content. */}
      {/* The slug line is now the way home. It was aria-hidden furniture;
          as a link it has to be reachable and named, so the hidden
          attribute goes and it gets a label of its own — "RICH COLVILL
          BRANDING / DESIGN" read out as a link would say nothing about
          where it goes. */}
      <Link
        href="/"
        className="hud hud-l t-mono hud-home"
        aria-label="Rich Colvill — home"
      >
        <span className="t-mono-b" aria-hidden="true"><span className="rc-mark" />RICH COLVILL</span>
        <br aria-hidden="true" />
        <span aria-hidden="true">BRANDING / DESIGN</span>
      </Link>

      {/* Was the CMYK screen angles and the studio clock. The angles were
          furniture that did not match the separation the shader actually
          runs (K45 / M75 / C15 / Y0, not Y45), and a second clock said
          nothing the colophon in the band does not already say. */}
      <div className="hud hud-r t-mono" aria-hidden="true">
        {here?.coords ?? '\u00a0'}
        <br />
        {here?.place ?? '\u00a0'}
      </div>

      <div className="grain" aria-hidden="true" />
    </>
  );
}
