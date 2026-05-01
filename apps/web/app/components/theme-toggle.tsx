'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

type Option = {
  value: 'system' | 'light' | 'dark';
  label: string;
  icon: React.ReactNode;
};

const OPTIONS: Option[] = [
  { value: 'system', label: 'Auto', icon: <AutoIcon /> },
  { value: 'light', label: 'Light', icon: <SunIcon /> },
  { value: 'dark', label: 'Dark', icon: <MoonIcon /> },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const current = mounted ? (theme ?? 'system') : 'system';

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex items-center gap-0.5 h-8 p-0.5 rounded-full border border-[color:var(--color-rule)] bg-[color:var(--color-panel)]/60"
    >
      {OPTIONS.map((opt) => {
        const active = current === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={opt.label}
            title={opt.label}
            onClick={() => setTheme(opt.value)}
            className={
              'inline-flex items-center justify-center h-7 w-7 rounded-full transition-colors ' +
              (active
                ? 'bg-[color:var(--color-panel-hi)] text-[color:var(--color-text)] shadow-[inset_0_0_0_1px_var(--color-rule)]'
                : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]')
            }
          >
            {opt.icon}
          </button>
        );
      })}
    </div>
  );
}

function AutoIcon() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18" />
      <path d="M12 3a9 9 0 0 1 0 18" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m4.93 19.07 1.41-1.41" />
      <path d="m17.66 6.34 1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}
