const features = [
  {
    id: '01',
    eyebrow: 'agent-agnostic',
    title: 'Any agent that writes files can author.',
    body: 'Claude Code, Codex, Gemini, Cursor, opencode, Aider — if it edits React, it authors slides. No proprietary SDK to learn.',
  },
  {
    id: '02',
    eyebrow: 'pure react',
    title: 'No DSL. No templates. No theme.',
    body: 'Every page is a zero-prop React component. Animations, data viz, embedded canvases — whatever React can render, a slide can render.',
  },
  {
    id: '03',
    eyebrow: 'fixed canvas',
    title: 'Design against 1920 × 1080, ship anywhere.',
    body: 'Absolute pixel units. No responsive puzzles. The framework scales the canvas for you — talk, phone, projector.',
  },
  {
    id: '04',
    eyebrow: 'git-tracked',
    title: 'Every diff is a file change.',
    body: 'Review a deck like a pull request. Revert a slide, branch for a draft, bisect a typo. Your existing workflow, applied to presentations.',
  },
  {
    id: '05',
    eyebrow: 'inspector loop',
    title: 'Comment in the page, apply later.',
    body: '@slide-comment markers let you critique in place. The apply-comments skill finds them, rewrites the component, and removes the marker.',
  },
  {
    id: '06',
    eyebrow: 'static output',
    title: 'One build command. HTML + JS + assets.',
    body: 'open-slide build emits a folder. Drop it on Vercel, Cloudflare Pages, Zeabur, S3, a USB stick. No server, no lock-in.',
  },
];

export function Features() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-[1360px] px-8 lg:px-12 py-24 lg:py-32 border-t border-[color:var(--color-rule)]">
        <h2 className="text-[40px] sm:text-[52px] lg:text-[72px] leading-[1.02] tracking-[-0.03em] max-w-[960px] mb-16">
          <span className="font-[family-name:var(--font-sans)] font-medium">
            Boring where it counts.
          </span>
          <br />
          <span className="font-[family-name:var(--font-display)] italic text-[color:var(--color-warm)]">
            Wild where it matters.
          </span>
        </h2>

        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const borderClasses = [
              'border-t border-[color:var(--color-rule)]',
              col > 0 ? 'md:border-l border-[color:var(--color-rule)]' : '',
              row > 0 ? '' : '',
            ].join(' ');
            return (
              <li
                key={f.id}
                className={`relative p-8 lg:p-10 flex flex-col gap-6 min-h-[320px] ${borderClasses}`}
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.22em] uppercase text-[color:var(--color-accent)]">
                    {f.eyebrow}
                  </span>
                  <span className="font-[family-name:var(--font-display)] italic text-[28px] text-[color:var(--color-dim)]">
                    {f.id}
                  </span>
                </div>
                <h3 className="text-[24px] lg:text-[28px] font-medium leading-[1.2] tracking-[-0.02em] max-w-[22ch]">
                  {f.title}
                </h3>
                <p className="text-[15px] leading-[1.6] text-[color:var(--color-text-soft)] max-w-[38ch] mt-auto">
                  {f.body}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
