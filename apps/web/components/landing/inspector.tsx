import type { ReactNode } from "react";

export function Inspector() {
  return (
    <section id="inspector" className="relative">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-[color:var(--color-rule)]"
      />
      <div className="mx-auto max-w-[1360px] px-8 lg:px-12 py-24 lg:py-32">
        <div className="flex items-end justify-between flex-wrap gap-y-6 mb-16">
          <h2 className="text-[40px] sm:text-[52px] lg:text-[72px] leading-[1.02] tracking-[-0.03em] max-w-[920px]">
            <span className="font-[family-name:var(--font-sans)] font-medium">
              Talk to the agent.
            </span>
            <br />
            <span className="font-[family-name:var(--font-display)] italic text-[color:var(--color-accent)]">
              Or just tap the canvas.
            </span>
          </h2>
          <div className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.22em] uppercase text-[color:var(--color-muted)]">
            inspector · two surfaces
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-[color:var(--color-rule)] border border-[color:var(--color-rule)] rounded-[22px] overflow-hidden">
          <FeatureCell
            num="01"
            kicker="agent applies"
            title="Drop a comment. The agent rewrites the file."
            body={
              <>
                Click any block, leave a note. The inspector pins it as a{" "}
                <span className="font-[family-name:var(--font-mono)] text-[color:var(--color-accent-soft)]">
                  @slide-comment
                </span>{" "}
                marker in your source. Run{" "}
                <span className="font-[family-name:var(--font-mono)] text-[color:var(--color-accent-soft)]">
                  /apply-comments
                </span>{" "}
                — the agent edits exactly what you flagged and clears the
                marker.
              </>
            }
            visual={<AgentApplyVisual />}
          />
          <FeatureCell
            num="02"
            kicker="visual editor"
            title="Click. Tweak. Save."
            body="Toggle inspect, click any element. Change text, font, weight, color, or swap an image — right on the canvas. Edits buffer in memory until you hit Save, so one batch lands as a single HMR write."
            visual={<VisualEditorVisual />}
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCell({
  num,
  kicker,
  title,
  body,
  visual,
}: {
  num: string;
  kicker: string;
  title: string;
  body: ReactNode;
  visual: ReactNode;
}) {
  return (
    <div className="group relative bg-[color:var(--color-ink)] flex flex-col gap-7 p-8 lg:p-10 transition-colors hover:bg-[color:var(--color-panel)]">
      <div className="flex items-baseline justify-between">
        <span className="font-[family-name:var(--font-display)] italic text-[88px] leading-none text-[color:var(--color-accent)]/80">
          {num}
        </span>
        <span className="caption">{kicker}</span>
      </div>

      <div>
        <h3 className="text-[26px] lg:text-[30px] font-medium tracking-[-0.025em] leading-[1.15] max-w-[28ch]">
          {title}
        </h3>
        <p className="mt-3 text-[15px] leading-[1.6] text-[color:var(--color-text-soft)] max-w-[44ch]">
          {body}
        </p>
      </div>

      <div className="mt-auto">{visual}</div>
    </div>
  );
}

// ─── Visual: agent applies a @slide-comment ─────────────────────────────────
function AgentApplyVisual() {
  return (
    <div className="relative rounded-[14px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] overflow-hidden">
      {/* canvas */}
      <div
        className="relative aspect-[16/9] overflow-hidden"
        style={{ containerType: "inline-size" }}
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 28% 30%, color-mix(in srgb, var(--color-accent) 22%, transparent) 0%, transparent 60%)",
          }}
        />
        <div className="absolute inset-0 px-[7cqw] py-[5cqw] flex flex-col justify-center gap-[1.4cqw]">
          <span className="font-[family-name:var(--font-mono)] text-[1.5cqw] tracking-[0.18em] uppercase text-[color:var(--color-muted)]">
            cover
          </span>
          <div className="relative inline-flex w-fit">
            <span
              aria-hidden
              className="absolute -inset-[0.6cqw] rounded-[6px] border-2 border-[#3b82f6] bg-[#3b82f6]/10 pointer-events-none"
            />
            <span
              className="relative font-[family-name:var(--font-sans)] font-semibold tracking-[-0.035em] leading-[1.0]"
              style={{ fontSize: "7.6cqw" }}
            >
              Q2 Launch
            </span>
          </div>
          <span
            className="font-[family-name:var(--font-sans)] text-[color:var(--color-text-soft)] max-w-[55%]"
            style={{ fontSize: "1.7cqw", lineHeight: 1.4 }}
          >
            What we're shipping, why it matters, and how we'll measure success.
          </span>
        </div>

        {/* comment widget */}
        <div
          className="absolute font-[family-name:var(--font-sans)] rounded-[10px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel-hi)] shadow-[0_18px_36px_-14px_rgba(0,0,0,0.55)]"
          style={{
            left: "46%",
            top: "34%",
            width: "40%",
            padding: "1.4cqw 1.6cqw",
          }}
        >
          <div
            className="flex items-center justify-between font-[family-name:var(--font-mono)] text-[color:var(--color-muted)]"
            style={{ fontSize: "1.1cqw", marginBottom: "0.8cqw" }}
          >
            <span>line 58 · comment</span>
            <span className="text-[color:var(--color-dim)]">✕</span>
          </div>
          <div
            className="rounded-[6px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] text-[color:var(--color-text)]"
            style={{
              fontSize: "1.5cqw",
              padding: "1cqw 1.1cqw",
              lineHeight: 1.4,
            }}
          >
            use the accent color on this title
          </div>
        </div>
      </div>

      {/* CLI strip */}
      <div className="border-t border-[color:var(--color-rule)] bg-[color:var(--color-panel-hi)] px-5 py-3 font-[family-name:var(--font-mono)] text-[12px] flex items-center gap-3">
        <span className="text-[color:var(--color-mint)]">›</span>
        <span className="text-[color:var(--color-text)]">
          <span className="text-[color:var(--color-accent)]">/</span>
          <span className="text-[color:var(--color-accent-soft)]">
            apply-comments
          </span>
        </span>
        <span className="text-[color:var(--color-muted)] truncate">
          1 marker · slides/q2-launch/index.tsx
        </span>
        <span className="ml-auto text-[color:var(--color-mint)]">
          ✓ applied
        </span>
      </div>
    </div>
  );
}

// ─── Visual: visual editor with property panel + SaveBar ────────────────────
function VisualEditorVisual() {
  return (
    <div className="relative rounded-[14px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] overflow-hidden">
      <div
        className="relative aspect-[16/9] grid grid-cols-[1fr_38%]"
        style={{ containerType: "inline-size" }}
      >
        {/* canvas */}
        <div className="relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 28% 30%, color-mix(in srgb, var(--color-accent) 22%, transparent) 0%, transparent 60%)",
            }}
          />
          <div className="absolute inset-0 px-[6cqw] py-[5cqw] flex flex-col justify-center gap-[1.4cqw]">
            <span className="font-[family-name:var(--font-mono)] text-[1.4cqw] tracking-[0.18em] uppercase text-[color:var(--color-muted)]">
              cover
            </span>
            <div className="relative inline-flex w-fit">
              <span
                aria-hidden
                className="absolute -inset-[0.6cqw] rounded-[6px] border-2 border-[#3b82f6] bg-[#3b82f6]/10 pointer-events-none"
              />
              <span
                className="relative font-[family-name:var(--font-sans)] font-semibold tracking-[-0.035em] leading-[1.0] text-[color:var(--color-accent)]"
                style={{ fontSize: "7cqw" }}
              >
                Q2 Launch
              </span>
            </div>
            <span
              className="font-[family-name:var(--font-sans)] text-[color:var(--color-text-soft)] max-w-[80%]"
              style={{ fontSize: "1.6cqw", lineHeight: 1.4 }}
            >
              What we're shipping, why it matters.
            </span>
          </div>

          {/* SaveBar pill */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ bottom: "4cqw" }}
          >
            <div
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-rule)] bg-[color:var(--color-panel-hi)]/95 backdrop-blur-md shadow-[0_14px_32px_-12px_rgba(0,0,0,0.55)]"
              style={{ padding: "0.5cqw 0.5cqw 0.5cqw 1.2cqw" }}
            >
              <span
                className="font-[family-name:var(--font-sans)] font-medium text-[color:var(--color-text)]"
                style={{ fontSize: "1.4cqw" }}
              >
                1 unsaved change
              </span>
              <span
                className="font-[family-name:var(--font-mono)] text-[color:var(--color-muted)]"
                style={{ fontSize: "1.2cqw", padding: "0.4cqw 0.8cqw" }}
              >
                ↺ Discard
              </span>
              <span
                className="font-[family-name:var(--font-sans)] font-medium text-white rounded-full bg-[color:var(--color-accent)]"
                style={{ fontSize: "1.2cqw", padding: "0.4cqw 1cqw" }}
              >
                ⤓ Save
              </span>
            </div>
          </div>
        </div>

        {/* property panel */}
        <div className="border-l border-[color:var(--color-rule)] bg-[color:var(--color-panel-hi)] flex flex-col">
          <div
            className="border-b border-[color:var(--color-rule)] flex items-center justify-between font-[family-name:var(--font-mono)] text-[color:var(--color-muted)]"
            style={{ padding: "1.6cqw 1.6cqw 1.2cqw", fontSize: "1.1cqw" }}
          >
            <span className="text-[color:var(--color-text-soft)]">
              &lt;h1&gt; · line 58
            </span>
            <span className="text-[color:var(--color-dim)]">✕</span>
          </div>
          <PanelSection label="typography">
            <PanelRow label="Size">
              <div className="flex-1 h-[6px] rounded-[3px] bg-[color:var(--color-panel)] relative">
                <div
                  className="absolute left-0 top-0 bottom-0 rounded-[3px] bg-[color:var(--color-accent)]"
                  style={{ width: "38%" }}
                />
                <div
                  className="absolute top-1/2 size-[12px] -translate-y-1/2 rounded-full bg-[color:var(--color-text)] border-2 border-[color:var(--color-accent)]"
                  style={{ left: "calc(38% - 6px)" }}
                />
              </div>
              <PanelInput value="88px" />
            </PanelRow>
          </PanelSection>
          <PanelDivider />
          <PanelSection label="color">
            <PanelRow label="Color">
              <span className="size-[18px] rounded-[4px] border border-[color:var(--color-rule)] bg-[color:var(--color-accent)]" />
              <PanelInput value="#7170ff" />
            </PanelRow>
          </PanelSection>
        </div>
      </div>
    </div>
  );
}

function PanelSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="px-[1.6cqw] py-[1.2cqw] flex flex-col gap-[0.9cqw]">
      <span
        className="font-[family-name:var(--font-mono)] uppercase tracking-[0.08em] text-[color:var(--color-muted)]"
        style={{ fontSize: "0.95cqw" }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function PanelDivider() {
  return <div className="h-px bg-[color:var(--color-rule)]" />;
}

function PanelRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[40%_1fr] items-center gap-[0.8cqw]">
      <span
        className="font-[family-name:var(--font-sans)] text-[color:var(--color-muted)]"
        style={{ fontSize: "1.15cqw" }}
      >
        {label}
      </span>
      <div className="flex items-center gap-[0.6cqw]">{children}</div>
    </div>
  );
}

function PanelInput({ value }: { value: string }) {
  return (
    <span
      className="flex-1 rounded-[4px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] font-[family-name:var(--font-mono)] text-[color:var(--color-text)]"
      style={{ fontSize: "1.05cqw", padding: "0.4cqw 0.7cqw" }}
    >
      {value}
    </span>
  );
}
