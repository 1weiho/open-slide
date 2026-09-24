import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

type Variant = 'primary' | 'secondary';
type Size = 'md' | 'lg';

const base =
  'pressable inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium';

const variants: Record<Variant, string> = {
  primary: 'bg-[color:var(--color-text)] text-[color:var(--color-ink)] hover:opacity-85',
  secondary:
    'border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] text-[color:var(--color-text)] hover:border-[color:var(--color-dim)]',
};

const sizes: Record<Size, string> = {
  md: 'h-9 px-4 text-[13.5px]',
  lg: 'h-11 px-5 text-[14.5px]',
};

export function ButtonLink({
  href,
  children,
  variant = 'primary',
  size = 'md',
  className = '',
}: {
  href: ComponentProps<typeof Link>['href'];
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </Link>
  );
}
