import Link from 'next/link';
import { CopyCommand } from './copy-command';

export function GetStarted() {
  return (
    <section id="install" className="relative overflow-hidden">
      <div aria-hidden className="bloom absolute inset-0" />
      <div className="relative mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12 py-24 sm:py-36 lg:py-48">
        <div className="flex flex-col gap-10 sm:gap-14 max-w-[820px]">
          <h2 className="text-sheen text-[36px] sm:text-[52px] lg:text-[76px] leading-[1.05] sm:leading-[1.0] tracking-[-0.04em] font-medium">
            Author a deck
            <br />
            <span className="accent-fill text-[color:var(--color-accent)]">
              in the next minute.
            </span>
          </h2>

          <p className="max-w-[560px] text-[18px] leading-[1.65] text-[color:var(--color-text-soft)]">
            One command, zero config. Your agent takes it from here.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <CopyCommand command="npx @open-slide/cli init" />
            <Link
              href="/docs"
              className="group inline-flex h-[48px] sm:h-[52px] items-center gap-2 px-2 text-[14px] font-medium text-[color:var(--color-muted)] transition-colors hover:text-[color:var(--color-text)]"
            >
              Read the docs
              <span
                aria-hidden
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
