import { useEffect, useRef, useState } from 'react';
import { hasModifier, isTypingTarget } from '@/lib/keys';
import { cn } from '@/lib/utils';

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
  // Latch the last text so the badge keeps its digits while fading out.
  const [display, setDisplay] = useState('');
  const flushRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (buffer) setDisplay(buffer);
  }, [buffer]);

  // Drop the latched text once the exit fade finishes so the aria-live
  // region does not keep a stale value mounted.
  useEffect(() => {
    if (buffer || !display) return;
    const id = setTimeout(() => setDisplay(''), 150);
    return () => clearTimeout(id);
  }, [buffer, display]);

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
      if (isTypingTarget(e.target)) return;
      if (hasModifier(e)) return;

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

  if (!display && !buffer) return null;
  return (
    <div
      aria-live="polite"
      className={cn(
        'pointer-events-none absolute top-1/2 left-1/2 z-40 -translate-x-1/2 -translate-y-1/2 select-none rounded-[10px] bg-black/70 px-6 py-4 font-mono text-[44px] font-medium tracking-[0.05em] text-white tabular-nums shadow-[0_8px_40px_-8px_oklch(0_0_0/0.6)] backdrop-blur-md',
        'motion-safe:transition-[opacity,scale] motion-safe:ease-swift',
        buffer
          ? 'scale-100 opacity-100 motion-safe:duration-200'
          : 'scale-95 opacity-0 motion-safe:duration-150',
      )}
    >
      <span className="text-white/60">→ </span>
      {buffer || display}
    </div>
  );
}
