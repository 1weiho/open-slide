import type { ReactNode } from 'react';

export function Container({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1200px] px-6 sm:px-8 ${className}`}>{children}</div>
  );
}

export function SectionHeading({ title, lead }: { title: ReactNode; lead?: ReactNode }) {
  return (
    <div data-reveal className="mb-12 flex flex-col gap-4 sm:mb-16">
      <h2 className="max-w-[22ch] text-[28px] font-medium leading-[1.1] tracking-[-0.025em] text-[color:var(--color-text)] sm:text-[36px] lg:text-[44px]">
        {title}
      </h2>
      {lead ? (
        <p className="max-w-[56ch] text-[16px] leading-[1.6] text-[color:var(--color-text-soft)] sm:text-[17px]">
          {lead}
        </p>
      ) : null}
    </div>
  );
}
