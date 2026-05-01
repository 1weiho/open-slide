import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ImageIcon,
  Italic,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Field, NumberField, Section } from '@/components/panel/PanelFields';
import { PANEL_TRANSITION_MS, PanelShell, useAnimatedOpen } from '@/components/panel/PanelShell';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
import { type AssetEntry, useAssets } from '@/lib/assets';
import { findSlideSource } from '@/lib/inspector/fiber';
import type { SlideComment } from '@/lib/inspector/useComments';
import type { EditOp } from '@/lib/inspector/useEditor';
import { cn } from '@/lib/utils';
import { type SelectedTarget, useInspector } from './InspectorProvider';

type ElementSnapshot = {
  fontSize: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  color: string;
  backgroundColor: string | null;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number | null;
  letterSpacing: number;
  text: string | null;
  imageSrc: string | null;
};

export function InspectorPanel() {
  const { active, slideId, selected, setSelected, bufferOps, pendingCount, comments, add, remove } =
    useInspector();
  const [snapshot, setSnapshot] = useState<ElementSnapshot | null>(null);
  const reloadCounter = useReloadCounter();

  useEffect(() => {
    void reloadCounter;
    void pendingCount;
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
  }, [selected, setSelected, slideId, reloadCounter, pendingCount]);

  // Freeze slide animations while editing so commits don't replay motion.
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
      bufferOps(selected.line, selected.column, selected.anchor, ops);
      if (selected.anchor.isConnected) setSnapshot(readSnapshot(selected.anchor));
    },
    [selected, bufferOps],
  );

  // `pinned` keeps the last selection rendered through the close-out
  // animation so the panel's contents don't blank out before it collapses.
  const targetOpen = active && !!selected && !!snapshot;
  const [pinned, setPinned] = useState<{ s: SelectedTarget; n: ElementSnapshot } | null>(null);
  const animVisible = useAnimatedOpen(targetOpen && !!pinned);

  useEffect(() => {
    if (selected && snapshot) setPinned({ s: selected, n: snapshot });
  }, [selected, snapshot]);

  useEffect(() => {
    if (!targetOpen && pinned) {
      const t = setTimeout(() => setPinned(null), PANEL_TRANSITION_MS);
      return () => clearTimeout(t);
    }
  }, [targetOpen, pinned]);

  if (!pinned) return null;
  const { s: pinSelected, n: pinSnapshot } = pinned;

  return (
    <PanelShell
      uiAttr="inspector"
      animVisible={animVisible}
      header={
        <>
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Element
            </span>
            <span className="rounded-md border bg-muted/60 px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground">
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
        </>
      }
    >
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

      {pinSnapshot.imageSrc !== null && (
        <>
          <Separator />
          <Section title="Image">
            <ImageField slideId={slideId} src={pinSnapshot.imageSrc} apply={apply} />
          </Section>
        </>
      )}

      <Separator />

      <div className="mt-auto">
        <CommentsSection comments={comments} selected={pinSelected} onAdd={add} onRemove={remove} />
      </div>
    </PanelShell>
  );
}

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

function ContentField({
  snapshot,
  apply,
}: {
  snapshot: ElementSnapshot;
  apply: (ops: EditOp[]) => void;
}) {
  // Mirror the value locally and skip syncs during IME composition;
  // a re-render mid-composition would otherwise clobber in-progress
  // candidates (Bopomofo/Pinyin only commit on candidate selection).
  const [local, setLocal] = useState(snapshot.text ?? '');
  const composingRef = useRef(false);

  useEffect(() => {
    if (!composingRef.current) setLocal(snapshot.text ?? '');
  }, [snapshot.text]);

  return (
    <Textarea
      value={local}
      onCompositionStart={() => {
        composingRef.current = true;
      }}
      onCompositionEnd={(e) => {
        composingRef.current = false;
        const v = e.currentTarget.value;
        setLocal(v);
        apply([{ kind: 'set-text', value: v }]);
      }}
      onChange={(e) => {
        const v = e.target.value;
        setLocal(v);
        if (!composingRef.current) {
          apply([{ kind: 'set-text', value: v }]);
        }
      }}
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
  // Buffer the text input so intermediate hex like "#a" doesn't
  // commit until it parses as a full color.
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

function ImageField({
  slideId,
  src,
  apply,
}: {
  slideId: string;
  src: string;
  apply: (ops: EditOp[]) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-[repeating-conic-gradient(theme(colors.muted)_0_25%,transparent_0_50%)] bg-[length:8px_8px]">
          <img
            src={src}
            alt=""
            className="size-full object-contain"
            draggable={false}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => setOpen(true)}
        >
          <ImageIcon className="size-3.5" />
          Replace…
        </Button>
      </div>
      {open && (
        <AssetPickerDialog
          slideId={slideId}
          onClose={() => setOpen(false)}
          onPick={(asset) => {
            setOpen(false);
            apply([
              {
                kind: 'set-attr-asset',
                attr: 'src',
                assetPath: `./assets/${asset.name}`,
                previewUrl: asset.url,
              },
            ]);
          }}
        />
      )}
    </div>
  );
}

function AssetPickerDialog({
  slideId,
  onClose,
  onPick,
}: {
  slideId: string;
  onClose: () => void;
  onPick: (asset: AssetEntry) => void;
}) {
  const { assets, loading } = useAssets(slideId);
  const images = assets.filter((a) => a.mime.startsWith('image/'));
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Replace image</DialogTitle>
          <DialogDescription>
            Pick an asset from <span className="font-mono">slides/{slideId}/assets/</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <p className="px-1 py-6 text-center text-xs text-muted-foreground">Loading…</p>
          ) : images.length === 0 ? (
            <p className="px-1 py-6 text-center text-xs text-muted-foreground">
              No images in this slide's assets folder yet. Add some from the Assets tab.
            </p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
              {images.map((asset) => (
                <button
                  key={asset.name}
                  type="button"
                  onClick={() => onPick(asset)}
                  className={cn(
                    'group flex flex-col overflow-hidden rounded-lg border bg-card text-left shadow-sm transition-all',
                    'hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
                  )}
                >
                  <div className="flex aspect-square w-full items-center justify-center overflow-hidden bg-[repeating-conic-gradient(theme(colors.muted)_0_25%,transparent_0_50%)] bg-[length:12px_12px]">
                    <img
                      src={asset.url}
                      alt=""
                      className="size-full object-contain"
                      draggable={false}
                    />
                  </div>
                  <div className="border-t px-2 py-1.5">
                    <div className="truncate text-[11px] font-medium" title={asset.name}>
                      {asset.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

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

function readSnapshot(el: HTMLElement): ElementSnapshot {
  const cs = getComputedStyle(el);
  const text = isSimpleTextElement(el) ? (el.textContent ?? '') : null;
  const imageSrc =
    el.tagName === 'IMG'
      ? (el as HTMLImageElement).currentSrc || (el as HTMLImageElement).src || null
      : null;

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
    imageSrc,
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
