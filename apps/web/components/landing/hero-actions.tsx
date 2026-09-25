'use client';

import posthog from 'posthog-js';
import { useEffect, useRef, useState } from 'react';
import { ButtonLink } from './button';
import { writeToClipboard } from './clipboard';
import { CopyCommand } from './copy-command';

const agentPrompt =
  'Set up an open-slide workspace with `npx @open-slide/cli init`. Install the dependencies, start the dev server, and tell me the local URL when it is ready.';

export function HeroActions() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copyPrompt = async () => {
    if (!(await writeToClipboard(agentPrompt))) return;
    clearTimeout(timer.current);
    setCopied(true);
    timer.current = setTimeout(() => setCopied(false), 1500);
    posthog.capture('agent_setup_prompt_copied', { location: 'hero' });
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <ButtonLink href="/docs" size="lg">
          Get started
        </ButtonLink>
        <CopyCommand command="npx @open-slide/cli init" location="hero" size="lg" />
      </div>

      <button
        type="button"
        onClick={copyPrompt}
        aria-label="Copy agent setup prompt"
        className="group inline-flex items-center gap-1.5 text-[13px] text-[color:var(--color-muted)] transition-colors hover:text-[color:var(--color-text)]"
      >
        <span>Using an agent?</span>
        <span
          key={copied ? 'copied' : 'idle'}
          className="swap-in font-medium text-[color:var(--color-text-soft)] underline decoration-[color:var(--color-rule)] underline-offset-4 transition-colors group-hover:text-[color:var(--color-text)] group-hover:decoration-[color:var(--color-dim)]"
        >
          {copied ? 'Prompt copied' : 'Copy the setup prompt instead'}
        </span>
        <span className="sr-only" aria-live="polite">
          {copied ? 'Copied' : ''}
        </span>
      </button>
    </div>
  );
}
