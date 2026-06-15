import { FaqItem } from './faq-item';

export type QA = { q: string; a: string };

export const faqs: QA[] = [
  {
    q: 'What is open-slide?',
    a: 'open-slide is a React-first slide framework where each slide is a .tsx file rendered on a fixed 1920×1080 canvas. Decks are arbitrary code — versioned in your repo, reviewable in pull requests, and authored alongside (or by) AI agents like Claude Code, Cursor, Codex, and Gemini.',
  },
  {
    q: 'How is open-slide different from Reveal.js, Slidev, or Spectacle?',
    a: 'Other frameworks lean on Markdown, a DSL, or a constrained component library. open-slide gives each slide a full React component on a 1920×1080 canvas, so you can compose any layout, animation, or data visualization you can write in code. The trade-off is fewer guardrails, more control — designed for teams who already think in components.',
  },
  {
    q: 'Which AI coding agents work with open-slide?',
    a: 'Any agent that edits React works. open-slide ships skills for Claude Code, and the same files are editable by Codex, Cursor, Gemini CLI, OpenCode, Windsurf, Zed, and any other tool that can read and write .tsx files. There is no proprietary protocol — agents work because slides are just code.',
  },
  {
    q: 'Do I need to know React to use open-slide?',
    a: 'Basic React knowledge helps, but agents can author the React for you. Many users describe slides in natural language and let the agent generate the .tsx file, then iterate visually using the in-browser inspector. Knowing React unlocks the ceiling; not knowing it is fine for the floor.',
  },
  {
    q: 'How do I get started with open-slide?',
    a: 'Run `npx @open-slide/cli init` to scaffold a workspace. The CLI sets up the @open-slide/core runtime, the dev server, and example slides. Open the dev server in your browser, ask your agent to draft a deck, and iterate with the visual inspector or by leaving @slide-comment markers in the source.',
  },
  {
    q: 'Is open-slide open source?',
    a: 'Yes. open-slide is MIT-licensed. The runtime ships as @open-slide/core on npm and the scaffolder as @open-slide/cli. Source lives at github.com/1weiho/open-slide.',
  },
];

export function FAQ() {
  return (
    <section id="faq" className="relative">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-[color:var(--color-rule)]" />
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12 py-20 sm:py-32 lg:py-40">
        <h2 className="text-[32px] sm:text-[44px] lg:text-[64px] leading-[1.1] sm:leading-[1.05] tracking-[-0.03em] max-w-[820px] mb-14 sm:mb-20">
          <span className="font-[family-name:var(--font-sans)] font-medium">Questions,</span>{' '}
          <span className="font-[family-name:var(--font-display)] italic text-[color:var(--color-accent)]">
            answered.
          </span>
        </h2>

        <dl className="max-w-[860px]">
          {faqs.map((item, idx) => (
            <FaqItem key={item.q} item={item} index={idx} />
          ))}
        </dl>
      </div>
    </section>
  );
}
