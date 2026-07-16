import { HeroSetup } from './hero-setup';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="hair absolute inset-x-0 top-0" />

      <div className="relative mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12 pt-20 sm:pt-32 lg:pt-44 pb-20 sm:pb-32">
        <div className="flex flex-col gap-10 sm:gap-14 max-w-[920px]">
          <h1
            className="text-[42px] sm:text-[68px] lg:text-[92px] leading-[1.05] sm:leading-[1.0] tracking-[-0.045em] font-medium text-[color:var(--color-text)] rise"
            style={{ animationDelay: '80ms' }}
          >
            The slide framework
            <br />
            built for <span className="text-[color:var(--color-accent)]">agents</span>.
          </h1>

          <p
            className="max-w-[600px] text-[18px] sm:text-[20px] leading-[1.6] text-[color:var(--color-text-soft)] rise"
            style={{ animationDelay: '200ms' }}
          >
            A React-first slide framework. Every page is arbitrary code on a 1920×1080 canvas. No
            layout to fight. Design anything you can imagine.
          </p>

          <div className="w-full rise" style={{ animationDelay: '320ms' }}>
            <HeroSetup />
          </div>
        </div>
      </div>
    </section>
  );
}
