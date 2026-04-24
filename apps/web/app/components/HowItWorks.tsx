import type { ReactNode } from "react";

type Step = {
  num: string;
  kicker: string;
  title: string;
  body: string;
  code: {
    prompt: string;
    line: string;
    tail: ReactNode;
  };
};

const steps: Step[] = [
  {
    num: "01",
    kicker: "scaffold",
    title: "Init a deck",
    body: "One command spins up slides/, open-slide.json, and a hot-reloading dev server. No templates, no themes, no assumptions.",
    code: {
      prompt: "$",
      line: "npx @open-slide/cli init my-deck",
      tail: "✓ ready in 3s",
    },
  },
  {
    num: "02",
    kicker: "author",
    title: "Ask your agent",
    body: "Your agent drafts pages as arbitrary React components. You guide with prompts; it writes files on disk.",
    code: {
      prompt: "›",
      line: "/create-slide for Q2 roadmap",
      tail: <AgentRow />,
    },
  },
  {
    num: "03",
    kicker: "iterate",
    title: "Inspect and comment",
    body: "Open the inspector, click any block, leave a note. Then run /apply-comments — the agent reads every marker, rewrites the page, clears them.",
    code: {
      prompt: "›",
      line: "/apply-comment",
      tail: "✓ applied change",
    },
  },
];

const SLASH_COMMAND = /\/[a-z][a-z-]*/g;

function renderLine(line: string) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of line.matchAll(SLASH_COMMAND)) {
    const start = match.index ?? 0;
    if (start > last) parts.push(line.slice(last, start));
    const cmd = match[0];
    parts.push(
      <span key={`cmd-${start}`}>
        <span className="text-[color:var(--color-accent)]">/</span>
        <span className="text-[color:var(--color-accent-soft)]">{cmd.slice(1)}</span>
      </span>,
    );
    last = start + cmd.length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return <>{parts}</>;
}

function AgentRow() {
  const agents: [string, string][] = [
    ["claude.svg", "Claude"],
    ["codex-dark.svg", "Codex"],
    ["cursor-dark.svg", "Cursor"],
    ["gemini.svg", "Gemini CLI"],
  ];
  const cls = "agent-mono h-[14px] w-auto object-contain shrink-0";
  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-2 normal-case tracking-normal">
      {agents.map(([file, name]) => (
        // biome-ignore lint/performance/noImgElement: SVG from /public
        <img key={file} src={`/assets/${file}`} alt={name} className={cls} />
      ))}
      <span className="text-[10px] tracking-[0.1em] uppercase text-[color:var(--color-muted)]">
        ...
      </span>
    </span>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-[color:var(--color-rule)]"
      />
      <div className="mx-auto max-w-[1360px] px-8 lg:px-12 py-24 lg:py-32">
        <div className="flex items-end justify-between flex-wrap gap-y-6 mb-16">
          <h2 className="text-[40px] sm:text-[52px] lg:text-[72px] leading-[1.02] tracking-[-0.03em] max-w-[860px]">
            <span className="font-[family-name:var(--font-sans)] font-medium">
              Slides as code.
            </span>
            <br />
            <span className="font-[family-name:var(--font-display)] italic text-[color:var(--color-accent)]">
              Crafted by agents.
            </span>
          </h2>
          <div className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.22em] uppercase text-[color:var(--color-muted)]">
            init → author → iterate ↻
          </div>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[color:var(--color-rule)] border border-[color:var(--color-rule)] rounded-[22px] overflow-hidden">
          {steps.map((s) => (
            <li
              key={s.num}
              className="group relative p-8 lg:p-10 bg-[color:var(--color-ink)] flex flex-col gap-7 min-h-[420px] transition-colors hover:bg-[color:var(--color-panel)]"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-[family-name:var(--font-display)] italic text-[88px] leading-none text-[color:var(--color-accent)]/80">
                  {s.num}
                </span>
                <span className="caption">{s.kicker}</span>
              </div>

              <div>
                <h3 className="text-[30px] lg:text-[34px] font-medium tracking-[-0.03em] leading-[1.1]">
                  {s.title}
                </h3>
                <p className="mt-3 text-[15px] leading-[1.55] text-[color:var(--color-text-soft)] max-w-[36ch]">
                  {s.body}
                </p>
              </div>

              <div className="mt-auto rounded-[10px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel-hi)] p-4 font-[family-name:var(--font-mono)] text-[13px]">
                <div className="flex items-center gap-2">
                  <span className="text-[color:var(--color-accent)]">
                    {s.code.prompt}
                  </span>
                  <span className="text-[color:var(--color-text)] truncate">
                    {renderLine(s.code.line)}
                  </span>
                </div>
                <div className="mt-3 text-[11px] tracking-[0.1em] uppercase text-[color:var(--color-muted)]">
                  {s.code.tail}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
