type Agent = {
  name: string;
  /** asset file stem; if no theme variants, `variants: false` */
  file: string;
  variants: boolean;
};

const agents: Agent[] = [
  { name: 'Claude', file: 'claude', variants: false },
  { name: 'Codex', file: 'codex', variants: true },
  { name: 'Cursor', file: 'cursor', variants: true },
  { name: 'Gemini CLI', file: 'gemini', variants: false },
  { name: 'OpenCode', file: 'opencode', variants: true },
  { name: 'Windsurf', file: 'windsurf', variants: true },
  { name: 'Zed', file: 'zed', variants: true },
];

export function Agents() {
  // double the list so the marquee loops seamlessly
  const track = [...agents, ...agents];

  return (
    <section id="agents" className="relative overflow-hidden">
      <div className="border-y border-[color:var(--color-rule)] bg-[color:var(--color-panel)]">
        <div className="mx-auto max-w-[1360px] px-8 lg:px-12 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <span className="font-[family-name:var(--font-display)] italic text-[22px] text-[color:var(--color-text)]">
            Bring your own agent.
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.22em] uppercase text-[color:var(--color-muted)]">
            any tool that edits react → authors slides
          </span>
        </div>

        <div
          className="relative"
          style={{
            WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)',
            maskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)',
          }}
        >
          <div className="marquee-track py-10 will-change-transform">
            {track.map((agent, i) => (
              <span key={`${agent.file}-${i}`} className="inline-flex items-center gap-4">
                <AgentLogo agent={agent} />
                <span className="font-[family-name:var(--font-sans)] text-[color:var(--color-text)] text-[28px] lg:text-[36px] tracking-[-0.02em]">
                  {agent.name}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AgentLogo({ agent }: { agent: Agent }) {
  const alt = agent.name;
  const cls = 'h-[28px] md:h-[34px] lg:h-[40px] w-auto object-contain shrink-0';

  if (!agent.variants) {
    return (
      // biome-ignore lint/performance/noImgElement: SVG from /public, not remote
      <img src={`/assets/${agent.file}.svg`} alt={alt} className={cls} />
    );
  }
  return (
    <>
      {/* biome-ignore lint/performance/noImgElement: SVG from /public */}
      <img src={`/assets/${agent.file}-dark.svg`} alt={alt} className={`${cls} logo-dark`} />
      {/* biome-ignore lint/performance/noImgElement: SVG from /public */}
      <img
        src={`/assets/${agent.file}-light.svg`}
        alt=""
        aria-hidden
        className={`${cls} logo-light`}
      />
    </>
  );
}
