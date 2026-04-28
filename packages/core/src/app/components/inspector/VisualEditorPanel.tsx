import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Italic, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { findSlideSource } from '@/lib/inspector/fiber';
import type { EditOp } from '@/lib/inspector/useEditor';
import { useInspector } from './InspectorProvider';

const PANEL_W = 340;

type ElementSnapshot = {
  fontSize: number; // px
  fontWeight: number; // 100–900
  fontStyle: 'normal' | 'italic';
  color: string; // hex
  backgroundColor: string | null; // hex or null (transparent)
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number | null; // unitless, or null when 'normal'
  letterSpacing: number; // px
  text: string | null; // null when not editable
};

export function VisualEditorPanel() {
  const { active, mode, slideId, selected, setSelected, applyEdit } = useInspector();
  const [snapshot, setSnapshot] = useState<ElementSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reloadCounter = useReloadCounter();

  // Pending ops buffered while the user is editing one element. We mutate
  // the DOM directly for visual feedback and only commit to source when
  // the user *moves on* — clicks a different element, closes the panel,
  // or exits edit mode. That way a sustained "tweak this color, no a
  // bit darker, no try 30px" session triggers zero HMR and zero
  // animation replays. Every commit point is handled by the cleanup
  // effect below, so the buffer is never silently dropped.
  const pendingRef = useRef<{ styleOps: Map<string, string | null>; textOp: string | null }>({
    styleOps: new Map(),
    textOp: null,
  });

  // Re-snapshot DOM values on selection or HMR. After we write to source
  // Vite refreshes the slide; `selected.anchor` is detached, so we walk
  // `[data-inspector-root]` for an element whose fiber maps to the same
  // line, swap it in, and read computed style off the fresh node.
  useEffect(() => {
    // `reloadCounter` is intentionally in the dep list — its only job is
    // to re-fire this effect after HMR.
    void reloadCounter;
    if (!selected) {
      setSnapshot(null);
      return;
    }
    let anchor = selected.anchor;
    if (!anchor.isConnected) {
      const next = findElementByLine(slideId, selected.line, selected.column);
      if (next) {
        anchor = next;
        setSelected({ ...selected, anchor: next });
      } else {
        // Element gone (mid-HMR, or structural change). Keep the stale
        // snapshot so the panel doesn't collapse — the next reload tick
        // will retry and either succeed or definitively give up.
        return;
      }
    }
    setSnapshot(readSnapshot(anchor));
  }, [selected, setSelected, slideId, reloadCounter]);

  // Freeze CSS animations + transitions inside the slide whenever the
  // inspector is open — including comment mode and the brief moments
  // after a flush triggers HMR. Removing the freeze re-cascades the
  // animation properties on already-mounted elements, which most
  // browsers treat as a new animation declaration and restart from
  // frame 0. That shows up as a "state revert" right after the user
  // commits an edit. By only tearing down freeze when the inspector is
  // fully toggled off, mode switches, deselects, and HMR reconciles
  // never trigger a replay.
  useEffect(() => {
    if (!active) return;
    const root = document.querySelector<HTMLElement>('[data-inspector-root]');
    if (!root) return;
    const styleEl = document.createElement('style');
    styleEl.textContent = EDITING_FREEZE_CSS;
    document.head.appendChild(styleEl);
    root.dataset.inspectorEditing = 'true';
    return () => {
      // Hold the freeze through one HMR tick after exit. The cleanup
      // effect above just fired a flush which will re-render the slide;
      // tearing down freeze CSS *before* that lands lets the browser
      // restart animations on the still-old DOM, then again on the
      // post-HMR DOM (a double replay). Waiting for `vite:afterUpdate`
      // (or a 1500ms fallback) collapses both into one quiet transition.
      let cleaned = false;
      const finish = () => {
        if (cleaned) return;
        cleaned = true;
        styleEl.remove();
        delete root.dataset.inspectorEditing;
        import.meta.hot?.off('vite:afterUpdate', finish);
        clearTimeout(timer);
      };
      const timer = setTimeout(finish, 1500);
      import.meta.hot?.on('vite:afterUpdate', finish);
    };
  }, [active]);

  const apply = useCallback(
    (ops: EditOp[]) => {
      if (!selected) return;
      const anchor = selected.anchor;
      // Optimistic DOM mutation: instant visual feedback with no file
      // write, no HMR, no animation replay.
      for (const op of ops) {
        if (op.kind === 'set-style') {
          if (anchor.isConnected) {
            const style = anchor.style as unknown as Record<string, string>;
            style[op.key] = op.value ?? '';
          }
          pendingRef.current.styleOps.set(op.key, op.value);
        } else if (op.kind === 'set-text') {
          if (anchor.isConnected) anchor.textContent = op.value;
          pendingRef.current.textOp = op.value;
        }
      }
      // Refresh snapshot from the DOM so controls track the new value
      // immediately (we just mutated `anchor.style` above, so computed
      // style now reflects the change).
      if (anchor.isConnected) setSnapshot(readSnapshot(anchor));
    },
    [selected],
  );

  // Commit any pending edits before the selection changes (clicking a
  // different element, closing the panel, exiting edit mode), so we
  // don't drop user changes on the floor.
  useEffect(() => {
    const target = selected;
    return () => {
      if (!target) return;
      flushPending(target.line, target.column, applyEdit, pendingRef, setError);
    };
  }, [selected, applyEdit]);

  if (!active || mode !== 'edit') return null;

  return (
    <aside
      data-inspector-ui
      className="flex h-full shrink-0 flex-col border-l bg-card"
      style={{ width: PANEL_W }}
    >
      <header className="flex shrink-0 items-center justify-between border-b px-3 py-2">
        <div className="text-xs font-semibold">Visual editor</div>
        {selected && (
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Deselect"
          >
            <X className="size-3.5" />
          </button>
        )}
      </header>

      {!selected || !snapshot ? (
        <div className="flex flex-1 items-center justify-center px-6 py-8 text-center text-xs text-muted-foreground">
          Click an element on the slide to edit its text and styles.
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="border-b px-3 py-2 text-[11px] text-muted-foreground">
            <span className="font-mono">&lt;{selected.anchor.tagName.toLowerCase()}&gt;</span>
            <span className="mx-1.5">·</span>
            <span>line {selected.line}</span>
          </div>

          {error && (
            <div className="mx-3 mt-2 rounded border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] text-red-700">
              {error}
            </div>
          )}

          <Section title="Content">
            <TextField snapshot={snapshot} apply={apply} />
          </Section>

          <Section title="Typography">
            <FontSizeField snapshot={snapshot} apply={apply} />
            <FontWeightField snapshot={snapshot} apply={apply} />
            <Row label="Style">
              <ToggleButton
                pressed={snapshot.fontWeight >= 600}
                onPressedChange={(v) =>
                  apply([{ kind: 'set-style', key: 'fontWeight', value: v ? '700' : null }])
                }
                title="Bold"
              >
                <Bold className="size-3.5" />
              </ToggleButton>
              <ToggleButton
                pressed={snapshot.fontStyle === 'italic'}
                onPressedChange={(v) =>
                  apply([{ kind: 'set-style', key: 'fontStyle', value: v ? 'italic' : null }])
                }
                title="Italic"
              >
                <Italic className="size-3.5" />
              </ToggleButton>
            </Row>
            <LineHeightField snapshot={snapshot} apply={apply} />
            <LetterSpacingField snapshot={snapshot} apply={apply} />
            <TextAlignField snapshot={snapshot} apply={apply} />
          </Section>

          <Section title="Color">
            <ColorField
              label="Text"
              value={snapshot.color}
              onChange={(v) => apply([{ kind: 'set-style', key: 'color', value: v }])}
              clearable={false}
            />
            <ColorField
              label="Background"
              value={snapshot.backgroundColor ?? '#ffffff'}
              dim={!snapshot.backgroundColor}
              onChange={(v) => apply([{ kind: 'set-style', key: 'backgroundColor', value: v }])}
              onClear={() => apply([{ kind: 'set-style', key: 'backgroundColor', value: null }])}
              clearable
            />
          </Section>
        </div>
      )}
    </aside>
  );
}

// ─── Pending-ops flush + freeze CSS ──────────────────────────────────

// Skip CSS animations to their end frame and disable transitions while
// editing. We don't just pause animations because pausing freezes them
// at their *current* frame — when HMR re-mounts the slide, that current
// frame is 0%, which looks identical to a replay. Forcing duration→0
// + fill-mode forwards makes any newly-mounted element jump directly
// to the final keyframe, so HMR is invisible.
const EDITING_FREEZE_CSS = `
[data-inspector-editing] *,
[data-inspector-editing] *::before,
[data-inspector-editing] *::after {
  animation-duration: 1ms !important;
  animation-delay: 0s !important;
  animation-iteration-count: 1 !important;
  animation-fill-mode: forwards !important;
  transition: none !important;
  view-transition-name: none !important;
}
`;

function flushPending(
  line: number,
  column: number,
  applyEdit: (line: number, column: number, ops: EditOp[]) => Promise<void>,
  pendingRef: React.MutableRefObject<{
    styleOps: Map<string, string | null>;
    textOp: string | null;
  }>,
  setError: (msg: string | null) => void,
): void {
  const pending = pendingRef.current;
  const ops: EditOp[] = [];
  for (const [k, v] of pending.styleOps) ops.push({ kind: 'set-style', key: k, value: v });
  if (pending.textOp !== null) ops.push({ kind: 'set-text', value: pending.textOp });
  pendingRef.current = { styleOps: new Map(), textOp: null };
  if (ops.length === 0) return;
  applyEdit(line, column, ops).then(
    () => setError(null),
    (e) => setError(String((e as Error).message ?? e)),
  );
}

// ─── Sections / building blocks ──────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b px-3 py-3">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[88px_1fr] items-center gap-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  );
}

function ToggleButton({
  pressed,
  onPressedChange,
  title,
  children,
}: {
  pressed: boolean;
  onPressedChange: (v: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={() => onPressedChange(!pressed)}
      className={[
        'flex size-7 items-center justify-center rounded border transition-colors',
        pressed
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-input bg-background text-foreground hover:bg-muted',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

// ─── Field components ────────────────────────────────────────────────

function TextField({
  snapshot,
  apply,
}: {
  snapshot: ElementSnapshot;
  apply: (ops: EditOp[]) => void;
}) {
  const editable = snapshot.text !== null;
  const upstream = snapshot.text ?? '';

  if (!editable) {
    return (
      <p className="rounded border border-dashed px-2 py-1.5 text-[11px] text-muted-foreground">
        Element has complex children — can't edit text directly.
      </p>
    );
  }

  return (
    <textarea
      value={upstream}
      onChange={(e) => apply([{ kind: 'set-text', value: e.target.value }])}
      rows={3}
      className="w-full resize-none rounded border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/40"
      placeholder="Element text"
    />
  );
}

function FontSizeField({
  snapshot,
  apply,
}: {
  snapshot: ElementSnapshot;
  apply: (ops: EditOp[]) => void;
}) {
  const set = (px: number) => {
    apply([{ kind: 'set-style', key: 'fontSize', value: `${Math.round(px)}px` }]);
  };
  return (
    <Row label="Size">
      <input
        type="range"
        min={8}
        max={200}
        step={1}
        value={snapshot.fontSize}
        onChange={(e) => set(Number(e.target.value))}
        className="flex-1"
      />
      <NumberInput
        value={Math.round(snapshot.fontSize)}
        onChange={set}
        min={1}
        max={400}
        suffix="px"
      />
    </Row>
  );
}

const WEIGHTS = [300, 400, 500, 600, 700, 800];

function FontWeightField({
  snapshot,
  apply,
}: {
  snapshot: ElementSnapshot;
  apply: (ops: EditOp[]) => void;
}) {
  return (
    <Row label="Weight">
      <select
        value={snapshot.fontWeight}
        onChange={(e) => {
          const n = Number(e.target.value);
          apply([
            {
              kind: 'set-style',
              key: 'fontWeight',
              value: n === 400 ? null : String(n),
            },
          ]);
        }}
        className="h-7 flex-1 rounded border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
      >
        {WEIGHTS.map((w) => (
          <option key={w} value={w}>
            {w}
          </option>
        ))}
      </select>
    </Row>
  );
}

function LineHeightField({
  snapshot,
  apply,
}: {
  snapshot: ElementSnapshot;
  apply: (ops: EditOp[]) => void;
}) {
  const v = snapshot.lineHeight ?? 1.4;
  const set = (n: number) => {
    apply([{ kind: 'set-style', key: 'lineHeight', value: String(round2(n)) }]);
  };
  return (
    <Row label="Line height">
      <input
        type="range"
        min={0.8}
        max={3}
        step={0.05}
        value={v}
        onChange={(e) => set(Number(e.target.value))}
        className="flex-1"
      />
      <NumberInput value={round2(v)} onChange={set} step={0.05} min={0.5} max={5} />
    </Row>
  );
}

function LetterSpacingField({
  snapshot,
  apply,
}: {
  snapshot: ElementSnapshot;
  apply: (ops: EditOp[]) => void;
}) {
  const set = (n: number) => {
    apply([
      {
        kind: 'set-style',
        key: 'letterSpacing',
        value: n === 0 ? null : `${round2(n)}px`,
      },
    ]);
  };
  return (
    <Row label="Tracking">
      <input
        type="range"
        min={-5}
        max={20}
        step={0.1}
        value={snapshot.letterSpacing}
        onChange={(e) => set(Number(e.target.value))}
        className="flex-1"
      />
      <NumberInput
        value={round2(snapshot.letterSpacing)}
        onChange={set}
        step={0.1}
        min={-20}
        max={50}
        suffix="px"
      />
    </Row>
  );
}

function TextAlignField({
  snapshot,
  apply,
}: {
  snapshot: ElementSnapshot;
  apply: (ops: EditOp[]) => void;
}) {
  const opts = [
    { v: 'left', icon: <AlignLeft className="size-3.5" /> },
    { v: 'center', icon: <AlignCenter className="size-3.5" /> },
    { v: 'right', icon: <AlignRight className="size-3.5" /> },
    { v: 'justify', icon: <AlignJustify className="size-3.5" /> },
  ] as const;
  return (
    <Row label="Align">
      <div className="flex overflow-hidden rounded border">
        {opts.map((o) => (
          <button
            type="button"
            key={o.v}
            title={o.v}
            onClick={() =>
              apply([
                {
                  kind: 'set-style',
                  key: 'textAlign',
                  value: o.v === 'left' ? null : o.v,
                },
              ])
            }
            className={[
              'flex size-7 items-center justify-center border-r last:border-r-0 transition-colors',
              snapshot.textAlign === o.v
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-foreground hover:bg-muted',
            ].join(' ')}
          >
            {o.icon}
          </button>
        ))}
      </div>
    </Row>
  );
}

function ColorField({
  label,
  value,
  dim,
  onChange,
  onClear,
  clearable,
}: {
  label: string;
  value: string;
  dim?: boolean;
  onChange: (v: string) => void;
  onClear?: () => void;
  clearable: boolean;
}) {
  // Hex text input keeps a `draft` so the user can type intermediate
  // values like "#a" without us spamming `apply` with invalid hex.
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const commitHex = (hex: string) => {
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) onChange(hex);
  };

  return (
    <Row label={label}>
      <input
        type="color"
        value={value}
        onChange={(e) => {
          setDraft(e.target.value);
          onChange(e.target.value);
        }}
        className="h-7 w-9 cursor-pointer rounded border bg-background p-0.5"
        style={{ opacity: dim ? 0.5 : 1 }}
      />
      <input
        type="text"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          commitHex(e.target.value);
        }}
        className="h-7 flex-1 rounded border bg-background px-2 font-mono text-[11px] outline-none focus:ring-2 focus:ring-primary/40"
      />
      {clearable && onClear && (
        <button
          type="button"
          onClick={onClear}
          title="Clear"
          className="flex size-7 items-center justify-center rounded border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </Row>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center rounded border bg-background pr-1.5">
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
        min={min}
        max={max}
        step={step}
        className="h-7 w-12 bg-transparent px-1.5 text-right text-[11px] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {suffix && <span className="text-[10px] text-muted-foreground">{suffix}</span>}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

function readSnapshot(el: HTMLElement): ElementSnapshot {
  const cs = getComputedStyle(el);
  const text = isSimpleTextElement(el) ? (el.textContent ?? '') : null;

  return {
    fontSize: parseFloat(cs.fontSize) || 16,
    fontWeight: parseInt(cs.fontWeight, 10) || 400,
    fontStyle: cs.fontStyle === 'italic' ? 'italic' : 'normal',
    color: rgbToHex(cs.color) ?? '#000000',
    backgroundColor: isTransparent(cs.backgroundColor) ? null : rgbToHex(cs.backgroundColor),
    textAlign: normalizeTextAlign(cs.textAlign),
    lineHeight: parseLineHeight(cs.lineHeight, parseFloat(cs.fontSize) || 16),
    letterSpacing: parseLetterSpacing(cs.letterSpacing),
    text,
  };
}

function isSimpleTextElement(el: HTMLElement): boolean {
  if (el.childNodes.length === 0) return true;
  if (el.childNodes.length === 1 && el.firstChild?.nodeType === Node.TEXT_NODE) return true;
  return false;
}

function rgbToHex(value: string): string | null {
  const m = value.match(/^rgba?\(([^)]+)\)$/);
  if (!m) return null;
  const parts = m[1].split(',').map((s) => s.trim());
  if (parts.length < 3) return null;
  const r = clampByte(Number(parts[0]));
  const g = clampByte(Number(parts[1]));
  const b = clampByte(Number(parts[2]));
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(Number.isFinite(n) ? n : 0)));
}

function isTransparent(value: string): boolean {
  if (!value) return true;
  if (value === 'transparent' || value === 'rgba(0, 0, 0, 0)') return true;
  const m = value.match(/^rgba\([^)]*,\s*0\)$/);
  return Boolean(m);
}

function normalizeTextAlign(v: string): ElementSnapshot['textAlign'] {
  if (v === 'center' || v === 'right' || v === 'justify') return v;
  return 'left';
}

function parseLineHeight(value: string, fontSize: number): number | null {
  if (!value || value === 'normal') return null;
  const n = parseFloat(value);
  if (!Number.isFinite(n) || n === 0) return null;
  // Computed style returns line-height in px even when authored unitless;
  // convert back to a unitless ratio so the input matches authoring style.
  return round2(n / fontSize);
}

function parseLetterSpacing(value: string): number {
  if (!value || value === 'normal') return 0;
  const n = parseFloat(value);
  return Number.isFinite(n) ? round2(n) : 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function findElementByLine(slideId: string, line: number, column: number): HTMLElement | null {
  const root = document.querySelector('[data-inspector-root]');
  if (!root) return null;
  // Prefer the compile-time attribute — exact match, no fiber walking.
  const tagged = root.querySelector<HTMLElement>(`[data-slide-loc="${line}:${column}"]`);
  if (tagged) return tagged;
  // Fallback: any element whose fiber maps to this line. Used when
  // loc-tags didn't tag this element (e.g., capitalized component).
  const candidates = root.querySelectorAll<HTMLElement>('*');
  for (const el of candidates) {
    const hit = findSlideSource(el, slideId, { hostOnly: true });
    if (hit && hit.line === line) return hit.anchor;
  }
  return null;
}

function useReloadCounter(): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!import.meta.hot) return;
    const handler = () => setN((x) => x + 1);
    import.meta.hot.on('vite:afterUpdate', handler);
    return () => {
      import.meta.hot?.off('vite:afterUpdate', handler);
    };
  }, []);
  return n;
}
