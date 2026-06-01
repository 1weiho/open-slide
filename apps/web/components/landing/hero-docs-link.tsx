'use client';

import posthog from 'posthog-js';

export function HeroDocsLink() {
  return (
    <a
      href="/docs"
      onClick={() => posthog.capture('docs_link_clicked', { location: 'hero' })}
      className="group inline-flex items-center gap-2 text-[14px] font-[family-name:var(--font-mono)] text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text)] transition-colors"
    >
      <span>Read the docs</span>
      <span
        aria-hidden
        className="text-[color:var(--color-muted)] group-hover:translate-x-0.5 transition-transform"
      >
        →
      </span>
    </a>
  );
}
