import Link from 'next/link';
import { HeroSetup } from './hero-setup';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="dot-grid absolute inset-0" />
      <div aria-hidden className="bloom absolute inset-0" />

      <div className="relative mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12 pt-16 sm:pt-24 lg:pt-32 pb-20 sm:pb-32">
        <div className="flex flex-col gap-10 sm:gap-14 max-w-[920px]">
          <div className="flex flex-col items-start gap-6 sm:gap-8">
            <Link
              href="/docs/primitive/morph-element"
              className="group inline-flex items-center gap-2.5 rounded-full border border-[color:var(--color-rule)] bg-[color:var(--color-panel)]/70 py-1.5 pl-3.5 pr-3 text-[13px] font-medium text-[color:var(--color-text-soft)] backdrop-blur transition-colors hover:border-[color:var(--color-dim)] hover:text-[color:var(--color-text)] rise"
              style={{ animationDelay: '40ms' }}
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent)]"
              />
              Introducing Morph Transition
              <span
                aria-hidden
                className="text-[color:var(--color-muted)] transition-transform duration-200 group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>

            <h1
              className="text-sheen text-[42px] sm:text-[68px] lg:text-[92px] leading-[1.05] sm:leading-[1.0] tracking-[-0.045em] font-medium text-[color:var(--color-text)] rise"
              style={{ animationDelay: '120ms' }}
            >
              The slide framework
              <br />
              built for <span className="accent-fill text-[color:var(--color-accent)]">agents</span>
              .
            </h1>
          </div>

          <p
            className="max-w-[600px] text-[18px] sm:text-[20px] leading-[1.6] text-[color:var(--color-text-soft)] rise"
            style={{ animationDelay: '240ms' }}
          >
            A React-first slide framework. Every page is arbitrary code on a 1920×1080 canvas. No
            layout to fight. Design anything you can imagine.
          </p>

          <div className="w-full rise" style={{ animationDelay: '360ms' }}>
            <HeroSetup />
          </div>
        </div>
      </div>
    </section>
  );
}
