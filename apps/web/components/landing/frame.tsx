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

export function SectionHeading({
  eyebrow,
  title,
  lead,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
}) {
  return (
    <div
      data-reveal="stagger"
      className="mx-auto mb-12 flex max-w-[720px] flex-col items-center gap-4 text-center sm:mb-16"
    >
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <h2 className="text-balance text-[32px] font-medium leading-[1.08] tracking-[-0.03em] text-[color:var(--color-text)] sm:text-[40px] lg:text-[48px]">
        {title}
      </h2>
      {lead ? (
        <p className="max-w-[54ch] text-pretty text-[16px] leading-[1.6] text-[color:var(--color-text-soft)] sm:text-[17px]">
          {lead}
        </p>
      ) : null}
    </div>
  );
}
