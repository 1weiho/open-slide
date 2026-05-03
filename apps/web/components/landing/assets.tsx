import type { ReactNode } from "react";

type AssetMock = { name: string; size: string; logo: string };

const assets: AssetMock[] = [
  { name: "claude.svg", size: "3.4 KB", logo: "claude" },
  { name: "codex-dark.svg", size: "2.1 KB", logo: "codex-dark" },
  { name: "gemini.svg", size: "4.0 KB", logo: "gemini" },
  { name: "cursor-dark.svg", size: "5.2 KB", logo: "cursor-dark" },
  { name: "cloudflare.svg", size: "6.8 KB", logo: "cloudflare" },
  { name: "zeabur-dark.svg", size: "4.7 KB", logo: "zeabur-dark" },
];

const svglResults: { name: string; logo: string }[] = [
  { name: "Vercel", logo: "vercel-dark" },
  { name: "Cloudflare", logo: "cloudflare" },
  { name: "Zeabur", logo: "zeabur-dark" },
];

const callouts: { eyebrow: string; title: string; body: ReactNode }[] = [
  {
    eyebrow: "drop · rename · replace",
    title: "In-place file management.",
    body: "Drag images straight into the deck. Rename and replace from the same pane the inspector uses to swap an element’s src.",
  },
  {
    eyebrow: "svgl · 1500+ logos",
    title: "Brand logos, no dance.",
    body: (
      <>
        Search{" "}
        <a
          href="https://svgl.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-[family-name:var(--font-mono)] text-[color:var(--color-accent-soft)] underline-offset-4 hover:underline"
        >
          svgl
        </a>{" "}
        from inside the editor. Pick a result and the SVG lands in your assets
        folder, ready to{" "}
        <code className="font-[family-name:var(--font-mono)] text-[color:var(--color-text)]">
          import
        </code>
        .
      </>
    ),
  },
];

export function Assets() {
  return (
    <section id="assets" className="relative">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-[color:var(--color-rule)]"
      />
      <div className="mx-auto max-w-[1360px] px-8 lg:px-12 py-24 lg:py-32">
        <div className="flex items-end justify-between flex-wrap gap-y-6 mb-16">
          <h2 className="text-[40px] sm:text-[52px] lg:text-[72px] leading-[1.02] tracking-[-0.03em] max-w-[920px]">
            <span className="font-[family-name:var(--font-sans)] font-medium">
              Drop in images.
            </span>
            <br />
            <span className="font-[family-name:var(--font-display)] italic text-[color:var(--color-warm)]">
              Pull in logos.
            </span>
          </h2>
          <div className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.22em] uppercase text-[color:var(--color-muted)]">
            assets · powered by{" "}
            <a
              href="https://svgl.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[color:var(--color-text-soft)] hover:text-[color:var(--color-accent)] transition-colors"
            >
              svgl ↗
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* asset manager mock */}
          <div className="lg:col-span-8">
            <AssetManagerMock />
          </div>

          {/* side callouts */}
          <div className="lg:col-span-4 flex flex-col gap-px bg-[color:var(--color-rule)] border border-[color:var(--color-rule)] rounded-[6px] overflow-hidden">
            {callouts.map((c) => (
              <div
                key={c.eyebrow}
                className="bg-[color:var(--color-ink)] p-7 lg:p-8 flex flex-col gap-3"
              >
                <span className="caption">{c.eyebrow}</span>
                <h3 className="text-[22px] lg:text-[24px] font-medium tracking-[-0.025em] leading-[1.2]">
                  {c.title}
                </h3>
                <p className="text-[14px] leading-[1.6] text-[color:var(--color-text-soft)] max-w-[40ch]">
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AssetManagerMock() {
  return (
    <div className="relative rounded-[6px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] overflow-hidden">
      {/* window header */}
      <div className="flex items-center px-5 h-11 border-b border-[color:var(--color-rule)] font-[family-name:var(--font-mono)] text-[12px] text-[color:var(--color-muted)]">
        <div className="flex items-center gap-2">
          <span className="size-[10px] rounded-full bg-[#ff5f56]" />
          <span className="size-[10px] rounded-full bg-[#ffbd2e]" />
          <span className="size-[10px] rounded-full bg-[#27c93f]" />
        </div>
        <span className="flex-1 text-center">localhost:5173 · assets</span>
        <span className="w-[40px]" />
      </div>

      {/* toolbar — slides/assets switcher + upload */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[color:var(--color-rule)]">
        <div className="relative inline-flex rounded-full border border-[color:var(--color-rule)] bg-[color:var(--color-panel-hi)] p-1">
          <span
            aria-hidden
            className="absolute top-1 bottom-1 left-1/2 right-1 rounded-full border border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/15"
          />
          <span className="relative px-4 py-1.5 font-[family-name:var(--font-mono)] text-[12px] text-[color:var(--color-muted)]">
            Slides
          </span>
          <span className="relative px-4 py-1.5 font-[family-name:var(--font-mono)] text-[12px] text-[color:var(--color-accent-soft)]">
            Assets
          </span>
        </div>
        <span className="inline-flex items-center gap-2 rounded-[6px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel-hi)] px-3.5 py-1.5 font-[family-name:var(--font-sans)] text-[13px] text-[color:var(--color-text)]">
          <span className="text-[color:var(--color-accent-soft)]">↑</span>
          Upload
        </span>
      </div>

      {/* grid */}
      <div className="relative">
        <div className="grid grid-cols-3 gap-4 p-5">
          {assets.map((a) => (
            <AssetCard key={a.name} asset={a} />
          ))}
        </div>

        {/* svgl Logo Search dialog */}
        <div className="absolute right-5 bottom-5 w-[64%] max-w-[420px] rounded-[6px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel-hi)] shadow-[0_10px_28px_-14px_rgba(0,0,0,0.35)] p-4">
          <div className="flex items-center justify-between mb-3 font-[family-name:var(--font-mono)] text-[11px] text-[color:var(--color-muted)]">
            <span>Search svgl</span>
            <span className="text-[color:var(--color-dim)]">✕</span>
          </div>
          <div className="flex items-center gap-2 rounded-[6px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] px-3 py-2 mb-3 font-[family-name:var(--font-mono)] text-[13px] text-[color:var(--color-text)]">
            <span className="text-[color:var(--color-muted)]">⌕</span>
            <span>vercel</span>
            <span className="caret" aria-hidden />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {svglResults.map((r, i) => (
              <div
                key={r.name}
                className={`rounded-[6px] border ${
                  i === 0
                    ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/[0.06]"
                    : "border-[color:var(--color-rule)] bg-[color:var(--color-panel)]"
                } p-2 flex flex-col items-center gap-1.5`}
              >
                <div className="h-8 flex items-center justify-center">
                  {/* biome-ignore lint/performance/noImgElement: small inline logo */}
                  <img
                    src={`/assets/${r.logo}.svg`}
                    alt={r.name}
                    className="h-7 w-auto object-contain"
                  />
                </div>
                <span className="font-[family-name:var(--font-mono)] text-[10px] text-[color:var(--color-text-soft)]">
                  {r.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AssetCard({ asset }: { asset: AssetMock }) {
  return (
    <div className="rounded-[6px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel-hi)] overflow-hidden flex flex-col">
      <div
        className="h-[120px] flex items-center justify-center"
        style={{
          background:
            "repeating-conic-gradient(color-mix(in srgb, var(--color-rule) 70%, transparent) 0 25%, transparent 0 50%) 0 0 / 16px 16px",
        }}
      >
        {/* biome-ignore lint/performance/noImgElement: small inline asset logo */}
        <img
          src={`/assets/${asset.logo}.svg`}
          alt=""
          className="h-12 w-auto object-contain agent-mono"
        />
      </div>
      <div className="border-t border-[color:var(--color-rule)] px-3 py-2">
        <div
          className="font-[family-name:var(--font-sans)] text-[13px] text-[color:var(--color-text)] truncate"
          title={asset.name}
        >
          {asset.name}
        </div>
        <div className="font-[family-name:var(--font-mono)] text-[10px] text-[color:var(--color-muted)] mt-0.5">
          {asset.size}
        </div>
      </div>
    </div>
  );
}
