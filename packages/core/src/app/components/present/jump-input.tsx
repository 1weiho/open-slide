import { useEffect, useRef, useState } from 'react';

const FLUSH_DELAY_MS = 1200;

type Props = {
  pageCount: number;
  onJump: (index: number) => void;
};

/**
 * Listens for digit keypresses anywhere on the document and shows a
 * transient "→ 7" badge. Pressing Enter (or letting it idle) flushes the
 * buffer and jumps to the slide. Designed to be invisible until the user
 * starts typing — never steals focus, never shows an input element.
 */
export function PresentJumpInput({ pageCount, onJump }: Props) {
  const [buffer, setBuffer] = useState('');
  const flushRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const flush = () => {
      setBuffer((current) => {
        if (!current) return current;
        const n = Number.parseInt(current, 10);
        if (Number.isFinite(n) && n >= 1) {
          onJump(Math.min(pageCount, n) - 1);
        }
        return '';
      });
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.matches('input, textarea')) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        setBuffer((b) => (b + e.key).slice(0, 4));
        if (flushRef.current) clearTimeout(flushRef.current);
        flushRef.current = setTimeout(flush, FLUSH_DELAY_MS);
        return;
      }
      if (e.key === 'Enter') {
        if (flushRef.current) clearTimeout(flushRef.current);
        flush();
        return;
      }
      if (e.key === 'Backspace') {
        setBuffer((b) => b.slice(0, -1));
        return;
      }
      if (e.key === 'Escape' || e.key === ' ') {
        setBuffer('');
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (flushRef.current) clearTimeout(flushRef.current);
    };
  }, [pageCount, onJump]);

  if (!buffer) return null;
  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute top-1/2 left-1/2 z-40 -translate-x-1/2 -translate-y-1/2 select-none rounded-[10px] bg-black/70 px-6 py-4 font-mono text-[44px] font-medium tracking-[0.05em] text-white tabular-nums shadow-[0_8px_40px_-8px_oklch(0_0_0/0.6)] backdrop-blur-md"
    >
      <span className="text-white/60">→ </span>
      {buffer}
    </div>
  );
}
