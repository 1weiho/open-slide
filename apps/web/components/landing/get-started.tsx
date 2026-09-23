import Link from 'next/link';
import type { CSSProperties } from 'react';
import { CopyCommand } from './copy-command';
import { Container } from './frame';

export function GetStarted() {
  return (
    <section id="install" className="border-t border-[color:var(--color-rule-soft)]">
      <Container className="py-24 sm:py-32">
        <div className="flex max-w-[720px] flex-col gap-8 sm:gap-10">
          <h2
            data-reveal
            className="text-[32px] font-medium leading-[1.05] tracking-[-0.03em] text-[color:var(--color-text)] sm:text-[44px] lg:text-[56px]"
          >
            Author a deck
            <br />
            <span className="text-[color:var(--color-accent)]">in the next minute.</span>
          </h2>

          <p
            data-reveal
            style={{ '--reveal-delay': '80ms' } as CSSProperties}
            className="max-w-[520px] text-[17px] leading-[1.6] text-[color:var(--color-text-soft)]"
          >
            One command, zero config. Your agent takes it from here.
          </p>

          <div
            data-reveal
            style={{ '--reveal-delay': '160ms' } as CSSProperties}
            className="flex flex-wrap items-center gap-4"
          >
            <CopyCommand command="npx @open-slide/cli init" />
            <Link
              href="/docs"
              className="group inline-flex h-12 items-center gap-2 px-2 text-[14px] font-medium text-[color:var(--color-muted)] transition-colors hover:text-[color:var(--color-text)] sm:h-[52px]"
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
      </Container>
    </section>
  );
}
