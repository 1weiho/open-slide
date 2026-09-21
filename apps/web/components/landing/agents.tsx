import { Container } from './frame';

type Agent = {
  name: string;
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
  return (
    <section id="agents" className="border-t border-[color:var(--color-rule-soft)]">
      <Container className="flex flex-col gap-8 py-16 sm:py-20">
        <h2
          data-reveal
          className="max-w-[40ch] text-[17px] leading-[1.5] text-[color:var(--color-text-soft)] sm:text-[18px]"
        >
          Bring your own agent. Anything that edits React works.
        </h2>

        <ul data-reveal className="flex flex-wrap items-center gap-x-8 gap-y-4 sm:gap-x-10">
          {agents.map((agent) => (
            <li key={agent.file}>
              <a
                href={agent.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 text-[15px] font-medium text-[color:var(--color-text-soft)] transition-colors hover:text-[color:var(--color-text)]"
              >
                <img
                  src={`/assets/${agent.file}${agent.variants ? '-light' : ''}.svg`}
                  alt=""
                  aria-hidden
                  className="agent-mono h-[18px] w-auto shrink-0 object-contain"
                />
                {agent.name}
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
