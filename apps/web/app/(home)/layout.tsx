import './landing.css';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <div className="os-landing relative flex-1 flex flex-col">
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden sm:block">
        <div className="frame-w h-full border-x border-[color:var(--color-rule-soft)]" />
      </div>
      {children}
    </div>
  );
}
