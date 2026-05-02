'use client';

import posthog from 'posthog-js';
import { CopyCommand } from './copy-command';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(1200px 720px at 18% 30%, rgba(113,112,255,0.18) 0%, transparent 62%), radial-gradient(900px 600px at 88% 82%, rgba(163,160,255,0.10) 0%, transparent 60%)',
        }}
      />

      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(113,112,255,0.7), transparent)',
        }}
      />

      <div className="relative mx-auto max-w-[1360px] px-8 lg:px-12 pt-20 lg:pt-32 pb-24">
        <div>
          <div className="flex flex-col gap-10">
            <div className="caption rise" style={{ animationDelay: '40ms' }}>
              a slide framework for the agent era
            </div>

            <h1
              className="text-[64px] sm:text-[84px] lg:text-[128px] leading-[0.94] tracking-[-0.035em] rise"
              style={{ animationDelay: '120ms' }}
            >
              <span className="font-[family-name:var(--font-sans)] font-medium text-[color:var(--color-text)]">
                Slides as code.
              </span>
              <br />
              <span className="font-[family-name:var(--font-display)] italic text-[color:var(--color-paper)]">
                Crafted by{' '}
                <span className="text-[color:var(--color-accent)] relative">
                  agents
                  <svg
                    aria-hidden
                    viewBox="0 0 260 16"
                    className="absolute left-0 right-0 -bottom-2 w-full h-[12px] text-[color:var(--color-accent)]"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2 10 C 60 2, 140 14, 258 4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                .
              </span>
            </h1>

            <p
              className="max-w-[720px] text-[18px] sm:text-[20px] leading-[1.55] text-[color:var(--color-text-soft)] rise"
              style={{ animationDelay: '240ms' }}
            >
              A React-first slide framework authored by AI agents. Every page is arbitrary code on a{' '}
              <span className="font-[family-name:var(--font-mono)] text-[color:var(--color-text)]">
                1920×1080
              </span>{' '}
              canvas—{' '}
              <span className="text-[color:var(--color-muted)]">versioned, reviewable, yours.</span>
            </p>

            <div
              className="flex flex-wrap items-center gap-4 rise"
              style={{ animationDelay: '360ms' }}
            >
              <CopyCommand command="npx @open-slide/cli init" />
              <a
                href="https://github.com/1weiho/open-slide"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => posthog.capture('github_link_clicked', { location: 'hero' })}
                className="group inline-flex items-center gap-2 h-[52px] px-5 rounded-[10px] border border-[color:var(--color-rule)] text-[14px] font-[family-name:var(--font-mono)] text-[color:var(--color-text)] hover:border-[color:var(--color-text)] transition"
              >
                <GithubGlyph />
                <span>1weiho/open-slide</span>
                <span
                  aria-hidden
                  className="text-[color:var(--color-muted)] group-hover:translate-x-0.5 transition-transform"
                >
                  ↗
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GithubGlyph() {
  return (
    <svg
      aria-hidden
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-[color:var(--color-text-soft)]"
    >
      <path d="M12 .5C5.73.5.67 5.56.67 11.83c0 5 3.24 9.24 7.75 10.74.57.1.78-.25.78-.55v-2.05c-3.15.68-3.82-1.35-3.82-1.35-.52-1.3-1.27-1.64-1.27-1.64-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.74 2.67 1.24 3.32.95.1-.74.4-1.25.73-1.54-2.52-.29-5.17-1.26-5.17-5.6 0-1.23.44-2.24 1.17-3.03-.12-.28-.51-1.43.1-2.98 0 0 .95-.3 3.1 1.15a10.72 10.72 0 0 1 5.65 0c2.15-1.45 3.1-1.15 3.1-1.15.62 1.55.23 2.7.11 2.98.73.79 1.17 1.8 1.17 3.03 0 4.35-2.65 5.3-5.18 5.58.42.36.77 1.06.77 2.14v3.17c0 .3.2.66.79.55 4.5-1.5 7.74-5.74 7.74-10.74C23.33 5.56 18.27.5 12 .5Z" />
    </svg>
  );
}
