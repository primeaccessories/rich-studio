import raw from '@/content/work.json';

export interface WorkImage {
  src: string;
  w: number;
  h: number;
}

export interface WorkItem {
  slug: string;
  /** Rich's own title, verbatim, in his caps. */
  title: string;
  client: string;
  disciplines: string[];
  industries: string[];
  /** Body copy verbatim — he writes in caps and we do not fight it. */
  description: string;
  images: WorkImage[];
  /** 720px derivative for grid tiles and the masthead plate. */
  thumb: string;
  /** The act ground, sampled from this project's own artwork. */
  ground: string;
  groundInk: string;
  /** 1-9 for the featured set, undefined for the rest of the archive. */
  featured?: number;
}

const items = raw as unknown as WorkItem[];

export const ALL_WORK: WorkItem[] = items;

/** The nine that carry the homepage, in the order they should be met. */
export const FEATURED: WorkItem[] = items
  .filter((w) => typeof w.featured === 'number')
  .sort((a, b) => (a.featured ?? 99) - (b.featured ?? 99));

/** Everything, featured first, then the archive alphabetically. */
export const ARCHIVE: WorkItem[] = items
  .filter((w) => typeof w.featured !== 'number')
  .sort((a, b) => a.client.localeCompare(b.client));

export function getWork(slug: string): WorkItem | undefined {
  return items.find((w) => w.slug === slug);
}

export function neighbours(slug: string) {
  const order = [...FEATURED, ...ARCHIVE];
  const i = order.findIndex((w) => w.slug === slug);
  if (i === -1) return { prev: undefined, next: undefined };
  return {
    prev: order[(i - 1 + order.length) % order.length],
    next: order[(i + 1) % order.length],
  };
}

/** Distinct discipline facets, in the order Rich uses them. */
export const DISCIPLINES: string[] = Array.from(
  new Set(items.flatMap((w) => w.disciplines)),
).sort();

export const INDUSTRIES: string[] = Array.from(
  new Set(items.flatMap((w) => w.industries)),
).sort();

export interface Facet {
  name: string;
  count: number;
  /** 420px samples, one or two, for the flanking sheets. */
  samples: string[];
}

/**
 * The industries as an index: name, how much work sits under it, and a
 * couple of samples from it. Featured projects come first so the sample
 * is something recognisable rather than whatever happened to sort first.
 *
 * Samples are a 420px derivative, not the 720px grid thumb — there are up
 * to fourteen of them on one page and the thumbs are ~58KB each, which is
 * three quarters of a megabyte to show two pictures at a time.
 */
export const INDUSTRY_FACETS: Facet[] = INDUSTRIES.map((name) => {
  const inIt = items
    .filter((w) => w.industries.includes(name))
    .sort(
      (a, b) =>
        (a.featured ?? 99) - (b.featured ?? 99) ||
        a.client.localeCompare(b.client),
    );
  return {
    name,
    count: inIt.length,
    samples: inIt.slice(0, 2).map((w) => `/work/${w.slug}/sample.webp`),
  };
});
