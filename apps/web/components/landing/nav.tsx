'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import posthog from 'posthog-js';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './theme-toggle';

export function Nav({ githubStars }: { githubStars?: string | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // The mobile panel only exists below md; if the viewport grows past the
  // breakpoint while it's open, close it so focus can't hide off-screen.
  useEffect(() => {
    if (!menuOpen) return;
    const mq = window.matchMedia('(min-width: 768px)');
    const close = () => setMenuOpen(false);
    mq.addEventListener('change', close);
    return () => mq.removeEventListener('change', close);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <header
      data-scrolled={scrolled ? '' : undefined}
      className="site-nav sticky top-0 z-40 bg-[color:var(--color-ink)]/85 backdrop-blur-md border-b border-[color:var(--color-rule-soft)]"
    >
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12 h-14 flex items-center justify-between">
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

        <nav className="flex items-center gap-6 text-[13.5px] font-medium">
          <Link
            href="/docs"
            className="hidden md:inline text-[color:var(--color-muted)] hover:text-[color:var(--color-text)] transition-colors"
          >
            Docs
          </Link>
          <a
            href="https://demo.open-slide.dev/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => posthog.capture('nav_external_link_clicked', { label: 'demo' })}
            className="hidden md:inline text-[color:var(--color-muted)] hover:text-[color:var(--color-text)] transition-colors"
          >
            Demo
          </a>
          <a
            href="https://github.com/1weiho/open-slide"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => posthog.capture('nav_external_link_clicked', { label: 'github' })}
            className="hidden md:inline-flex items-center gap-2 text-[color:var(--color-muted)] hover:text-[color:var(--color-text)] transition-colors"
          >
            <span>GitHub</span>
            {githubStars ? (
              <span
                aria-label={`${githubStars} GitHub stars`}
                className="inline-flex items-center gap-1 rounded-full border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] px-2 py-[2px] font-[family-name:var(--font-mono)] text-[10.5px] text-[color:var(--color-text)]"
              >
                <span aria-hidden>★</span>
                {githubStars}
              </span>
            ) : null}
          </a>
          <ThemeToggle />
          <Link
            href="/docs"
            className="pressable hidden sm:inline-flex h-8 items-center rounded-full bg-[color:var(--color-text)] px-3.5 text-[13px] font-medium text-[color:var(--color-ink)] hover:opacity-80"
          >
            Get started
          </Link>

          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="pressable md:hidden inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--color-rule)] bg-[color:var(--color-panel)]/60 text-[color:var(--color-text)]"
          >
            <MenuGlyph open={menuOpen} />
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            key="mobile-nav"
            className="md:hidden absolute inset-x-0 top-full overflow-hidden border-b border-[color:var(--color-rule)] bg-[color:var(--color-ink)] shadow-[0_16px_40px_-24px_oklch(0_0_0/0.4)]"
            initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={
              reduceMotion
                ? { opacity: 1 }
                : {
                    height: 'auto',
                    opacity: 1,
                    transition: { duration: 0.32, ease: [0.23, 1, 0.32, 1] },
                  }
            }
            exit={
              reduceMotion
                ? { opacity: 0 }
                : {
                    height: 0,
                    opacity: 0,
                    transition: { duration: 0.22, ease: [0.23, 1, 0.32, 1] },
                  }
            }
          >
            <nav
              id="mobile-nav-menu"
              className="mx-auto max-w-[1360px] px-5 sm:px-8 py-4 flex flex-col gap-1 text-[15px] font-medium"
            >
              <MobileLink href="/docs" onNavigate={() => setMenuOpen(false)}>
                Docs
              </MobileLink>
              <MobileLink
                href="https://demo.open-slide.dev/"
                external
                onNavigate={() => {
                  posthog.capture('nav_external_link_clicked', { label: 'demo' });
                  setMenuOpen(false);
                }}
              >
                Demo
              </MobileLink>
              <MobileLink
                href="https://github.com/1weiho/open-slide"
                external
                onNavigate={() => {
                  posthog.capture('nav_external_link_clicked', { label: 'github' });
                  setMenuOpen(false);
                }}
              >
                <span className="inline-flex items-center gap-2">
                  GitHub
                  {githubStars ? (
                    <span
                      aria-label={`${githubStars} GitHub stars`}
                      className="inline-flex items-center gap-1 rounded-full border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] px-2 py-[2px] font-[family-name:var(--font-mono)] text-[10.5px] text-[color:var(--color-text)]"
                    >
                      <span aria-hidden>★</span>
                      {githubStars}
                    </span>
                  ) : null}
                </span>
              </MobileLink>

              <Link
                href="/docs"
                onClick={() => setMenuOpen(false)}
                className="pressable mt-3 inline-flex h-11 items-center justify-center rounded-full bg-[color:var(--color-text)] px-4 text-[14px] font-medium text-[color:var(--color-ink)] hover:opacity-80"
              >
                Get started
              </Link>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

function MobileLink({
  href,
  external = false,
  onNavigate,
  children,
}: {
  href: string;
  external?: boolean;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  const className =
    'flex items-center justify-between rounded-[8px] px-3 py-3 text-[color:var(--color-text-soft)] transition-colors hover:bg-[color:var(--color-panel)] hover:text-[color:var(--color-text)]';

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className={className}
      >
        {children}
        <span aria-hidden className="text-[color:var(--color-muted)]">
          ↗
        </span>
      </a>
    );
  }

  return (
    <Link href={href} onClick={onNavigate} className={className}>
      {children}
      <span aria-hidden className="text-[color:var(--color-muted)]">
        →
      </span>
    </Link>
  );
}

function MenuGlyph({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      {open ? (
        <>
          <path d="M4 4l8 8" />
          <path d="M12 4l-8 8" />
        </>
      ) : (
        <>
          <path d="M2.5 5h11" />
          <path d="M2.5 11h11" />
        </>
      )}
    </svg>
  );
}
