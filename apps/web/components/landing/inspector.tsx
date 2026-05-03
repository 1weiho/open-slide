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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-[color:var(--color-rule)] border border-[color:var(--color-rule)] rounded-[6px] overflow-hidden">
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

// ─── Visual: comment widget — matches packages/core CommentWidget ──────────
function AgentApplyVisual() {
  return (
    <div className="relative rounded-[6px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] overflow-hidden">
      <div
        className="relative aspect-[16/9] overflow-hidden"
        style={{ containerType: "inline-size" }}
      >
        {/* canvas */}
        <div className="absolute inset-0 px-[7cqw] py-[5cqw] flex flex-col justify-center gap-[1.4cqw]">
          <span className="font-[family-name:var(--font-mono)] text-[1.5cqw] tracking-[0.18em] uppercase text-[color:var(--color-muted)]">
            cover
          </span>
          <div className="relative inline-flex w-fit">
            <span
              aria-hidden
              className="absolute -inset-[0.6cqw] border-2 border-[#3b82f6] bg-[#3b82f6]/10 pointer-events-none"
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

        {/* CommentWidget — bottom-right popup + bubble button */}
        <div
          className="absolute right-[2cqw] bottom-[2cqw] flex flex-col items-end gap-[1cqw]"
          style={{ width: "38%" }}
        >
          {/* popup */}
          <div
            className="w-full rounded-[6px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel-hi)] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)] overflow-hidden font-[family-name:var(--font-sans)]"
            style={{ fontSize: "1.2cqw" }}
          >
            <div
              className="flex items-center justify-between border-b border-[color:var(--color-rule)]"
              style={{ padding: "1cqw 1.2cqw" }}
            >
              <span
                className="font-semibold text-[color:var(--color-text)]"
                style={{ fontSize: "1.15cqw" }}
              >
                1 comment
              </span>
              <span className="text-[color:var(--color-dim)]">✕</span>
            </div>
            <div
              className="border-b border-[color:var(--color-rule)] flex items-start gap-[0.8cqw]"
              style={{ padding: "1cqw 1.2cqw" }}
            >
              <div className="min-w-0 flex-1">
                <div
                  className="font-[family-name:var(--font-mono)] text-[color:var(--color-muted)]"
                  style={{ fontSize: "0.95cqw" }}
                >
                  line 58
                </div>
                <div
                  className="text-[color:var(--color-text)]"
                  style={{ fontSize: "1.2cqw", marginTop: "0.2cqw" }}
                >
                  use the accent color on this title
                </div>
              </div>
              <span className="text-[color:var(--color-dim)]">⌫</span>
            </div>
            <div
              className="text-[color:var(--color-muted)]"
              style={{ padding: "0.9cqw 1.2cqw", fontSize: "1cqw" }}
            >
              Run{" "}
              <span
                className="rounded-[3px] bg-[color:var(--color-panel)] font-[family-name:var(--font-mono)] text-[color:var(--color-text)]"
                style={{ padding: "0.15cqw 0.4cqw" }}
              >
                /apply-comments
              </span>{" "}
              in your agent to apply these.
            </div>
          </div>

          {/* bubble button */}
          <span
            className="inline-flex items-center gap-[0.6cqw] rounded-full border border-[color:var(--color-rule)] bg-[color:var(--color-panel-hi)] font-[family-name:var(--font-sans)] font-medium text-[color:var(--color-text)]"
            style={{ padding: "0.7cqw 1.1cqw", fontSize: "1.15cqw" }}
          >
            <CommentGlyph />
            <span>1</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function CommentGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: "1.4cqw", height: "1.4cqw" }}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// ─── Visual: InspectorPanel + SaveBar — matches packages/core ──────────────
function VisualEditorVisual() {
  return (
    <div className="relative rounded-[6px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] overflow-hidden">
      <div
        className="relative aspect-[16/9] grid grid-cols-[1fr_42%]"
        style={{ containerType: "inline-size" }}
      >
        {/* canvas */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 px-[5cqw] py-[5cqw] flex flex-col justify-center gap-[1.4cqw]">
            <span className="font-[family-name:var(--font-mono)] text-[1.3cqw] tracking-[0.18em] uppercase text-[color:var(--color-muted)]">
              cover
            </span>
            <div className="relative inline-flex w-fit">
              <span
                aria-hidden
                className="absolute -inset-[0.6cqw] border-2 border-[#3b82f6] bg-[#3b82f6]/10 pointer-events-none"
              />
              <span
                className="relative font-[family-name:var(--font-sans)] font-semibold tracking-[-0.035em] leading-[1.0] text-[color:var(--color-accent)]"
                style={{ fontSize: "6.4cqw" }}
              >
                Q2 Launch
              </span>
            </div>
            <span
              className="font-[family-name:var(--font-sans)] text-[color:var(--color-text-soft)] max-w-[80%]"
              style={{ fontSize: "1.5cqw", lineHeight: 1.4 }}
            >
              What we're shipping, why it matters.
            </span>
          </div>

          {/* SaveBar — matches core/SaveCard layout */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ bottom: "3cqw" }}
          >
            <div
              className="inline-flex items-center gap-[0.4cqw] rounded-[6px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel-hi)]/95 backdrop-blur-md shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)]"
              style={{ padding: "0.35cqw 0.35cqw 0.35cqw 0.5cqw" }}
            >
              <SaveBarIconBtn glyph={<UndoGlyph />} />
              <SaveBarIconBtn glyph={<RedoGlyph />} dim />
              <span
                aria-hidden
                className="bg-[color:var(--color-rule)]"
                style={{ width: "1px", height: "1.6cqw", margin: "0 0.2cqw" }}
              />
              <span
                className="inline-flex items-center gap-[0.5cqw] font-[family-name:var(--font-sans)] font-medium text-[color:var(--color-text)]"
                style={{ padding: "0 0.7cqw", fontSize: "1.25cqw" }}
              >
                <span
                  className="rounded-full bg-[color:var(--color-accent)]"
                  style={{
                    width: "0.7cqw",
                    height: "0.7cqw",
                    boxShadow:
                      "0 0 0 0.3cqw color-mix(in oklab, var(--color-accent) 18%, transparent)",
                  }}
                />
                <span>1 unsaved change</span>
              </span>
              <span
                className="font-[family-name:var(--font-sans)] text-[color:var(--color-muted)]"
                style={{ fontSize: "1.2cqw", padding: "0.4cqw 0.8cqw" }}
              >
                Discard
              </span>
              <span
                className="inline-flex items-center gap-[0.4cqw] font-[family-name:var(--font-sans)] font-medium text-[color:var(--color-brand-foreground,white)] rounded-[4px] bg-[color:var(--color-accent)]"
                style={{ fontSize: "1.2cqw", padding: "0.45cqw 0.9cqw" }}
              >
                <SaveGlyph />
                Save
              </span>
            </div>
          </div>
        </div>

        {/* InspectorPanel */}
        <div className="border-l border-[color:var(--color-rule)] bg-[color:var(--color-panel-hi)] flex flex-col overflow-hidden">
          {/* header */}
          <div
            className="border-b border-[color:var(--color-rule)] flex items-center justify-between"
            style={{ padding: "1.4cqw 1.6cqw" }}
          >
            <div className="flex items-center gap-[0.6cqw]">
              <span
                className="font-[family-name:var(--font-sans)] font-semibold tracking-tight text-[color:var(--color-text)]"
                style={{ fontSize: "1.25cqw" }}
              >
                Inspect
              </span>
              <span
                aria-hidden
                className="bg-[color:var(--color-rule)]"
                style={{ width: "1px", height: "1.4cqw" }}
              />
              <span
                className="rounded-[3px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] font-[family-name:var(--font-mono)] text-[color:var(--color-text)]"
                style={{ padding: "0.1cqw 0.5cqw", fontSize: "1cqw" }}
              >
                &lt;h1&gt;
              </span>
            </div>
            <span className="text-[color:var(--color-dim)]">✕</span>
          </div>

          <PanelSection label="Content">
            <PanelTextarea value="Q2 Launch" />
          </PanelSection>

          <PanelDivider />

          <PanelSection label="Typography">
            <PanelRow label="Size">
              <div className="flex-1 h-[0.5cqw] rounded-full bg-[color:var(--color-panel)] relative">
                <div
                  className="absolute left-0 top-0 bottom-0 rounded-full bg-[color:var(--color-accent)]"
                  style={{ width: "38%" }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 rounded-full bg-[color:var(--color-text)] border border-[color:var(--color-accent)]"
                  style={{
                    width: "1.1cqw",
                    height: "1.1cqw",
                    left: "calc(38% - 0.55cqw)",
                  }}
                />
              </div>
              <PanelInput value="88px" />
            </PanelRow>
            <PanelRow label="Weight">
              <PanelSelect value="Semibold · 600" />
            </PanelRow>
            <PanelRow label="Style">
              <div className="flex items-center gap-[0.4cqw]">
                <PanelToggle glyph={<BoldGlyph />} pressed />
                <PanelToggle glyph={<ItalicGlyph />} />
              </div>
            </PanelRow>
          </PanelSection>

          <PanelDivider />

          <PanelSection label="Color">
            <PanelRow label="Text">
              <PanelSwatch color="var(--color-accent)" />
              <PanelInput value="#D56B48" mono uppercase />
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
    <div className="flex flex-col gap-[0.9cqw]" style={{ padding: "1.2cqw 1.6cqw" }}>
      <span
        className="font-[family-name:var(--font-sans)] font-medium text-[color:var(--color-text-soft)]"
        style={{ fontSize: "1cqw" }}
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
    <div className="grid grid-cols-[34%_1fr] items-center gap-[0.7cqw]">
      <span
        className="font-[family-name:var(--font-sans)] text-[color:var(--color-muted)]"
        style={{ fontSize: "1.1cqw" }}
      >
        {label}
      </span>
      <div className="flex items-center gap-[0.5cqw]">{children}</div>
    </div>
  );
}

function PanelInput({
  value,
  mono = true,
  uppercase = false,
}: {
  value: string;
  mono?: boolean;
  uppercase?: boolean;
}) {
  return (
    <span
      className={`flex-1 rounded-[4px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] text-[color:var(--color-text)] ${
        mono ? "font-[family-name:var(--font-mono)]" : "font-[family-name:var(--font-sans)]"
      } ${uppercase ? "uppercase" : ""}`}
      style={{ fontSize: "1.05cqw", padding: "0.4cqw 0.6cqw" }}
    >
      {value}
    </span>
  );
}

function PanelSelect({ value }: { value: string }) {
  return (
    <span
      className="flex-1 inline-flex items-center justify-between rounded-[4px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] font-[family-name:var(--font-sans)] text-[color:var(--color-text)]"
      style={{ fontSize: "1.05cqw", padding: "0.4cqw 0.6cqw" }}
    >
      <span>{value}</span>
      <span
        className="text-[color:var(--color-muted)]"
        style={{ fontSize: "1cqw" }}
      >
        ▾
      </span>
    </span>
  );
}

function PanelToggle({
  glyph,
  pressed = false,
}: {
  glyph: ReactNode;
  pressed?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[4px] border ${
        pressed
          ? "border-[color:var(--color-rule)] bg-[color:var(--color-panel)] text-[color:var(--color-text)]"
          : "border-[color:var(--color-rule)] bg-transparent text-[color:var(--color-muted)]"
      }`}
      style={{ width: "2.4cqw", height: "2.4cqw" }}
    >
      {glyph}
    </span>
  );
}

function PanelSwatch({ color }: { color: string }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-[4px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)]"
      style={{ width: "2.4cqw", height: "2.4cqw" }}
    >
      <span
        className="rounded-[2px]"
        style={{
          width: "1.5cqw",
          height: "1.5cqw",
          backgroundColor: color,
        }}
      />
    </span>
  );
}

function PanelTextarea({ value }: { value: string }) {
  return (
    <span
      className="block rounded-[4px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] font-[family-name:var(--font-sans)] text-[color:var(--color-text)]"
      style={{
        fontSize: "1.1cqw",
        padding: "0.7cqw 0.7cqw",
        minHeight: "3.6cqw",
        lineHeight: 1.4,
      }}
    >
      {value}
    </span>
  );
}

function SaveBarIconBtn({
  glyph,
  dim = false,
}: {
  glyph: ReactNode;
  dim?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[4px] ${
        dim ? "text-[color:var(--color-dim)]" : "text-[color:var(--color-muted)]"
      }`}
      style={{ width: "2cqw", height: "2cqw" }}
    >
      {glyph}
    </span>
  );
}

function UndoGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: "1.2cqw", height: "1.2cqw" }}
    >
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h11a5 5 0 0 1 0 10h-4" />
    </svg>
  );
}

function RedoGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: "1.2cqw", height: "1.2cqw" }}
    >
      <path d="m15 14 5-5-5-5" />
      <path d="M20 9H9a5 5 0 0 0 0 10h4" />
    </svg>
  );
}

function SaveGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: "1.1cqw", height: "1.1cqw" }}
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <path d="M17 21v-8H7v8M7 3v5h8" />
    </svg>
  );
}

function BoldGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: "1.2cqw", height: "1.2cqw" }}
    >
      <path d="M6 4h7a4 4 0 0 1 0 8H6z" />
      <path d="M6 12h8a4 4 0 0 1 0 8H6z" />
    </svg>
  );
}

function ItalicGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: "1.2cqw", height: "1.2cqw" }}
    >
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  );
}
