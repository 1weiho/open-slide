import type { CSSProperties, ReactNode } from 'react';
import { AgentLogos } from './agents';
import { AnatomyVisual } from './anatomy';
import { Container, SectionHeading } from './frame';
import { AgentApplyVisual, VisualEditorVisual } from './inspector';
import { PromptComposer } from './prompt-composer';

const mono = 'font-[family-name:var(--font-mono)] text-[13px] text-[color:var(--color-text)]';

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
            body="Each page is a React component on a 1920×1080 canvas. Anything you can write in code, you can put on a slide."
            visual={<AnatomyVisual />}
          />

          <FeatureCard
            delay={80}
            title="Prompt to deck."
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
            body="Slides are plain .tsx files, so any tool that reads and writes React already works."
            visual={<AgentLogos />}
          />

          <FeatureCard
            title="Comment. The agent applies."
            body={
              <>
                Leave a note on any element. Run <span className={mono}>/apply-comments</span> and
                the agent edits exactly what you flagged.
              </>
            }
            visual={<AgentApplyVisual />}
          />

          <FeatureCard
            delay={80}
            title="Click. Tweak. Save."
            body="Select any element and change text, type, or color on the canvas. One Save lands the batch as a single write."
            visual={<VisualEditorVisual />}
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
  wide = false,
  delay = 0,
}: {
  title: string;
  body: ReactNode;
  visual: ReactNode;
  wide?: boolean;
  delay?: number;
}) {
  return (
    <article
      data-reveal
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
      className={`group flex flex-col overflow-hidden rounded-2xl border border-[color:var(--color-rule-soft)] bg-[color:var(--color-panel)] transition-colors duration-300 hover:border-[color:var(--color-rule)] ${
        wide ? 'lg:col-span-2' : ''
      }`}
    >
      <div className="flex flex-1 items-center justify-center bg-[color:var(--color-panel-hi)] p-6 sm:p-8">
        <div className="w-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5">
          {visual}
        </div>
      </div>
      <div className="flex flex-col gap-1.5 px-6 py-5 sm:px-7 sm:py-6">
        <h3 className="text-[17px] font-medium leading-[1.3] tracking-[-0.015em] text-[color:var(--color-text)]">
          {title}
        </h3>
        <p className="max-w-[56ch] text-pretty text-[14.5px] leading-[1.55] text-[color:var(--color-muted)]">
          {body}
        </p>
      </div>
    </article>
  );
}
