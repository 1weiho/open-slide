import { cn } from '@/lib/cn';

export function VercelOssBadge({
  className,
  imageClassName,
}: {
  className?: string;
  imageClassName?: string;
}) {
  return (
    <a
      href="https://vercel.com/open-source-program"
      target="_blank"
      rel="noopener noreferrer"
      className={cn('block w-fit opacity-75 transition-opacity hover:opacity-100', className)}
    >
      <img
        alt="Vercel OSS Program"
        src="https://vercel.com/oss/program-badge-2026.svg"
        className={cn('vercel-oss-badge w-auto', imageClassName)}
      />
    </a>
  );
}
