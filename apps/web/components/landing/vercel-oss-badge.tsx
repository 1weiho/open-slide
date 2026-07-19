import { cn } from '@/lib/cn';

export function VercelOssBadge({ className }: { className?: string }) {
  return (
    <a
      href="https://vercel.com/open-source-program"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Vercel OSS Program"
      className={cn(
        'flex w-fit items-center gap-2.5 opacity-75 transition-opacity hover:opacity-100',
        className,
      )}
    >
      <img src="/assets/vercel-light.svg" alt="" className="logo-light h-3.5 w-auto" />
      <img src="/assets/vercel-dark.svg" alt="" className="logo-dark h-3.5 w-auto" />
      <span className="font-[family-name:var(--font-mono)] text-[10px] leading-[1.45] uppercase tracking-[0.06em] text-[color:var(--color-text)]">
        <span className="block">
          Vercel Inc. <span className="text-[color:var(--color-muted)]">{'//'}</span> 2026
        </span>
        <span className="block">Open Source Software Program</span>
      </span>
    </a>
  );
}
