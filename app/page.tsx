import Masthead from '@/components/Masthead';
import StatementHold from '@/components/StatementHold';
import WorkGrid from '@/components/WorkGrid';
import ContactBlock from '@/components/ContactBlock';
import SiteFooter from '@/components/SiteFooter';
import { ALL_WORK, DISCIPLINES, INDUSTRIES } from '@/lib/work';

export default function Home() {
  return (
    <>
      <Masthead />

      {/* The press rail in the hero IS the featured-work presentation now,
          so the depth-stack carousel that used to sit here has been removed
          — it showed the same projects a second time. Restore by putting
          <PortfolioCarousel items={FEATURED} /> back on this line. */}

      <StatementHold />

      <WorkGrid
        items={ALL_WORK}
        disciplines={DISCIPLINES}
        industries={INDUSTRIES}
        heading="WORK"
      />

      <ContactBlock />
      <SiteFooter />
    </>
  );
}
