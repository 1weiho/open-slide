export function IconSwitcherIndicator({ index }: { index: 0 | 1 }) {
  return (
    <span
      aria-hidden
      data-icon-switcher-indicator
      className="pointer-events-none absolute inset-y-0.5 left-0.5 w-8 rounded-md bg-card shadow-edge transition-transform duration-200 ease-swift motion-reduce:transition-none"
      style={{ transform: `translateX(${index * 100}%)` }}
    />
  );
}
