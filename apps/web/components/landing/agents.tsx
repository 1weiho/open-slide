type Agent = {
  name: string;
  file: string;
  url: string;
  colored?: boolean;
};

const agents: Agent[] = [
  { name: 'Claude Code', file: 'claude', url: 'https://claude.com/claude-code', colored: true },
  { name: 'Codex', file: 'codex-light', url: 'https://openai.com/codex' },
  { name: 'Cursor', file: 'cursor-light', url: 'https://cursor.com' },
  {
    name: 'Gemini CLI',
    file: 'gemini',
    url: 'https://github.com/google-gemini/gemini-cli',
    colored: true,
  },
  { name: 'OpenCode', file: 'opencode-mono', url: 'https://opencode.ai' },
  { name: 'Windsurf', file: 'windsurf-light', url: 'https://windsurf.com' },
  { name: 'Zed', file: 'zed-light', url: 'https://zed.dev' },
];

export function AgentLogos() {
  return (
    <ul className="grid w-full grid-cols-4 gap-y-4 sm:grid-cols-7 sm:gap-y-0">
      {agents.map((agent) => (
        <li key={agent.file} className="flex justify-center">
          <a
            href={agent.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/agent pressable flex w-[72px] flex-col items-center gap-2.5 rounded-xl py-3 text-[color:var(--color-muted)] hover:bg-[color:var(--color-panel)] hover:text-[color:var(--color-text)] hover:shadow-[var(--shadow-edge)]"
          >
            <span className="flex h-7 items-center">
              <img
                src={`/assets/${agent.file}.svg`}
                alt=""
                aria-hidden
                className={`agent-mono h-6 w-auto transition-[filter,opacity] duration-300 group-hover/agent:opacity-100 ${
                  agent.colored ? 'group-hover/agent:[filter:none]' : ''
                }`}
              />
            </span>
            <span className="whitespace-nowrap text-[11px] font-medium tracking-[-0.005em]">
              {agent.name}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
