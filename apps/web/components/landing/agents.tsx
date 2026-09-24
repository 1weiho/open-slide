type Agent = {
  name: string;
  file: string;
  url: string;
};

const agents: Agent[] = [
  { name: 'Claude Code', file: 'claude', url: 'https://claude.com/claude-code' },
  { name: 'Codex', file: 'codex-light', url: 'https://openai.com/codex' },
  { name: 'Cursor', file: 'cursor-light', url: 'https://cursor.com' },
  { name: 'Gemini CLI', file: 'gemini', url: 'https://github.com/google-gemini/gemini-cli' },
  { name: 'OpenCode', file: 'opencode-light', url: 'https://opencode.ai' },
  { name: 'Windsurf', file: 'windsurf-light', url: 'https://windsurf.com' },
  { name: 'Zed', file: 'zed-light', url: 'https://zed.dev' },
];

export function AgentList() {
  return (
    <ul className="flex flex-wrap gap-2">
      {agents.map((agent) => (
        <li key={agent.file}>
          <a
            href={agent.url}
            target="_blank"
            rel="noopener noreferrer"
            className="pressable inline-flex h-9 items-center gap-2.5 rounded-full border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] pl-3 pr-3.5 text-[13.5px] font-medium text-[color:var(--color-text-soft)] hover:border-[color:var(--color-dim)] hover:text-[color:var(--color-text)]"
          >
            <img
              src={`/assets/${agent.file}.svg`}
              alt=""
              aria-hidden
              className="agent-mono h-4 w-auto shrink-0 object-contain"
            />
            {agent.name}
          </a>
        </li>
      ))}
      <li className="inline-flex h-9 items-center px-2 text-[13.5px] text-[color:var(--color-muted)]">
        + anything that edits React
      </li>
    </ul>
  );
}
