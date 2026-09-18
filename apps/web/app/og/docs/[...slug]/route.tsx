import { notFound } from 'next/navigation';
import { renderSocialImage } from '@/lib/social-image';
import { getPageImage, source } from '@/lib/source';

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<'/og/docs/[...slug]'>) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();
  return renderSocialImage({
    title: page.data.title,
    description: page.data.description ?? 'A slide framework built for agents.',
    breadcrumb: ['docs', ...page.slugs].join(' / '),
    section: 'Docs',
  });
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImage(page).segments,
  }));
}
