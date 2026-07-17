'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import posthog from 'posthog-js';
import { useEffect, useRef, useState } from 'react';

const setupOptions = {
  you: {
    label: 'For you',
    displayContent: 'npx @open-slide/cli init',
    content: 'npx @open-slide/cli init',
    copyLabel: 'Copy setup command',
  },
  agent: {
    label: 'For your agent',
    displayContent: 'Copy Prompt',
    content:
      'Set up an open-slide workspace with `npx @open-slide/cli init`. Install the dependencies, start the dev server, and tell me the local URL when it is ready.',
    copyLabel: 'Copy agent setup prompt',
  },
} as const;

type SetupMode = keyof typeof setupOptions;
type SetupDirection = 1 | -1;
const setupModes = Object.keys(setupOptions) as SetupMode[];
const setupContentVariants = {
  enter: (direction: SetupDirection) => ({ opacity: 0, y: direction === 1 ? 8 : -8 }),
  center: { opacity: 1, y: 0 },
  exit: (direction: SetupDirection) => ({ opacity: 0, y: direction === 1 ? -8 : 8 }),
};

export function HeroSetup() {
  const [mode, setMode] = useState<SetupMode>('you');
  const [direction, setDirection] = useState<SetupDirection>(1);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reduceMotion = useReducedMotion();
  const option = setupOptions[mode];

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  const selectMode = (nextMode: SetupMode) => {
    if (nextMode === mode) return;
    clearTimeout(copiedTimer.current);
    setCopied(false);
    setDirection(nextMode === 'agent' ? 1 : -1);
    setMode(nextMode);
    posthog.capture('hero_setup_mode_selected', { mode: nextMode });
  };

  const copySetup = async () => {
    if (!(await writeToClipboard(option.content))) return;
    clearTimeout(copiedTimer.current);
    setCopied(true);
    copiedTimer.current = setTimeout(() => setCopied(false), 1500);
    posthog.capture(mode === 'you' ? 'command_copied' : 'agent_setup_prompt_copied', {
      location: 'hero',
    });
  };

  return (
    <div className="flex w-full flex-col items-start gap-3 sm:gap-4">
      <div
        role="group"
        aria-label="Choose how to set up open-slide"
        className="flex items-center text-[14px] sm:text-[15px]"
      >
        {setupModes.map((key, index) => (
          <div key={key} className="flex items-center">
            {index > 0 ? (
              <span aria-hidden className="mx-1 h-5 w-px bg-[color:var(--color-rule)] sm:mx-2" />
            ) : null}
            <button
              type="button"
              aria-pressed={mode === key}
              onClick={() => selectMode(key)}
              className={`rounded-md py-1.5 transition-colors duration-200 ${
                key === 'you' ? 'pl-2 pr-3 sm:pr-4' : 'px-3 sm:px-4'
              } ${
                mode === key
                  ? 'text-[color:var(--color-text)]'
                  : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-text-soft)]'
              }`}
            >
              <span className="grid">
                <span aria-hidden className="invisible col-start-1 row-start-1 font-medium">
                  {setupOptions[key].label}
                </span>
                <span
                  className={`col-start-1 row-start-1 ${mode === key ? 'font-medium' : 'font-normal'}`}
                >
                  {setupOptions[key].label}
                </span>
              </span>
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label={option.copyLabel}
        onClick={copySetup}
        className="group flex h-[58px] w-[337px] max-w-full items-center gap-3 rounded-full border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] px-5 text-left shadow-[0_18px_70px_-36px_color-mix(in_oklab,var(--color-accent)_55%,transparent)] transition-[border-color,background-color,box-shadow] duration-200 hover:border-[color:var(--color-accent)]/50 hover:bg-[color:var(--color-panel-hi)] hover:shadow-[0_22px_80px_-34px_color-mix(in_oklab,var(--color-accent)_65%,transparent)] sm:h-[68px] sm:px-7"
      >
        <span className="relative h-[20px] min-w-0 flex-1 overflow-hidden sm:h-[22px]">
          <AnimatePresence initial={false} custom={direction}>
            <motion.span
              key={mode}
              custom={direction}
              variants={setupContentVariants}
              initial={reduceMotion ? false : 'enter'}
              animate="center"
              exit={reduceMotion ? 'center' : 'exit'}
              transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.2, 0.7, 0.2, 1] }}
              className="absolute inset-0 flex items-center gap-3 sm:gap-4"
            >
              <span
                aria-hidden
                className="flex w-4 shrink-0 items-center justify-center font-[family-name:var(--font-mono)] text-[17px] text-[color:var(--color-accent)] sm:text-[19px]"
              >
                {mode === 'you' ? '$' : '✦'}
              </span>
              <span className="min-w-0 flex-1 truncate font-[family-name:var(--font-mono)] text-[13px] tracking-[-0.02em] text-[color:var(--color-text)] sm:text-[15px]">
                {option.displayContent}
              </span>
            </motion.span>
          </AnimatePresence>
        </span>
        <span
          aria-hidden
          className="relative ml-1 flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[color:var(--color-muted)] transition-colors group-hover:text-[color:var(--color-accent)]"
        >
          <CopyGlyph
            className={`absolute inset-0 transition-all duration-200 ${copied ? 'scale-75 opacity-0' : 'scale-100 opacity-100'}`}
          />
          <CheckGlyph
            className={`absolute inset-0 text-[color:var(--color-mint)] transition-all duration-200 ${copied ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}
          />
        </span>
        <span className="sr-only" aria-live="polite">
          {copied ? 'Copied' : ''}
        </span>
      </button>
    </div>
  );
}

async function writeToClipboard(content: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(content);
      return true;
    } catch {
      return copyWithExecCommand(content);
    }
  }

  return copyWithExecCommand(content);
}

function copyWithExecCommand(content: string): boolean {
  const textArea = document.createElement('textarea');
  textArea.value = content;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.append(textArea);
  textArea.select();
  try {
    return document.execCommand('copy');
  } finally {
    textArea.remove();
  }
}

function CopyGlyph({ className }: { className?: string }) {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="8" y="8" width="11" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M16 6V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckGlyph({ className }: { className?: string }) {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="m5 12.5 4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
