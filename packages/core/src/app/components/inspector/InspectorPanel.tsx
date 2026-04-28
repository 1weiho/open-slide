import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { findSlideSource } from '@/lib/inspector/fiber';
import type { SlideComment } from '@/lib/inspector/useComments';
import type { EditOp } from '@/lib/inspector/useEditor';
import { type SelectedTarget, useInspector } from './InspectorProvider';

const PANEL_W = 340;
const PANEL_TRANSITION_MS = 280;

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

export function InspectorPanel() {
  const { active, slideId, selected, setSelected, applyEdit, comments, add, remove } =
    useInspector();
  const [snapshot, setSnapshot] = useState<ElementSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reloadCounter = useReloadCounter();

  // Pending ops buffered while the user is editing one element. We mutate
  // the DOM directly for visual feedback and only commit to source when
  // the user *moves on* — clicks a different element or closes the
  // panel. Every commit point is handled by the cleanup effect below,
  // so the buffer is never silently dropped.
  const pendingRef = useRef<{ styleOps: Map<string, string | null>; textOp: string | null }>({
    styleOps: new Map(),
    textOp: null,
  });

  useEffect(() => {
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
        return;
      }
    }
    setSnapshot(readSnapshot(anchor));
  }, [selected, setSelected, slideId, reloadCounter]);

  // Freeze CSS animations + transitions inside the slide whenever the
  // inspector is open, so commits don't replay motion.
  useEffect(() => {
    if (!active) return;
    const root = document.querySelector<HTMLElement>('[data-inspector-root]');
    if (!root) return;
    const styleEl = document.createElement('style');
    styleEl.textContent = EDITING_FREEZE_CSS;
    document.head.appendChild(styleEl);
    root.dataset.inspectorEditing = 'true';
    return () => {
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
      if (anchor.isConnected) setSnapshot(readSnapshot(anchor));
    },
    [selected],
  );

  useEffect(() => {
    const target = selected;
    return () => {
      if (!target) return;
      flushPending(target.line, target.column, applyEdit, pendingRef, setError);
    };
  }, [selected, applyEdit]);

  // Smooth slide-in/out: keep a "pinned" copy of the latest valid
  // selection so the panel can keep rendering during the close-out
  // animation. `animVisible` lags one frame behind mount so the CSS
  // width transition fires on the deferred 0 → PANEL_W flip.
  const targetOpen = active && !!selected && !!snapshot;
  const [pinned, setPinned] = useState<{ s: SelectedTarget; n: ElementSnapshot } | null>(null);
  const [animVisible, setAnimVisible] = useState(false);

  useEffect(() => {
    if (selected && snapshot) setPinned({ s: selected, n: snapshot });
  }, [selected, snapshot]);

  useEffect(() => {
    if (targetOpen && pinned) {
      const id = requestAnimationFrame(() => setAnimVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setAnimVisible(false);
  }, [targetOpen, pinned]);

  useEffect(() => {
    if (!targetOpen && pinned) {
      const t = setTimeout(() => setPinned(null), PANEL_TRANSITION_MS);
      return () => clearTimeout(t);
    }
  }, [targetOpen, pinned]);

  if (!pinned) return null;
  const { s: pinSelected, n: pinSnapshot } = pinned;

  return (
    <aside
      data-inspector-ui
      className="flex h-full shrink-0 justify-end overflow-hidden bg-card transition-[width,border-left-width] ease-out"
      style={{
        width: animVisible ? PANEL_W : 0,
        borderLeftWidth: animVisible ? 1 : 0,
        transitionDuration: `${PANEL_TRANSITION_MS}ms`,
      }}
    >
      <div style={{ width: PANEL_W }} className="flex h-full shrink-0 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
              &lt;{pinSelected.anchor.tagName.toLowerCase()}&gt;
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={() => setSelected(null)}
            aria-label="Deselect"
          >
            <X className="size-3.5" />
          </Button>
        </header>

        <ScrollArea className="flex flex-1 flex-col">
          <div className="flex min-h-full flex-col">
            {error && (
              <div className="mx-3 mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 text-[11px] text-destructive">
                {error}
              </div>
            )}

            {pinSnapshot.text !== null && (
              <Section title="Content">
                <ContentField snapshot={pinSnapshot} apply={apply} />
              </Section>
            )}

            <Separator />

            <Section title="Typography">
              <FontSizeField snapshot={pinSnapshot} apply={apply} />
              <FontWeightField snapshot={pinSnapshot} apply={apply} />
              <StyleToggles snapshot={pinSnapshot} apply={apply} />
              <LineHeightField snapshot={pinSnapshot} apply={apply} />
              <LetterSpacingField snapshot={pinSnapshot} apply={apply} />
              <TextAlignField snapshot={pinSnapshot} apply={apply} />
            </Section>

            <Separator />

            <Section title="Color">
              <ColorField
                label="Text"
                value={pinSnapshot.color}
                onChange={(v) => apply([{ kind: 'set-style', key: 'color', value: v }])}
                clearable={false}
              />
              <ColorField
                label="Background"
                value={pinSnapshot.backgroundColor ?? '#ffffff'}
                dim={!pinSnapshot.backgroundColor}
                onChange={(v) => apply([{ kind: 'set-style', key: 'backgroundColor', value: v }])}
                onClear={() => apply([{ kind: 'set-style', key: 'backgroundColor', value: null }])}
                clearable
              />
            </Section>

            <Separator />

            {/* `mt-auto` pins comments to the bottom of the panel even
                when the edit sections above don't fill the viewport. */}
            <div className="mt-auto">
              <CommentsSection
                comments={comments}
                selected={pinSelected}
                onAdd={add}
                onRemove={remove}
              />
            </div>
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}

// ─── Layout helpers ─────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-4 py-4">
      <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {title}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[80px_1fr] items-center gap-3">
      <Label className="text-[11px] font-normal text-muted-foreground">{label}</Label>
      <div className="flex min-w-0 items-center gap-2">{children}</div>
    </div>
  );
}

// ─── Pending-ops flush + freeze CSS ────────────────────────────────

const EDITING_FREEZE_CSS = `
[data-inspector-editing] *:not([data-inspector-ui], [data-inspector-ui] *),
[data-inspector-editing] *:not([data-inspector-ui], [data-inspector-ui] *)::before,
[data-inspector-editing] *:not([data-inspector-ui], [data-inspector-ui] *)::after {
  animation-duration: 1ms !important;
  animation-delay: 0s !important;
  animation-iteration-count: 1 !important;
  animation-fill-mode: forwards !important;
  transition: none !important;
  view-transition-name: none !important;
  cursor: pointer !important;
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

// ─── Field components ───────────────────────────────────────────────

function ContentField({
  snapshot,
  apply,
}: {
  snapshot: ElementSnapshot;
  apply: (ops: EditOp[]) => void;
}) {
  return (
    <Textarea
      value={snapshot.text ?? ''}
      onChange={(e) => apply([{ kind: 'set-text', value: e.target.value }])}
      rows={3}
      className="min-h-16 resize-none text-xs"
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
    <Field label="Size">
      <Slider
        min={8}
        max={200}
        step={1}
        value={[snapshot.fontSize]}
        onValueChange={([v]) => set(v ?? snapshot.fontSize)}
        className="flex-1"
      />
      <NumberField
        value={Math.round(snapshot.fontSize)}
        onChange={set}
        min={1}
        max={400}
        suffix="px"
      />
    </Field>
  );
}

const WEIGHT_OPTIONS: { value: string; label: string }[] = [
  { value: '300', label: 'Light · 300' },
  { value: '400', label: 'Regular · 400' },
  { value: '500', label: 'Medium · 500' },
  { value: '600', label: 'Semibold · 600' },
  { value: '700', label: 'Bold · 700' },
  { value: '800', label: 'Extrabold · 800' },
];

function FontWeightField({
  snapshot,
  apply,
}: {
  snapshot: ElementSnapshot;
  apply: (ops: EditOp[]) => void;
}) {
  return (
    <Field label="Weight">
      <Select
        value={String(snapshot.fontWeight)}
        onValueChange={(value) => {
          const n = Number(value);
          apply([
            {
              kind: 'set-style',
              key: 'fontWeight',
              value: n === 400 ? null : value,
            },
          ]);
        }}
      >
        <SelectTrigger size="sm" className="h-8 flex-1 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {WEIGHT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function StyleToggles({
  snapshot,
  apply,
}: {
  snapshot: ElementSnapshot;
  apply: (ops: EditOp[]) => void;
}) {
  return (
    <Field label="Style">
      <Toggle
        size="sm"
        variant="outline"
        pressed={snapshot.fontWeight >= 600}
        onPressedChange={(v) =>
          apply([{ kind: 'set-style', key: 'fontWeight', value: v ? '700' : null }])
        }
        aria-label="Bold"
      >
        <Bold className="size-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        variant="outline"
        pressed={snapshot.fontStyle === 'italic'}
        onPressedChange={(v) =>
          apply([{ kind: 'set-style', key: 'fontStyle', value: v ? 'italic' : null }])
        }
        aria-label="Italic"
      >
        <Italic className="size-3.5" />
      </Toggle>
    </Field>
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
    <Field label="Line height">
      <Slider
        min={0.8}
        max={3}
        step={0.05}
        value={[v]}
        onValueChange={([n]) => set(n ?? v)}
        className="flex-1"
      />
      <NumberField value={round2(v)} onChange={set} step={0.05} min={0.5} max={5} />
    </Field>
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
    <Field label="Tracking">
      <Slider
        min={-5}
        max={20}
        step={0.1}
        value={[snapshot.letterSpacing]}
        onValueChange={([n]) => set(n ?? snapshot.letterSpacing)}
        className="flex-1"
      />
      <NumberField
        value={round2(snapshot.letterSpacing)}
        onChange={set}
        step={0.1}
        min={-20}
        max={50}
        suffix="px"
      />
    </Field>
  );
}

const ALIGN_OPTIONS = [
  { v: 'left', icon: AlignLeft },
  { v: 'center', icon: AlignCenter },
  { v: 'right', icon: AlignRight },
  { v: 'justify', icon: AlignJustify },
] as const;

function TextAlignField({
  snapshot,
  apply,
}: {
  snapshot: ElementSnapshot;
  apply: (ops: EditOp[]) => void;
}) {
  return (
    <Field label="Align">
      <ToggleGroup
        type="single"
        size="sm"
        variant="outline"
        value={snapshot.textAlign}
        onValueChange={(value) => {
          if (!value) return;
          apply([
            {
              kind: 'set-style',
              key: 'textAlign',
              value: value === 'left' ? null : value,
            },
          ]);
        }}
      >
        {ALIGN_OPTIONS.map(({ v, icon: Icon }) => (
          <ToggleGroupItem key={v} value={v} aria-label={v} className="size-8">
            <Icon className="size-3.5" />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Field>
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
    <Field label={label}>
      <label className="relative inline-flex size-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border bg-background shadow-xs">
        <span
          className="size-5 rounded-sm"
          style={{
            backgroundColor: dim ? 'transparent' : value,
            backgroundImage: dim
              ? 'linear-gradient(45deg, #d4d4d4 25%, transparent 25%, transparent 75%, #d4d4d4 75%), linear-gradient(45deg, #d4d4d4 25%, transparent 25%, transparent 75%, #d4d4d4 75%)'
              : undefined,
            backgroundSize: dim ? '8px 8px' : undefined,
            backgroundPosition: dim ? '0 0, 4px 4px' : undefined,
          }}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => {
            setDraft(e.target.value);
            onChange(e.target.value);
          }}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <Input
        type="text"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          commitHex(e.target.value);
        }}
        className="h-8 flex-1 font-mono text-[11px] uppercase"
        spellCheck={false}
      />
      {clearable && onClear && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground"
          onClick={onClear}
          aria-label="Clear"
        >
          <X className="size-3.5" />
        </Button>
      )}
    </Field>
  );
}

function NumberField({
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
    <div className="flex h-8 shrink-0 items-center rounded-md border bg-background pr-2 shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
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
        className="h-full w-12 bg-transparent px-2 text-right text-[11px] tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {suffix && <span className="text-[10px] text-muted-foreground">{suffix}</span>}
    </div>
  );
}

// ─── Comments ───────────────────────────────────────────────────────

function CommentsSection({
  comments,
  selected,
  onAdd,
  onRemove,
}: {
  comments: SlideComment[];
  selected: { line: number; column: number };
  onAdd: (line: number, column: number, text: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await onAdd(selected.line, selected.column, trimmed);
      setDraft('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section title={comments.length ? `Comments · ${comments.length}` : 'Comments'}>
      <div className="flex flex-col gap-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Describe a change for the agent…"
          className="min-h-16 resize-none text-xs"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">⌘/Ctrl + Enter</span>
          <Button
            size="sm"
            disabled={submitting || !draft.trim()}
            onClick={submit}
            className="h-7 px-2.5 text-[11px]"
          >
            Add comment
          </Button>
        </div>
      </div>

      {comments.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">No comments yet.</p>
      ) : (
        <>
          <ul className="flex flex-col gap-1">
            {comments.map((c) => (
              <li
                key={c.id}
                className="group flex items-start gap-2 rounded-md border bg-background px-2.5 py-2 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[10px] text-muted-foreground">line {c.line}</div>
                  <div className="mt-0.5 text-xs leading-relaxed break-words">{c.note}</div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                  onClick={() => onRemove(c.id)}
                  aria-label="Delete comment"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-muted-foreground">
            Run{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-foreground">
              /apply-comments
            </code>{' '}
            to apply.
          </p>
        </>
      )}
    </Section>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────

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
  const tagged = root.querySelector<HTMLElement>(`[data-slide-loc="${line}:${column}"]`);
  if (tagged) return tagged;
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
