import Masthead from '@/components/Masthead';
import StatementHold from '@/components/StatementHold';
import WorkGrid from '@/components/WorkGrid';
import PortfolioCarousel from '@/components/PortfolioCarousel';
import ContactBlock from '@/components/ContactBlock';
import SiteFooter from '@/components/SiteFooter';
import { ALL_WORK, DISCIPLINES, INDUSTRIES, FEATURED } from '@/lib/work';

export default function Home() {
  return (
    <>
      <Masthead />

      {/* The featured nine are the pinned carousel, not a grid. */}
      <PortfolioCarousel items={FEATURED} />

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
