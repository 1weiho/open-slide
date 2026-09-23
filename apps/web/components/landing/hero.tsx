import { Container } from './frame';
import { HeroSetup } from './hero-setup';

export function Hero() {
  return (
    <section className="relative">
      <Container className="pt-20 pb-16 sm:pt-28 sm:pb-20 lg:pt-32">
        <div className="flex max-w-[760px] flex-col gap-8 sm:gap-10">
          <a
            href="https://x.com/1weiho/status/2078505891247329700"
            target="_blank"
            rel="noopener noreferrer"
            className="group rise inline-flex w-fit items-center gap-2 text-[13px] font-medium text-[color:var(--color-muted)] transition-colors hover:text-[color:var(--color-text)]"
            style={{ animationDelay: '40ms' }}
          >
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent)]" />
            Introducing Morph Transition
            <span
              aria-hidden
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            >
              →
            </span>
          </a>

          <h1
            className="rise text-[40px] font-medium leading-[1.05] tracking-[-0.035em] text-[color:var(--color-text)] sm:text-[56px] lg:text-[72px]"
            style={{ animationDelay: '120ms' }}
          >
            The slide framework
            <br />
            built for <span className="text-[color:var(--color-accent)]">agents</span>.
          </h1>

          <p
            className="rise max-w-[520px] text-[17px] leading-[1.6] text-[color:var(--color-text-soft)] sm:text-[19px]"
            style={{ animationDelay: '220ms' }}
          >
            A React-first slide framework. Every page is arbitrary code on a 1920×1080 canvas. No
            layout to fight. Design anything you can imagine.
          </p>

          <div className="rise w-full" style={{ animationDelay: '320ms' }}>
            <HeroSetup />
          </div>
        </div>
      </Container>
    </section>
  );
}
