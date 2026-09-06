'use client';

import { useCallback, useState } from 'react';
import WorkCategories from './WorkCategories';
import WorkGrid from './WorkGrid';
import type { Facet, WorkItem } from '@/lib/work';

/**
 * Holds the one thing the industry index and the grid's own filter row
 * both need to agree on. Without it they are two controls for the same
 * decision that can end up showing different answers.
 */
export default function WorkBrowser({
  items,
  disciplines,
  industries,
  facets,
}: {
  items: WorkItem[];
  disciplines: string[];
  industries: string[];
  facets: Facet[];
}) {
  const [industry, setIndustry] = useState('ALL');

  const pick = useCallback((name: string) => {
    setIndustry(name);
    // Taking a category off the index should put you where the answer is.
    // Instant, not smooth: ScrollSmoother is already easing the page and
    // two eases fighting over the same scroll reads as a stutter.
    document.getElementById('work')?.scrollIntoView({ block: 'start' });
  }, []);

  return (
    <>
      <WorkCategories facets={facets} active={industry} onPick={pick} />
      <WorkGrid
        items={items}
        disciplines={disciplines}
        industries={industries}
        heading={industry === 'ALL' ? 'ALL' : industry}
        industry={industry}
        onIndustry={setIndustry}
      />
    </>
  );
}
