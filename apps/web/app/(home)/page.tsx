import { Agents } from '@/components/landing/agents';
import { Anatomy } from '@/components/landing/anatomy';
import { Assets } from '@/components/landing/assets';
import { Footer } from '@/components/landing/footer';
import { GetStarted } from '@/components/landing/get-started';
import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Inspector } from '@/components/landing/inspector';
import { LiveDemo } from '@/components/landing/live-demo';
import { Nav } from '@/components/landing/nav';
import { appName, gitConfig, siteUrl } from '@/lib/shared';

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: appName,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/docs?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: appName,
    description:
      'A React-first slide framework authored by AI agents. Each page is arbitrary code on a 1920×1080 canvas — versioned, reviewable, yours.',
    codeRepository: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    programmingLanguage: 'TypeScript',
    url: siteUrl,
    license: `https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/LICENSE`,
  },
];

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD payload is built from static, server-only constants
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />
      <main className="relative flex-1">
        <Hero />
        <LiveDemo />
        <HowItWorks />
        <Anatomy />
        <Inspector />
        <Assets />
        <Agents />
        <GetStarted />
      </main>
      <Footer />
    </>
  );
}
