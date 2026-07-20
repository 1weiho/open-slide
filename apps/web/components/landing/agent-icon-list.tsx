const agents = [
  ['claude.svg', 'Claude'],
  ['codex-dark.svg', 'Codex'],
  ['cursor-dark.svg', 'Cursor'],
  ['gemini.svg', 'Gemini CLI'],
] as const;

export function AgentIconList() {
  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-x-3 gap-y-2 normal-case tracking-normal">
      {agents.map(([file, name]) => (
        <img
          key={file}
          src={`/assets/${file}`}
          alt={name}
          className="agent-mono h-[14px] w-auto shrink-0 object-contain"
        />
      ))}
      <span className="text-[10px] tracking-[0.08em] uppercase text-[color:var(--color-muted)]">
        ...
      </span>
    </span>
  );
}
