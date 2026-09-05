import type { Metadata } from 'next';
import './globals.css';
import PressChrome from '@/components/PressChrome';
import SmoothScroll from '@/components/SmoothScroll';
import SiteNav from '@/components/SiteNav';

/* Copy here is Rich's own, verbatim from richcolvill.com — not invented.
   The previous build shipped a made-up strapline and a hello@ address
   that does not exist. */
export const metadata: Metadata = {
  metadataBase: new URL('https://richcolvill.com'),
  title: {
    default: '®RICH COLVILL — Branding / Design / Creative Production Studio',
    template: '%s — ®RICH COLVILL',
  },
  description:
    'We help businesses stand out through creative production. A team of creative creatures focussed on executing high end branding, visuals and roll-out. Over 25 years working with Silverstone, Absolut, Odeon, Wall’s, Vivienne Westwood, Molton Brown and more.',
  openGraph: {
    title: '®RICH COLVILL',
    description:
      'Branding / Design / Creative production studio. Over 25 years of high end branding, visuals and roll-out.',
    url: 'https://richcolvill.com',
    siteName: '®RICH COLVILL',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '®RICH COLVILL',
    description: 'Branding / Design / Creative production studio.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB">
      <body>
        <a href="#main" className="skip-link t-mono">
          Skip to content
        </a>

        {/* Fixed furniture must sit outside #smooth-content, or
            ScrollSmoother's transform drags it up the page. */}
        <PressChrome />
        <SiteNav />

        <SmoothScroll>
          <main id="main">{children}</main>
        </SmoothScroll>
      </body>
    </html>
  );
}
