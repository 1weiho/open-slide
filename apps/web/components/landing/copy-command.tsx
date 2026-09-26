'use client';

import posthog from 'posthog-js';
import { useEffect, useRef, useState } from 'react';
import { writeToClipboard } from './clipboard';

const sizes = {
  md: 'h-9 pl-3.5 pr-2.5 text-[12.5px]',
  lg: 'h-11 pl-4 pr-3 text-[13.5px]',
} as const;

export function CopyCommand({
  command,
  location,
  size = 'md',
}: {
  command: string;
  location: string;
  size?: keyof typeof sizes;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onCopy = async () => {
    if (!(await writeToClipboard(command))) return;
    clearTimeout(timer.current);
    setCopied(true);
    timer.current = setTimeout(() => setCopied(false), 1500);
    posthog.capture('command_copied', { command, location });
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={`Copy ${command}`}
      className={`group pressable inline-flex max-w-full items-center gap-2.5 rounded-full border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] font-[family-name:var(--font-mono)] text-[color:var(--color-text)] hover:border-[color:var(--color-dim)] ${sizes[size]}`}
    >
      <span aria-hidden className="text-[color:var(--color-accent)]">
        $
      </span>
      <span className="truncate tracking-[-0.01em]">{command}</span>
      <span
        aria-hidden
        className="ml-0.5 inline-flex size-6 items-center justify-center rounded-full text-[color:var(--color-muted)] transition-colors group-hover:bg-[color:var(--color-panel-hi)] group-hover:text-[color:var(--color-text)]"
      >
        <span className="relative inline-flex size-[14px] items-center justify-center">
          <CopyGlyph
            className={`absolute inset-0 transition-[opacity,scale,filter] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${copied ? 'scale-50 opacity-0 blur-[2px]' : 'scale-100 opacity-100 blur-0'}`}
          />
          <CheckGlyph
            className={`absolute inset-0 text-[color:var(--color-mint)] transition-[opacity,scale,filter] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${copied ? 'scale-100 opacity-100 blur-0' : 'scale-50 opacity-0 blur-[2px]'}`}
          />
        </span>
      </span>
      <span className="sr-only" aria-live="polite">
        {copied ? 'Copied' : ''}
      </span>
    </button>
  );
}

function CopyGlyph({ className }: { className?: string }) {
  return (
    <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="7" y="7" width="12" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckGlyph({ className }: { className?: string }) {
  return (
    <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M5 12.5 10 17.5 19 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
