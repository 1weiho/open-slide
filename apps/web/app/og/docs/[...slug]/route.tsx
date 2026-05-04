import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';
import { appName } from '@/lib/shared';
import { getPageImage, source } from '@/lib/source';

export const revalidate = false;

// Mirrors apps/web/app/(home)/landing.css.
const PAPER = '#F7F4EC';
const INK = '#1A1814';
const INK_SOFT = '#3A352E';
const MUTED = '#6E665B';
const RULE = '#D9D2C3';
const ACCENT = '#C2410C';

async function loadGoogleFont(family: string, weight: number, italic = false) {
  const ital = italic ? 'ital,' : '';
  const axis = italic ? `${ital}wght@1,${weight}` : `wght@${weight}`;
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:${axis}&display=swap`,
    { headers: { 'User-Agent': 'Mozilla/5.0 (Open-Slide OG)' } },
  ).then((r) => r.text());
  const url = css.match(/src:\s*url\((https:[^)]+)\)\s*format/)?.[1];
  if (!url) throw new Error(`Could not resolve font: ${family} ${weight}`);
  return fetch(url).then((r) => r.arrayBuffer());
}

export async function GET(_req: Request, { params }: RouteContext<'/og/docs/[...slug]'>) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();

  const [geistRegular, geistMedium, mono, logoBuffer] = await Promise.all([
    loadGoogleFont('Geist', 400),
    loadGoogleFont('Geist', 500),
    loadGoogleFont('JetBrains Mono', 500),
    readFile(path.join(process.cwd(), 'public/open-slide.png')),
  ]);
  const logoSrc = `data:image/png;base64,${logoBuffer.toString('base64')}`;

  const title = page.data.title;
  const description = page.data.description ?? 'A slide framework built for agents.';
  const breadcrumb = ['docs', ...page.slugs].join(' / ');

  return new ImageResponse(
    <Frame title={title} description={description} breadcrumb={breadcrumb} logoSrc={logoSrc} />,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Geist', data: geistRegular, weight: 400, style: 'normal' },
        { name: 'Geist', data: geistMedium, weight: 500, style: 'normal' },
        { name: 'JetBrains Mono', data: mono, weight: 500, style: 'normal' },
      ],
    },
  );
}

function Frame({
  title,
  description,
  breadcrumb,
  logoSrc,
}: {
  title: string;
  description: string;
  breadcrumb: string;
  logoSrc: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: PAPER,
        backgroundImage:
          // subtle dot grid — mirrors `.specimen` in landing.css
          `radial-gradient(circle at 1px 1px, rgba(26,24,20,0.06) 1px, transparent 0)`,
        backgroundSize: '20px 20px',
        fontFamily: 'Geist',
        color: INK,
        padding: '72px 80px',
        position: 'relative',
      }}
    >
      {/* Vermillion accent rule along the left edge */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 6,
          backgroundColor: ACCENT,
        }}
      />

      {/* Eyebrow: logo mark + monospace caption */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* biome-ignore lint/performance/noImgElement: next/og uses Satori; <img> is the only supported image tag */}
        <img src={logoSrc} width={48} height={48} alt="" style={{ borderRadius: 8 }} />
        <div
          style={{
            fontFamily: 'JetBrains Mono',
            fontSize: 18,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: MUTED,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <span style={{ color: INK }}>{appName}</span>
          <span style={{ color: RULE }}>·</span>
          <span>Docs</span>
        </div>
      </div>

      {/* Hairline */}
      <div
        style={{
          height: 1,
          width: '100%',
          backgroundColor: RULE,
          marginTop: 32,
        }}
      />

      {/* Title + description */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginTop: 48,
          flex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: title.length > 36 ? 76 : 92,
            fontWeight: 500,
            lineHeight: 1.04,
            letterSpacing: '-0.03em',
            color: INK,
            // clamp visually — Satori has no line-clamp, so we cap height via maxHeight
            maxHeight: 320,
            overflow: 'hidden',
          }}
        >
          {title}
        </div>

        {description ? (
          <div
            style={{
              display: 'flex',
              marginTop: 28,
              fontSize: 30,
              lineHeight: 1.4,
              color: INK_SOFT,
              maxHeight: 180,
              overflow: 'hidden',
              maxWidth: 980,
            }}
          >
            {description}
          </div>
        ) : null}
      </div>

      {/* Footer: breadcrumb + URL with accent dot */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto',
          paddingTop: 24,
          borderTop: `1px solid ${RULE}`,
          fontFamily: 'JetBrains Mono',
          fontSize: 18,
          color: MUTED,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              width: 8,
              height: 8,
              backgroundColor: ACCENT,
              borderRadius: 999,
            }}
          />
          <span>{breadcrumb}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: INK }}>open-slide.dev</span>
          <span style={{ color: RULE }}>↗</span>
        </div>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImage(page).segments,
  }));
}
