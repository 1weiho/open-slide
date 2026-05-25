import { CopyCommand } from './copy-command';

export function GetStarted() {
  return (
    <section id="install" className="relative overflow-hidden">
      <div aria-hidden className="hair absolute inset-x-0 top-0" />
      <div className="relative mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12 py-24 sm:py-36 lg:py-48">
        <div className="flex flex-col gap-10 sm:gap-14 max-w-[820px]">
          <h2 className="text-[36px] sm:text-[52px] lg:text-[80px] leading-[1.05] sm:leading-[1.0] tracking-[-0.035em]">
            <span className="font-[family-name:var(--font-sans)] font-medium">Author a deck</span>
            <br />
            <span className="font-[family-name:var(--font-display)] italic text-[color:var(--color-accent)]">
              in the next minute.
            </span>
          </h2>

          <p className="max-w-[560px] text-[18px] leading-[1.65] text-[color:var(--color-text-soft)]">
            One command, zero config. Your agent takes it from here.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <CopyCommand command="npx @open-slide/cli init" />
          </div>
        </div>
      </div>
    </section>
  );
}
