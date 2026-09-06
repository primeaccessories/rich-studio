import Masthead from '@/components/Masthead';
import StatementHold from '@/components/StatementHold';
import WorkCategories from '@/components/WorkCategories';
import SiteFooter from '@/components/SiteFooter';
import { INDUSTRY_FACETS } from '@/lib/work';

export default function Home() {
  return (
    <>
      <Masthead />

      {/* The press rail in the hero IS the featured-work presentation now,
          so the depth-stack carousel that used to sit here has been removed
          — it showed the same projects a second time. Restore by putting
          <PortfolioCarousel items={FEATURED} /> back on this line. */}

      <StatementHold />

      {/* The industry index, not the whole archive. Thirty one tiles here
          duplicated the /work page and buried the one thing the homepage
          should do: show what kind of work this is, and send you in. Each
          category carries its own filter across to the archive. */}
      <WorkCategories
        facets={INDUSTRY_FACETS}
        active=""
        hrefBase="/work?industry="
      />

      <SiteFooter />
    </>
  );
}
