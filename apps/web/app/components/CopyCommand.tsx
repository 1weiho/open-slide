"use client";

import { useState } from "react";

export function CopyCommand({
  command,
  size = "lg",
}: {
  command: string;
  size?: "lg" | "md";
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const height = size === "lg" ? "h-[52px]" : "h-10";
  const pad = size === "lg" ? "px-5" : "px-4";
  const text = size === "lg" ? "text-[15px]" : "text-[13px]";

  return (
    <button
      type="button"
      onClick={onCopy}
      className={`group relative inline-flex items-center gap-3 ${height} ${pad} rounded-[10px] border border-[color:var(--color-accent)]/40 bg-[color:var(--color-panel)] text-[color:var(--color-text)] font-[family-name:var(--font-mono)] ${text} hover:border-[color:var(--color-accent)] transition shadow-[0_0_0_1px_rgba(113,112,255,0.15),0_20px_80px_-20px_rgba(113,112,255,0.35)]`}
    >
      <span aria-hidden className="text-[color:var(--color-accent)]">
        $
      </span>
      <span className="tracking-[-0.01em]">{command}</span>
      <span
        aria-hidden
        className="ml-1 inline-flex items-center gap-1.5 text-[color:var(--color-muted)] group-hover:text-[color:var(--color-accent)] transition-colors"
      >
        <span className="h-4 w-px bg-[color:var(--color-rule)]" />
        {copied ? (
          <span className="text-[color:var(--color-mint)] text-[12px] tracking-[0.12em] uppercase">
            copied
          </span>
        ) : (
          <CopyGlyph />
        )}
      </span>
    </button>
  );
}

function CopyGlyph() {
  return (
    <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect
        x="7"
        y="7"
        width="12"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
