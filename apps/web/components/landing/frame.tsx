export function SectionRule() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[1]">
      <div className="hair" />
      <div className="frame-w relative hidden sm:block">
        <CrossMark className="absolute -top-[6px] -left-[5px]" />
        <CrossMark className="absolute -top-[6px] -right-[5px]" />
      </div>
    </div>
  );
}

export function StripeBand() {
  return (
    <div
      aria-hidden
      className="stripes h-10 border-y border-[color:var(--color-rule-soft)] sm:h-14"
    />
  );
}

function CrossMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden width="11" height="11" viewBox="0 0 11 11" fill="none" className={className}>
      <path d="M5.5 0v11M0 5.5h11" stroke="var(--color-dim)" strokeWidth="1" />
    </svg>
  );
}
