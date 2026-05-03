export function Footer() {
  return (
    <footer className="border-t border-[color:var(--color-rule)] bg-[color:var(--color-panel)]/60">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12 py-10 sm:py-14 grid grid-cols-12 gap-x-6 gap-y-10">
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <div className="flex items-center gap-3 font-[family-name:var(--font-mono)] text-[13px]">
            {/* biome-ignore lint/performance/noImgElement: static brand icon */}
            <img
              src="/open-slide.png"
              alt=""
              aria-hidden
              className="h-6 w-6 rounded-[4px]"
            />
            <span className="tracking-[-0.01em]">open-slide</span>
          </div>
          <p className="text-[14px] leading-[1.6] text-[color:var(--color-muted)] max-w-[38ch]">
            A React-first slide framework authored by AI agents. MIT licensed,
            built for the long haul.
          </p>
        </div>

        <FooterCol
          title="Product"
          links={[
            ["Live demo", "#demo"],
            ["How it works", "#how-it-works"],
            ["Anatomy", "#anatomy"],
            ["Principles", "#principles"],
          ]}
        />
        <FooterCol
          title="Packages"
          links={[
            [
              "@open-slide/core",
              "https://www.npmjs.com/package/@open-slide/core",
            ],
            [
              "@open-slide/cli",
              "https://www.npmjs.com/package/@open-slide/cli",
            ],
          ]}
        />
        <FooterCol
          title="Elsewhere"
          links={[
            ["GitHub", "https://github.com/1weiho/open-slide"],
            ["npm", "https://www.npmjs.com/package/@open-slide/core"],
            ["Issues", "https://github.com/1weiho/open-slide/issues"],
          ]}
        />
      </div>

      <div className="border-t border-[color:var(--color-rule)]">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase text-[color:var(--color-muted)]">
          <span>© open-slide · MIT</span>
          <span>
            Crafted with 🤍 by{" "}
            <a
              href="https://1wei.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[color:var(--color-text)] hover:text-[color:var(--color-accent)] transition-colors"
            >
              Yiwei
            </a>
            .
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div className="col-span-6 md:col-span-4 lg:col-span-2 flex flex-col gap-4">
      <div className="caption">{title}</div>
      <ul className="flex flex-col gap-2">
        {links.map(([label, href]) => (
          <li key={label}>
            <a
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="text-[14px] text-[color:var(--color-text-soft)] hover:text-[color:var(--color-accent)] transition-colors"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
