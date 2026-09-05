import type { Metadata } from 'next';
import WorkGrid from '@/components/WorkGrid';
import ContactBlock from '@/components/ContactBlock';
import SiteFooter from '@/components/SiteFooter';
import { ALL_WORK, DISCIPLINES, INDUSTRIES } from '@/lib/work';

export const metadata: Metadata = {
  title: 'Work',
  description:
    'Selected branding, design and creative production work — Silverstone, Absolut, Odeon, Wall’s, By Bryony, Alton Towers, Network Rail and more.',
};

export default function WorkIndex() {
  return (
    <>
      <header className="page-head sheet">
        <span className="t-mono page-label">
          <span className="target" aria-hidden="true" /> ARCHIVE
        </span>
        <h1 className="t-wordmark page-shout">WORK</h1>
        <p className="t-body page-body">
          {ALL_WORK.length} PROJECTS ACROSS BRANDING AND RETOUCH.
        </p>
      </header>

      <WorkGrid
        items={ALL_WORK}
        disciplines={DISCIPLINES}
        industries={INDUSTRIES}
        heading="ALL"
      />

      <ContactBlock />
      <SiteFooter />
    </>
  );
}
