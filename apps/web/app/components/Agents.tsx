const agents = [
  "Claude Code",
  "Codex",
  "Gemini CLI",
  "Cursor",
  "opencode",
  "Aider",
  "Continue",
  "Windsurf",
  "Zed Agent",
  "Cline",
];

export function Agents() {
  // double the list so the marquee loops seamlessly
  const track = [...agents, ...agents];

  return (
    <section id="agents" className="relative overflow-hidden">
      <div className="border-y border-[color:var(--color-rule)] bg-[color:var(--color-panel)]">
        <div className="mx-auto max-w-[1360px] px-8 lg:px-12 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <span className="font-[family-name:var(--font-display)] italic text-[22px] text-[color:var(--color-text)]">
            Bring your own coding agent.
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.22em] uppercase text-[color:var(--color-muted)]">
            any tool that edits react → authors slides
          </span>
        </div>

        <div
          className="relative"
          style={{
            WebkitMaskImage:
              "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
            maskImage:
              "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
          }}
        >
          <div className="marquee-track py-10 will-change-transform">
            {track.map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="inline-flex items-center gap-5 text-[36px] lg:text-[44px] leading-none tracking-[-0.02em]"
              >
                <span
                  className="font-[family-name:var(--font-display)] italic text-[color:var(--color-text)]"
                  style={{
                    color:
                      i % 3 === 0
                        ? "var(--color-accent)"
                        : "var(--color-text)",
                  }}
                >
                  {name}
                </span>
                <span
                  aria-hidden
                  className="font-[family-name:var(--font-sans)] text-[color:var(--color-dim)]"
                >
                  ✦
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
