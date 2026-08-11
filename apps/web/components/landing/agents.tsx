type Agent = {
  name: string;
  /** asset file stem; if no theme variants, `variants: false` */
  file: string;
  variants: boolean;
  url: string;
};

const agents: Agent[] = [
  { name: 'Claude', file: 'claude', variants: false, url: 'https://claude.com/claude-code' },
  { name: 'Codex', file: 'codex', variants: true, url: 'https://openai.com/codex' },
  { name: 'Cursor', file: 'cursor', variants: true, url: 'https://cursor.com' },
  {
    name: 'Gemini CLI',
    file: 'gemini',
    variants: false,
    url: 'https://github.com/google-gemini/gemini-cli',
  },
  { name: 'OpenCode', file: 'opencode', variants: true, url: 'https://opencode.ai' },
  { name: 'Windsurf', file: 'windsurf', variants: true, url: 'https://windsurf.com' },
  { name: 'Zed', file: 'zed', variants: true, url: 'https://zed.dev' },
];

export function Agents() {
  // double the list so the marquee loops seamlessly
  const track = [...agents, ...agents];

  return (
    <section id="agents" className="relative overflow-hidden">
      <div className="border-t border-[color:var(--color-rule)] bg-[color:var(--color-panel)]">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12 py-10 sm:py-12">
          <h2
            data-reveal
            className="font-[family-name:var(--font-sans)] text-[18px] sm:text-[20px] text-[color:var(--color-text-soft)] font-normal"
          >
            Bring your own agent. Anything that edits React works.
          </h2>
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
              <a
                key={`${agent.file}-${i}`}
                href={agent.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={agent.name}
                className="inline-flex items-center gap-4 transition-opacity hover:opacity-70"
              >
                <AgentLogo agent={agent} />
                <span className="font-[family-name:var(--font-sans)] text-[color:var(--color-text)] text-[22px] sm:text-[28px] lg:text-[36px] tracking-[-0.02em]">
                  {agent.name}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AgentLogo({ agent }: { agent: Agent }) {
  const alt = agent.name;
  const cls = 'h-[18px] sm:h-[22px] lg:h-[28px] w-auto object-contain shrink-0';

  if (!agent.variants) {
    return <img src={`/assets/${agent.file}.svg`} alt={alt} className={cls} />;
  }
  return (
    <>
      <img src={`/assets/${agent.file}-dark.svg`} alt={alt} className={`${cls} logo-dark`} />
      <img
        src={`/assets/${agent.file}-light.svg`}
        alt=""
        aria-hidden
        className={`${cls} logo-light`}
      />
    </>
  );
}
