const code = `import type { Page, SlideMeta } from '@open-slide/core';

const Cover: Page = () => (
  <div style={{
    width: '100%',
    height: '100%',
    display: 'grid',
    placeItems: 'center',
    background: '#08090a',
    color: '#f7f8f8',
    fontFamily: 'Inter, system-ui, sans-serif',
  }}>
    <h1 style={{ fontSize: 188, letterSpacing: '-0.04em' }}>
      Hello, <em style={{ color: '#7170ff' }}>deck</em>.
    </h1>
  </div>
);

export const meta: SlideMeta = { title: 'Hello' };
export default [Cover] satisfies Page[];`;

const tokens = highlight(code);

export function Anatomy() {
  return (
    <section id="anatomy" className="relative">
      <div className="mx-auto max-w-[1360px] px-8 lg:px-12 py-24 lg:py-32">
        <h2 className="text-[40px] sm:text-[52px] lg:text-[72px] leading-[1.02] tracking-[-0.03em] max-w-[960px] mb-12">
          <span className="font-[family-name:var(--font-sans)] font-medium">
            A slide is a file.
          </span>{" "}
          <span className="font-[family-name:var(--font-display)] italic text-[color:var(--color-muted)]">
            Just React, nothing else.
          </span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* code pane */}
          <div className="lg:col-span-7">
            <div className="relative rounded-[18px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] overflow-hidden">
              <div className="flex items-center justify-between px-5 h-11 border-b border-[color:var(--color-rule)] font-[family-name:var(--font-mono)] text-[12px] text-[color:var(--color-muted)]">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--color-dim)]" />
                  <span>slides/hello/index.tsx</span>
                </div>
                <span className="tracking-[0.14em] uppercase">tsx · 16 lines</span>
              </div>
              <pre className="p-6 text-[13.5px] leading-[1.75] overflow-x-auto font-[family-name:var(--font-mono)]">
                <code
                  // highlight is plain whitelisted tokens — safe markup
                  dangerouslySetInnerHTML={{ __html: tokens }}
                />
              </pre>
            </div>
          </div>

          {/* preview pane */}
          <div className="lg:col-span-5 flex">
            <div className="relative flex-1 rounded-[18px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] p-5 flex flex-col">
              <div className="flex items-center justify-between font-[family-name:var(--font-mono)] text-[11px] tracking-[0.14em] uppercase text-[color:var(--color-muted)] mb-4">
                <span>rendered output</span>
                <span>1 / 1</span>
              </div>

              <div className="relative flex-1 min-h-[280px] rounded-[10px] overflow-hidden border border-[color:var(--color-rule)]">
                <div
                  className="absolute inset-0 grid place-items-center"
                  style={{ background: "#08090a" }}
                >
                  <span
                    className="text-[12vw] sm:text-[9vw] lg:text-[4.4vw] text-center tracking-[-0.04em]"
                    style={{ color: "#f7f8f8", fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    Hello,{" "}
                    <em style={{ color: "#7170ff", fontStyle: "italic" }}>deck</em>.
                  </span>
                </div>
                <div
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-10"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent, rgba(0,0,0,0.5))",
                  }}
                />
                <div className="absolute left-4 bottom-3 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] uppercase text-white/40">
                  hello
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-[11px] tracking-[0.14em] uppercase font-[family-name:var(--font-mono)] text-[color:var(--color-muted)]">
                <Stat label="entry" value="index.tsx" />
                <Stat label="assets" value="./assets/*" />
                <Stat label="export" value="Page[]" />
                <Stat label="canvas" value="1920×1080" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-t border-[color:var(--color-rule)] pt-2">
      <span>{label}</span>
      <span className="text-[color:var(--color-text)] normal-case tracking-[-0.01em]">
        {value}
      </span>
    </div>
  );
}

// minimal syntax highlighter — tokenizes keywords, strings, comments, JSX tags.
function highlight(src: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const palette = {
    kw: "#a3a0ff",
    str: "#ffb547",
    num: "#68cc9a",
    cmt: "#6f727c",
    tag: "#7170ff",
    fn: "#f6f5f0",
    punct: "#44443f",
  };
  const wrap = (cls: keyof typeof palette, t: string) =>
    `<span style="color:${palette[cls]}">${t}</span>`;

  const keywords = new Set([
    "import",
    "from",
    "type",
    "const",
    "return",
    "export",
    "default",
    "satisfies",
  ]);

  // tokenize naively
  const tokens: string[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];

    // string literal
    if (c === "'" || c === '"' || c === "`") {
      const quote = c;
      let j = i + 1;
      while (j < src.length && src[j] !== quote) j++;
      tokens.push(wrap("str", escape(src.slice(i, j + 1))));
      i = j + 1;
      continue;
    }

    // single-line comment
    if (c === "/" && src[i + 1] === "/") {
      let j = i;
      while (j < src.length && src[j] !== "\n") j++;
      tokens.push(wrap("cmt", escape(src.slice(i, j))));
      i = j;
      continue;
    }

    // identifier / keyword
    if (/[A-Za-z_$]/.test(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_$]/.test(src[j])) j++;
      const word = src.slice(i, j);
      if (keywords.has(word)) tokens.push(wrap("kw", escape(word)));
      else if (/^[A-Z]/.test(word)) tokens.push(wrap("tag", escape(word)));
      else tokens.push(wrap("fn", escape(word)));
      i = j;
      continue;
    }

    // number
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      tokens.push(wrap("num", escape(src.slice(i, j))));
      i = j;
      continue;
    }

    // punctuation group
    if (/[{}()[\];:,.<>=+\-*/!?|&]/.test(c)) {
      tokens.push(wrap("punct", escape(c)));
      i++;
      continue;
    }

    tokens.push(escape(c));
    i++;
  }

  return tokens.join("");
}
