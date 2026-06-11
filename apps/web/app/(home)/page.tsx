import { Agents } from '@/components/landing/agents';
import { Anatomy } from '@/components/landing/anatomy';
import { Assets } from '@/components/landing/assets';
import { FAQ, faqs } from '@/components/landing/faq';
import { Footer } from '@/components/landing/footer';
import { GetStarted } from '@/components/landing/get-started';
import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Inspector } from '@/components/landing/inspector';
import { LiveDemo } from '@/components/landing/live-demo';
import { Nav } from '@/components/landing/nav';
import { fetchGitHubStars, formatStarCount } from '@/lib/github';
import { appName, gitConfig, siteUrl } from '@/lib/shared';

const repoUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;
const description =
  'A React-first slide framework authored by AI agents. Each page is arbitrary code on a 1920×1080 canvas — versioned, reviewable, yours.';

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: appName,
    url: siteUrl,
    description,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: appName,
    url: siteUrl,
    logo: `${siteUrl}/open-slide.png`,
    sameAs: [
      repoUrl,
      'https://www.npmjs.com/package/@open-slide/core',
      'https://www.npmjs.com/package/@open-slide/cli',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: appName,
    description,
    codeRepository: repoUrl,
    programmingLanguage: 'TypeScript',
    url: siteUrl,
    license: `${repoUrl}/blob/${gitConfig.branch}/LICENSE`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: appName,
    description,
    url: siteUrl,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web, macOS, Linux, Windows',
    softwareRequirements: 'Node.js, React',
    license: `${repoUrl}/blob/${gitConfig.branch}/LICENSE`,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Author a slide deck with open-slide',
    description:
      'Scaffold an open-slide workspace, ask an AI agent to draft slides, then iterate visually in the browser.',
    totalTime: 'PT2M',
    supply: [
      { '@type': 'HowToSupply', name: 'Node.js 18+' },
      { '@type': 'HowToSupply', name: 'An AI coding agent (Claude Code, Cursor, Codex, …)' },
    ],
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Spin up a workspace',
        text: 'Run npx @open-slide/cli init my-deck to scaffold the slide workspace. Every future deck lives inside it.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Ask your agent',
        text: 'Use a slash command like /create-slide and your agent drafts slides as arbitrary React components.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Edit, comment, apply',
        text: 'Click any element to tweak it visually, or leave an @slide-comment marker and run /apply-comments to let the agent rewrite the source.',
      },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  },
];

export default async function HomePage() {
  const stars = await fetchGitHubStars();
  const githubStars = stars !== null ? formatStarCount(stars) : null;

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD payload is built from static, server-only constants
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav githubStars={githubStars} />
      <main className="relative flex-1">
        <Hero />
        <LiveDemo />
        <HowItWorks />
        <Anatomy />
        <Inspector />
        <Assets />
        <Agents />
        <FAQ />
        <GetStarted />
      </main>
      <Footer />
    </>
  );
}
