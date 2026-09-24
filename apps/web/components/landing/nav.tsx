'use client';

import Image from 'next/image';
import Link from 'next/link';
import posthog from 'posthog-js';
import { ButtonLink } from './button';
import { ThemeToggle } from './theme-toggle';

const linkClass =
  'rounded-full px-3 py-1.5 text-[13.5px] font-medium text-[color:var(--color-text-soft)] transition-colors hover:bg-[color:var(--color-panel-hi)] hover:text-[color:var(--color-text)]';

export function Nav({ githubStars }: { githubStars?: string | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--color-rule-soft)] bg-[color:var(--color-ink)]/80 backdrop-blur-md">
      <div className="relative mx-auto flex h-[60px] w-full max-w-[1200px] items-center justify-between px-6 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[14px] font-medium tracking-[-0.01em]"
        >
          <Image
            src="/open-slide.png"
            alt="open-slide logo"
            width={24}
            height={24}
            priority
            className="block h-6 w-6 rounded-[4px]"
          />
          <span className="text-[color:var(--color-text)]">open-slide</span>
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 md:flex">
          <Link href="/docs" className={linkClass}>
            Docs
          </Link>
          <a
            href="https://demo.open-slide.dev/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => posthog.capture('nav_external_link_clicked', { label: 'demo' })}
            className={linkClass}
          >
            Demo
          </a>
          <a
            href="https://github.com/open-slide/open-slide"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => posthog.capture('nav_external_link_clicked', { label: 'github' })}
            className={`${linkClass} inline-flex items-center gap-2`}
          >
            <span>GitHub</span>
            {githubStars ? (
              <span
                aria-label={`${githubStars} GitHub stars`}
                className="font-[family-name:var(--font-mono)] text-[11px] text-[color:var(--color-muted)]"
              >
                ★ {githubStars}
              </span>
            ) : null}
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <ButtonLink href="/docs">Get started</ButtonLink>
        </div>
      </div>
    </header>
  );
}
