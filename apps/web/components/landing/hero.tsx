import { Container } from './frame';
import { HeroActions } from './hero-actions';
import { LiveDemo } from './live-demo';

export function Hero() {
  return (
    <section className="relative">
      <Container className="pt-20 sm:pt-28 lg:pt-32">
        <div className="mx-auto flex max-w-[840px] flex-col items-center gap-6 text-center sm:gap-8">
          <a
            href="https://x.com/1weiho/status/2078505891247329700"
            target="_blank"
            rel="noopener noreferrer"
            className="group rise pressable inline-flex h-8 items-center gap-2 rounded-full border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] pl-2.5 pr-3 text-[13px] font-medium text-[color:var(--color-text-soft)] hover:border-[color:var(--color-dim)] hover:text-[color:var(--color-text)]"
            style={{ animationDelay: '40ms' }}
          >
            <span aria-hidden className="size-1.5 rounded-full bg-[color:var(--color-accent)]" />
            Introducing Morph Transition
            <span
              aria-hidden
              className="text-[color:var(--color-muted)] transition-transform duration-200 group-hover:translate-x-0.5"
            >
              →
            </span>
          </a>

          <h1
            className="rise text-[44px] font-medium leading-[1.02] tracking-[-0.04em] text-[color:var(--color-text)] sm:text-[64px] lg:text-[76px]"
            style={{ animationDelay: '120ms' }}
          >
            The slide framework
            <br />
            built for agents.
          </h1>

          <p
            className="rise max-w-[560px] text-pretty text-[17px] leading-[1.55] text-[color:var(--color-text-soft)] sm:text-[19px]"
            style={{ animationDelay: '220ms' }}
          >
            A React-first slide framework. Every page is arbitrary code on a 1920×1080 canvas. No
            layout to fight. Design anything you can imagine.
          </p>

          <div className="rise" style={{ animationDelay: '320ms' }}>
            <HeroActions />
          </div>
        </div>
      </Container>

      <LiveDemo />
    </section>
  );
}
