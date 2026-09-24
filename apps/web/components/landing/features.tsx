import type { CSSProperties, ReactNode } from 'react';
import { AgentList } from './agents';
import { AnatomyVisual } from './anatomy';
import { AssetManagerMock } from './assets';
import { Container, SectionHeading } from './frame';
import { AgentApplyVisual, VisualEditorVisual } from './inspector';
import { PromptComposer } from './prompt-composer';

const mono = 'font-[family-name:var(--font-mono)] text-[color:var(--color-accent-soft)]';

const assetCallouts: { eyebrow: string; title: string; body: ReactNode }[] = [
  {
    eyebrow: 'drop · rename · replace',
    title: 'In-place file management.',
    body: 'Drag images straight into the deck. Rename and replace from the same pane the inspector uses to swap an element’s src.',
  },
  {
    eyebrow: 'svgl · 1500+ logos',
    title: 'Brand logos, no dance.',
    body: (
      <>
        Search{' '}
        <a
          href="https://svgl.app/"
          target="_blank"
          rel="noopener noreferrer"
          className={`${mono} underline-offset-4 hover:underline`}
        >
          svgl
        </a>{' '}
        from inside the editor. Pick a result and the SVG lands in your assets folder, ready to
        import.
      </>
    ),
  },
];

export function Features() {
  return (
    <section id="features">
      <Container className="pb-24 sm:pb-32">
        <SectionHeading
          eyebrow="Features"
          title="Just React. And an editor that talks to your agent."
          lead="No DSL, no template language. Each page is a component on a fixed canvas, and every edit writes back to the same file."
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FeatureCard
            wide
            title="A slide is a file."
            body="Each page is a React component on a 1920×1080 canvas. Anything you can write in code, you can put on a slide. Versioned in your repo, reviewable in pull requests."
            visual={<AnatomyVisual />}
          />

          <FeatureCard
            delay={80}
            title="Describe the deck. Your agent writes it."
            body={
              <>
                One <span className={mono}>/create-slide</span> prompt drafts pages as real
                components. Refine with follow-ups, not templates.
              </>
            }
            visual={<PromptComposer />}
          />

          <FeatureCard
            delay={160}
            title="Bring your own agent."
            body="No proprietary protocol. Slides are plain .tsx files, so any tool that reads and writes React already works."
            visual={<AgentList />}
          />

          <FeatureCard
            title="Drop a comment. The agent rewrites the file."
            body={
              <>
                Click any block, leave a note. The inspector pins it as a{' '}
                <span className={mono}>@slide-comment</span> marker in your source. Run{' '}
                <span className={mono}>/apply-comments</span> and the agent edits exactly what you
                flagged.
              </>
            }
            visual={<AgentApplyVisual />}
          />

          <FeatureCard
            delay={80}
            title="Click. Tweak. Save."
            body="Toggle inspect, click any element. Change text, font, weight, color, or swap an image right on the canvas. One Save lands the batch as a single write."
            visual={<VisualEditorVisual />}
          />

          <FeatureCard
            wide
            title="Drop in images. Pull in logos."
            body="Manage every asset from the same pane the inspector uses, and search 1500+ brand logos without leaving the editor."
            aside={
              <dl className="grid gap-5 sm:grid-cols-2">
                {assetCallouts.map((c) => (
                  <div key={c.eyebrow} className="flex flex-col gap-1.5">
                    <dt className="caption">{c.eyebrow}</dt>
                    <dd className="text-[14px] leading-[1.6] text-[color:var(--color-text-soft)]">
                      <span className="font-medium text-[color:var(--color-text)]">{c.title}</span>{' '}
                      {c.body}
                    </dd>
                  </div>
                ))}
              </dl>
            }
            visual={<AssetManagerMock />}
          />
        </div>
      </Container>
    </section>
  );
}

function FeatureCard({
  title,
  body,
  visual,
  aside,
  wide = false,
  delay = 0,
}: {
  title: string;
  body: ReactNode;
  visual: ReactNode;
  aside?: ReactNode;
  wide?: boolean;
  delay?: number;
}) {
  return (
    <article
      data-reveal
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
      className={`flex flex-col gap-7 rounded-2xl border border-[color:var(--color-rule-soft)] bg-[color:var(--color-panel-hi)] p-6 sm:p-8 ${
        wide ? 'lg:col-span-2' : ''
      }`}
    >
      <header
        className={`flex flex-col gap-2 ${aside ? 'lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-10' : ''}`}
      >
        <div className="flex flex-col gap-2">
          <h3 className="text-[20px] font-medium leading-[1.25] tracking-[-0.02em] sm:text-[22px]">
            {title}
          </h3>
          <p className="max-w-[52ch] text-pretty text-[15px] leading-[1.6] text-[color:var(--color-text-soft)]">
            {body}
          </p>
        </div>
        {aside ? <div className="mt-4 lg:mt-1">{aside}</div> : null}
      </header>

      <div className="mt-auto">{visual}</div>
    </article>
  );
}
