import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import RegistrationHero from '@/components/RegistrationHero';
import RegisteredImage from '@/components/RegisteredImage';
import ContactBlock from '@/components/ContactBlock';
import SiteFooter from '@/components/SiteFooter';
import ActGround from '@/components/ActGround';
import { ALL_WORK, getWork, neighbours } from '@/lib/work';

export function generateStaticParams() {
  return ALL_WORK.map((w) => ({ slug: w.slug }));
}

// Next 16: params is a Promise and must be awaited.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const work = getWork(slug);
  if (!work) return { title: 'Not found' };

  // His copy is entirely uppercase; shouting it in a search result and a
  // social card would read as broken, so sentence-case it for metadata only.
  const desc =
    work.description.charAt(0) +
    work.description.slice(1).toLowerCase().slice(0, 200);

  return {
    title: work.title,
    description: desc,
    openGraph: {
      title: `${work.title} — ®RICH COLVILL`,
      description: desc,
      images: work.images[0] ? [{ url: work.images[0].src }] : undefined,
    },
  };
}

export default async function CaseStudy({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const work = getWork(slug);
  if (!work) notFound();

  const { prev, next } = neighbours(slug);
  const [hero, ...rest] = work.images;
  const meta = [...work.disciplines, ...work.industries].join('  /  ');

  return (
    <>
      {/* Repaints the page in this project's own ground colour. */}
      <ActGround ground={work.ground} ink={work.groundInk} />

      <RegistrationHero
        src={hero.src}
        alt={`${work.client} — ${work.title}`}
        title={work.title}
        client={work.client}
        meta={meta}
      />

      <section className="cs-brief sheet">
        <span className="t-mono cs-label">
          <span className="target" aria-hidden="true" /> BRIEF
        </span>
        <p className="t-statement cs-copy">{work.description}</p>
      </section>

      {rest.length > 0 && (
        <section className="cs-plates sheet">
          <ul className="cs-plate-grid grid12">
            {rest.map((img, i) => (
              <li
                key={img.src}
                className="cs-plate"
                /* Alternating wide/narrow so the run of images has rhythm
                   instead of reading as a contact sheet. */
                style={{ ['--span' as string]: i % 3 === 0 ? 12 : 6 }}
              >
                <RegisteredImage
                  src={img.src}
                  alt={`${work.client} — plate ${String(i + 2).padStart(2, '0')}`}
                  className="cs-plate-img"
                  sizes={i % 3 === 0 ? '100vw' : '50vw'}
                />
                <span className="t-mono cs-plate-num">
                  {String(i + 2).padStart(2, '0')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav className="cs-nav sheet" aria-label="Case studies">
        {prev && (
          <Link href={`/work/${prev.slug}`} className="cs-nav-link">
            <span className="t-mono">&#8592; PREVIOUS</span>
            <span className="t-caps cs-nav-title">{prev.title}</span>
          </Link>
        )}
        {next && (
          <Link href={`/work/${next.slug}`} className="cs-nav-link cs-nav-next">
            <span className="t-mono">NEXT &#8594;</span>
            <span className="t-caps cs-nav-title">{next.title}</span>
          </Link>
        )}
      </nav>

      <ContactBlock />
      <SiteFooter />
    </>
  );
}
