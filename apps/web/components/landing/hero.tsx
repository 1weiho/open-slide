import { CopyCommand } from './copy-command';
import { HeroDocsLink } from './hero-docs-link';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="hair absolute inset-x-0 top-0" />

      <div className="relative mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12 pt-20 sm:pt-32 lg:pt-44 pb-20 sm:pb-32">
        <div className="flex flex-col gap-10 sm:gap-14 max-w-[920px]">
          <h1
            className="text-[44px] sm:text-[72px] lg:text-[100px] leading-[1.05] sm:leading-[0.98] tracking-[-0.035em] rise"
            style={{ animationDelay: '80ms' }}
          >
            <span className="font-[family-name:var(--font-sans)] font-medium text-[color:var(--color-text)]">
              The slide framework
            </span>
            <br />
            <span className="font-[family-name:var(--font-display)] italic text-[color:var(--color-paper)]">
              built for <span className="text-[color:var(--color-accent)]">agents</span>.
            </span>
          </h1>

          <p
            className="max-w-[600px] text-[18px] sm:text-[20px] leading-[1.6] text-[color:var(--color-text-soft)] rise"
            style={{ animationDelay: '200ms' }}
          >
            A React-first slide framework. Every page is arbitrary code on a 1920×1080 canvas. No
            layout to fight. Design anything you can imagine.
          </p>

          <div
            className="flex flex-wrap items-center gap-x-6 gap-y-4 rise"
            style={{ animationDelay: '320ms' }}
          >
            <CopyCommand command="npx @open-slide/cli init" />
            <HeroDocsLink />
          </div>
        </div>
      </div>
    </section>
  );
}
