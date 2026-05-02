"use client";

import { useEffect, useState } from "react";

type Variant = {
  word: string;
  accent: string;
  label: string;
  subtitle: string;
};

const variants: Variant[] = [
  {
    word: "deck",
    accent: "#7170ff",
    label: "01",
    subtitle: "A React slide, rendered live.",
  },
  {
    word: "pitch",
    accent: "#ffb547",
    label: "02",
    subtitle: "No DSL. No templates. Just code.",
  },
  {
    word: "story",
    accent: "#68cc9a",
    label: "03",
    subtitle: "Versioned, reviewable, yours.",
  },
];

const CYCLE_MS = 3200;

function buildCode({ accent, word, subtitle }: Variant): string[] {
  return [
    "import type { Page } from '@open-slide/core';",
    "",
    `const ACCENT = '${accent}';`,
    `const WORD = '${word}';`,
    `const SUBTITLE = '${subtitle}';`,
    "",
    "const Cover: Page = () => (",
    "  <div style={{ background: '#08090a', color: '#f7f8f8' }}>",
    "    <h1 style={{ fontSize: 188, letterSpacing: '-0.04em' }}>",
    "      Hello, <em style={{ color: ACCENT }}>{WORD}</em>.",
    "    </h1>",
    "    <p>{SUBTITLE}</p>",
    "  </div>",
    ");",
    "",
    "export default [Cover] satisfies Page[];",
  ];
}

const CHANGING_LINES = new Set([2, 3, 4]);

export function Anatomy() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setI((v) => (v + 1) % variants.length),
      CYCLE_MS,
    );
    return () => clearInterval(id);
  }, []);

  const v = variants[i];
  const lines = buildCode(v);

  return (
    <section id="anatomy" className="relative">
      <div className="mx-auto max-w-[1360px] px-8 lg:px-12 py-24 lg:py-32">
        <h2 className="text-[40px] sm:text-[52px] lg:text-[72px] leading-[1.02] tracking-[-0.03em] max-w-[960px] mb-12">
          <span className="font-[family-name:var(--font-sans)] font-medium">
            A slide is a file.
          </span>
          <br />
          <span className="font-[family-name:var(--font-display)] italic text-[color:var(--color-muted)]">
            Just React, nothing else.
          </span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* code pane */}
          <div className="lg:col-span-7">
            <div className="relative rounded-[18px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] overflow-hidden">
              <div className="flex items-center justify-between px-5 h-11 border-b border-[color:var(--color-rule)] font-[family-name:var(--font-mono)] text-[12px] text-[color:var(--color-muted)]">
                <div className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 rounded-full transition-colors duration-500"
                    style={{ background: v.accent }}
                  />
                  <span>slides/hello/index.tsx</span>
                </div>
                <span className="tracking-[0.14em] uppercase">
                  tsx · {lines.length} lines
                </span>
              </div>
              <pre className="p-6 text-[13.5px] leading-[1.75] overflow-x-auto font-[family-name:var(--font-mono)]">
                <code>
                  {lines.map((line, idx) => {
                    const changing = CHANGING_LINES.has(idx);
                    return (
                      <div
                        key={changing ? `${idx}-${i}` : idx}
                        className={`-mx-2 px-2 rounded-[3px] ${changing ? "code-pulse" : ""}`}
                        // highlight output is escaped + whitelisted spans — safe markup
                        dangerouslySetInnerHTML={{
                          __html: highlight(line) || "&nbsp;",
                        }}
                      />
                    );
                  })}
                </code>
              </pre>
            </div>
          </div>

          {/* preview pane */}
          <div className="lg:col-span-5">
            <div className="relative rounded-[18px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] p-5">
              <div className="flex items-center justify-between font-[family-name:var(--font-mono)] text-[11px] tracking-[0.14em] uppercase text-[color:var(--color-muted)] mb-4">
                <span>rendered output</span>
                <span className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full transition-colors duration-500"
                    style={{ background: v.accent }}
                  />
                  live
                </span>
              </div>

              <div
                className="relative rounded-[10px] overflow-hidden border border-[color:var(--color-rule)]"
                style={{ aspectRatio: "16 / 9", containerType: "inline-size" }}
              >
                <SlidePreview variant={v} index={i} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SlidePreview({ variant, index }: { variant: Variant; index: number }) {
  const { word, accent, label, subtitle } = variant;
  return (
    <div
      className="absolute inset-0"
      style={{
        background: "#08090a",
        color: "#f7f8f8",
        fontFamily: "var(--font-sans), system-ui, sans-serif",
      }}
    >
      {/* corner glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: `radial-gradient(60cqw 42cqw at 18% 22%, ${accent}33 0%, transparent 62%)`,
        }}
      />

      {/* subtle grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
          backgroundSize: "8cqw 8cqw",
        }}
      />

      {/* top eyebrow */}
      <div
        className="absolute top-[4cqw] left-[4.5cqw] right-[4.5cqw] flex items-center justify-between"
        style={{
          fontFamily: "var(--font-mono), ui-monospace, monospace",
          fontSize: "1.6cqw",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(247,248,248,0.55)",
        }}
      >
        <span className="flex items-center gap-[0.9cqw]">
          <span
            className="inline-block rounded-full transition-colors duration-500"
            style={{ width: "0.9cqw", height: "0.9cqw", background: accent }}
          />
          <span>open-slide · {label}</span>
        </span>
        <span>2026</span>
      </div>

      {/* center headline */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[1.6cqw] px-[6cqw]">
        <h1
          className="text-center"
          style={{
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontSize: "10cqw",
            lineHeight: 0.98,
            letterSpacing: "-0.04em",
          }}
        >
          Hello,{" "}
          <span
            key={`word-${index}`}
            className="inline-block"
            style={{
              color: accent,
              transition: "color 600ms ease",
              animation: "textReveal 650ms cubic-bezier(0.2,0.7,0.2,1) both",
            }}
          >
            {word}
          </span>
          .
        </h1>
        <span
          aria-hidden
          className="transition-colors duration-500"
          style={{
            display: "block",
            height: "1px",
            width: "8cqw",
            background: accent,
          }}
        />
        <p
          key={`sub-${index}`}
          style={{
            fontFamily: "var(--font-mono), ui-monospace, monospace",
            fontSize: "1.6cqw",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(247,248,248,0.62)",
            animation:
              "textReveal 650ms 120ms cubic-bezier(0.2,0.7,0.2,1) both",
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* bottom counter */}
      <div
        className="absolute bottom-[4cqw] left-[4.5cqw] right-[4.5cqw] flex items-center justify-between"
        style={{
          fontFamily: "var(--font-mono), ui-monospace, monospace",
          fontSize: "1.4cqw",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(247,248,248,0.38)",
        }}
      >
        <span>hello</span>
        <span>001 / 001</span>
      </div>
    </div>
  );
}

// minimal syntax highlighter — tokenizes keywords, strings, comments, JSX tags.
function highlight(src: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const palette = {
    kw: "var(--color-accent-soft)",
    str: "var(--color-warm)",
    num: "var(--color-mint)",
    cmt: "var(--color-muted)",
    tag: "var(--color-accent)",
    fn: "var(--color-text)",
    punct: "var(--color-dim)",
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

  const tokens: string[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];

    if (c === "'" || c === '"' || c === "`") {
      const quote = c;
      let j = i + 1;
      while (j < src.length && src[j] !== quote) j++;
      tokens.push(wrap("str", escape(src.slice(i, j + 1))));
      i = j + 1;
      continue;
    }

    if (c === "/" && src[i + 1] === "/") {
      let j = i;
      while (j < src.length && src[j] !== "\n") j++;
      tokens.push(wrap("cmt", escape(src.slice(i, j))));
      i = j;
      continue;
    }

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

    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      tokens.push(wrap("num", escape(src.slice(i, j))));
      i = j;
      continue;
    }

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
