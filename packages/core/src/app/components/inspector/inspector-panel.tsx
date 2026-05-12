import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowDownToLine,
  Bold,
  Crop,
  ImageIcon,
  Italic,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Field, NumberField, Section } from '@/components/panel/panel-fields';
import { PANEL_TRANSITION_MS, PanelShell, useAnimatedOpen } from '@/components/panel/panel-shell';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { type AssetEntry, uploadWithAutoRename, useAssets } from '@/lib/assets';
import { findSlideSource } from '@/lib/inspector/fiber';
import type { EditOp } from '@/lib/inspector/use-editor';
import { useAgentSocketConnected } from '@/lib/use-agent-socket';
import { format, useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import type { Locale } from '../../../locale/types';
import { type SelectedTarget, useInspector } from './inspector-provider';

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
  placeholder: { hint: string; width?: number; height?: number } | null;
};

type ContentSelection = { start: number; end: number };
type StylePreview = Partial<
  Pick<ElementSnapshot, 'fontSize' | 'fontWeight' | 'fontStyle' | 'color'>
>;
type RangeStylePreview = {
  anchor: HTMLElement;
  start: number;
  end: number;
  values: StylePreview;
};

function resolveSelectedTarget(target: SelectedTarget, slideId: string): SelectedTarget {
  const hit = findSlideSource(target.anchor, slideId, { hostOnly: true });
  if (!hit) return target;
  if (hit.line === target.line && hit.column === target.column && hit.anchor === target.anchor) {
    return target;
  }
  return { line: hit.line, column: hit.column, anchor: hit.anchor };
}

export function InspectorPanel() {
  const { active, slideId, selected, setSelected, bufferOps, pendingCount, add, applyEdit } =
    useInspector();
  const [snapshot, setSnapshot] = useState<ElementSnapshot | null>(null);
  const [contentSelection, setContentSelection] = useState<ContentSelection | null>(null);
  const [rangeStylePreview, setRangeStylePreview] = useState<RangeStylePreview | null>(null);
  const reloadCounter = useReloadCounter();
  const t = useLocale();

  useEffect(() => {
    void selected;
    setContentSelection(null);
    setRangeStylePreview(null);
  }, [selected]);

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
      const target = resolveSelectedTarget(selected, slideId);
      if (target !== selected) setSelected(target);
      bufferOps(target.line, target.column, target.anchor, ops);
      if (target.anchor.isConnected) setSnapshot(readSnapshot(target.anchor));
    },
    [selected, setSelected, slideId, bufferOps],
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
  const contentRange =
    pinSnapshot.text !== null && contentSelection && contentSelection.end > contentSelection.start
      ? contentSelection
      : null;
  const rangePreviewApplies =
    contentRange &&
    rangeStylePreview &&
    rangeStylePreview.anchor === pinSelected.anchor &&
    rangeStylePreview.start === contentRange.start &&
    rangeStylePreview.end === contentRange.end;
  const typographySnapshot = rangePreviewApplies
    ? withStylePreview(pinSnapshot, rangeStylePreview.values)
    : pinSnapshot;
  const applyTextStyle = (ops: EditOp[]) => {
    const styleOps = ops.flatMap((op) => (op.kind === 'set-style' ? [op] : []));
    const target = resolveSelectedTarget(pinSelected, slideId);
    if (target !== pinSelected) setSelected(target);
    if (
      contentRange &&
      pinSnapshot.text !== null &&
      styleOps.length === 1 &&
      styleOps.length === ops.length &&
      styleOps.every((op) => INLINE_CONTENT_STYLE_KEYS.has(op.key))
    ) {
      bufferOps(
        target.line,
        target.column,
        target.anchor,
        styleOps.map((op) => ({
          kind: 'set-text-range-style',
          start: contentRange.start,
          end: contentRange.end,
          key: op.key,
          value: op.value,
          prevText: pinSnapshot.text,
        })),
      );
      setRangeStylePreview((current) => ({
        anchor: target.anchor,
        start: contentRange.start,
        end: contentRange.end,
        values: {
          ...(current?.anchor === target.anchor &&
          current.start === contentRange.start &&
          current.end === contentRange.end
            ? current.values
            : {}),
          ...stylePreviewFromOps(styleOps),
        },
      }));
      if (target.anchor.isConnected) setSnapshot(readSnapshot(target.anchor));
      return;
    }
    if (
      pinSnapshot.text !== null &&
      styleOps.length > 0 &&
      styleOps.length === ops.length &&
      styleOps.every((op) => INLINE_CONTENT_STYLE_KEYS.has(op.key))
    ) {
      bufferOps(
        target.line,
        target.column,
        target.anchor,
        styleOps.map((op) => ({ ...op, prevText: pinSnapshot.text ?? undefined })),
      );
      if (target.anchor.isConnected) setSnapshot(readSnapshot(target.anchor));
      return;
    }
    apply(ops);
  };

  return (
    <PanelShell
      uiAttr="inspector"
      animVisible={animVisible}
      header={
        <>
          <div className="flex min-w-0 items-center gap-2">
            <span className="font-heading text-[12px] font-semibold tracking-tight">
              {t.inspector.inspect}
            </span>
            <span aria-hidden className="h-3 w-px bg-hairline" />
            <span className="rounded-[3px] border border-hairline bg-card px-1.5 py-px font-mono text-[10.5px] text-foreground/85">
              &lt;{pinSelected.anchor.tagName.toLowerCase()}&gt;
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <AgentWatchingBadge />
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setSelected(null)}
              aria-label={t.inspector.deselect}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </>
      }
      footer={<CommentsSection selected={pinSelected} onAdd={add} />}
    >
      {pinSnapshot.text !== null && (
        <Section title={t.inspector.contentSection}>
          <ContentField
            snapshot={pinSnapshot}
            apply={apply}
            onSelectionChange={setContentSelection}
          />
        </Section>
      )}

      <Separator />

      <Section title={t.inspector.typographySection}>
        <FontSizeField snapshot={typographySnapshot} apply={applyTextStyle} />
        <FontWeightField snapshot={typographySnapshot} apply={applyTextStyle} />
        <StyleToggles snapshot={typographySnapshot} apply={applyTextStyle} />
        <LineHeightField snapshot={pinSnapshot} apply={apply} />
        <LetterSpacingField snapshot={pinSnapshot} apply={apply} />
        <TextAlignField snapshot={pinSnapshot} apply={apply} />
      </Section>

      <Separator />

      <Section title={t.inspector.colorSection}>
        <ColorField
          label={t.inspector.textColor}
          value={typographySnapshot.color}
          onChange={(v) => applyTextStyle([{ kind: 'set-style', key: 'color', value: v }])}
          clearable={false}
        />
        <ColorField
          label={t.inspector.backgroundColor}
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
          <Section title={t.inspector.imageSection}>
            <ImageField
              slideId={slideId}
              src={pinSnapshot.imageSrc}
              anchor={pinSelected.anchor}
              apply={apply}
            />
          </Section>
        </>
      )}

      {pinSnapshot.placeholder && (
        <>
          <Separator />
          <Section title={t.inspector.imagePlaceholderSection}>
            <PlaceholderField
              slideId={slideId}
              hint={pinSnapshot.placeholder.hint}
              line={pinSelected.line}
              column={pinSelected.column}
              applyEdit={applyEdit}
            />
          </Section>
        </>
      )}
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

const INLINE_CONTENT_STYLE_KEYS = new Set([
  'fontSize',
  'fontWeight',
  'fontStyle',
  'fontFamily',
  'color',
]);

function stylePreviewFromOps(ops: Array<Extract<EditOp, { kind: 'set-style' }>>): StylePreview {
  const preview: StylePreview = {};
  for (const op of ops) {
    if (op.key === 'fontSize' && op.value) {
      const n = parseFloat(op.value);
      if (Number.isFinite(n)) preview.fontSize = n;
    } else if (op.key === 'fontWeight') {
      preview.fontWeight = op.value ? Number(op.value) || 400 : 400;
    } else if (op.key === 'fontStyle') {
      preview.fontStyle = op.value === 'italic' ? 'italic' : 'normal';
    } else if (op.key === 'color' && op.value) {
      preview.color = op.value;
    }
  }
  return preview;
}

function withStylePreview(snapshot: ElementSnapshot, preview: StylePreview): ElementSnapshot {
  return { ...snapshot, ...preview };
}

function ContentField({
  snapshot,
  apply,
  onSelectionChange,
}: {
  snapshot: ElementSnapshot;
  apply: (ops: EditOp[]) => void;
  onSelectionChange?: (selection: ContentSelection | null) => void;
}) {
  // Mirror the value locally and skip syncs during IME composition;
  // a re-render mid-composition would otherwise clobber in-progress
  // candidates (Bopomofo/Pinyin only commit on candidate selection).
  const [local, setLocal] = useState(snapshot.text ?? '');
  const composingRef = useRef(false);
  const t = useLocale();

  useEffect(() => {
    if (!composingRef.current) setLocal(snapshot.text ?? '');
  }, [snapshot.text]);

  const reportSelection = (el: HTMLTextAreaElement) => {
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? start;
    onSelectionChange?.(end > start ? { start, end } : null);
  };

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
        reportSelection(e.currentTarget);
        apply([{ kind: 'set-text', value: v }]);
      }}
      onChange={(e) => {
        const v = e.target.value;
        setLocal(v);
        reportSelection(e.currentTarget);
        if (!composingRef.current) {
          apply([{ kind: 'set-text', value: v }]);
        }
      }}
      onKeyUp={(e) => reportSelection(e.currentTarget)}
      onMouseUp={(e) => reportSelection(e.currentTarget)}
      onSelect={(e) => reportSelection(e.currentTarget)}
      wrap="off"
      rows={3}
      className="min-h-16 resize-none overflow-x-auto whitespace-pre text-xs"
      placeholder={t.inspector.elementTextPlaceholder}
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
  const t = useLocale();
  return (
    <Field label={t.inspector.sizeLabel}>
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

function getWeightOptions(t: Locale): { value: string; label: string }[] {
  return [
    { value: '300', label: t.inspector.weightLight },
    { value: '400', label: t.inspector.weightRegular },
    { value: '500', label: t.inspector.weightMedium },
    { value: '600', label: t.inspector.weightSemibold },
    { value: '700', label: t.inspector.weightBold },
    { value: '800', label: t.inspector.weightExtrabold },
  ];
}

function FontWeightField({
  snapshot,
  apply,
}: {
  snapshot: ElementSnapshot;
  apply: (ops: EditOp[]) => void;
}) {
  const t = useLocale();
  const weightOptions = getWeightOptions(t);
  return (
    <Field label={t.inspector.weightLabel}>
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
          {weightOptions.map((opt) => (
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
  const t = useLocale();
  return (
    <Field label={t.inspector.styleLabel}>
      <Toggle
        size="sm"
        variant="outline"
        pressed={snapshot.fontWeight >= 600}
        onPressedChange={(v) =>
          apply([{ kind: 'set-style', key: 'fontWeight', value: v ? '700' : null }])
        }
        aria-label={t.inspector.boldAria}
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
        aria-label={t.inspector.italicAria}
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
  const t = useLocale();
  return (
    <Field label={t.inspector.lineHeightLabel}>
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
  const t = useLocale();
  return (
    <Field label={t.inspector.trackingLabel}>
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
  const t = useLocale();
  return (
    <Field label={t.inspector.alignLabel}>
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
  const tColor = useLocale();
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
          aria-label={tColor.inspector.clearAria}
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
  anchor,
  apply,
}: {
  slideId: string;
  src: string;
  anchor: HTMLElement;
  apply: (ops: EditOp[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const t = useLocale();
  const { openCrop } = useInspector();
  const isImage = anchor.tagName === 'IMG';
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
        <div className="flex flex-1 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setOpen(true)}
          >
            <ImageIcon className="size-3.5" />
            {t.inspector.replace}
          </Button>
          {isImage && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => openCrop(anchor as HTMLImageElement)}
            >
              <Crop className="size-3.5" />
              {t.inspector.crop}
            </Button>
          )}
        </div>
      </div>
      {open && (
        <AssetPickerDialog
          slideId={slideId}
          onClose={() => setOpen(false)}
          onPick={(asset) => {
            setOpen(false);
            const ops: EditOp[] = [
              {
                kind: 'set-attr-asset',
                attr: 'src',
                assetPath: `./assets/${asset.name}`,
                previewUrl: asset.url,
              },
            ];
            if (isImage) {
              const cs = window.getComputedStyle(anchor);
              if (cs.objectFit !== 'cover' && cs.objectFit !== 'contain') {
                ops.push({ kind: 'set-style', key: 'objectFit', value: 'cover' });
              }
              const op = cs.objectPosition.trim();
              if (!op || op === '0% 0%' || op === 'auto') {
                ops.push({ kind: 'set-style', key: 'objectPosition', value: '50% 50%' });
              }
            }
            apply(ops);
          }}
        />
      )}
    </div>
  );
}

function PlaceholderField({
  slideId,
  hint,
  line,
  column,
  applyEdit,
}: {
  slideId: string;
  hint: string;
  line: number;
  column: number;
  applyEdit: (line: number, column: number, ops: EditOp[]) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const t = useLocale();
  return (
    <div className="space-y-2">
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {t.inspector.placeholderHintLabel}{' '}
        <span className="font-medium text-foreground">{hint}</span>
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        disabled={submitting}
        onClick={() => setOpen(true)}
      >
        <ImageIcon className="size-3.5" />
        {t.inspector.replace}
      </Button>
      {open && (
        <AssetPickerDialog
          slideId={slideId}
          onClose={() => setOpen(false)}
          onPick={async (asset) => {
            setOpen(false);
            setSubmitting(true);
            try {
              await applyEdit(line, column, [
                {
                  kind: 'replace-placeholder-with-image',
                  assetPath: `./assets/${asset.name}`,
                },
              ]);
            } finally {
              setSubmitting(false);
            }
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
  const { assets, loading, refresh } = useAssets(slideId);
  const images = assets.filter((a) => a.mime.startsWith('image/'));
  const t = useLocale();
  const path = `slides/${slideId}/assets/`;
  const [descPrefix, descSuffix] = t.inspector.replaceImageDescription.split('{path}');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const dragDepth = useRef(0);
  const inputId = useId();

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return;
      setUploading(true);
      try {
        const { ok, status, entry } = await uploadWithAutoRename(slideId, file);
        if (!ok || !entry) {
          toast.error(format(t.asset.toastUploadFailed, { status }));
          return;
        }
        await refresh().catch(() => {});
        onPick(entry);
      } finally {
        setUploading(false);
      }
    },
    [slideId, refresh, onPick, t],
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t.inspector.replaceImageDialogTitle}</DialogTitle>
          <DialogDescription>
            {descPrefix}
            <span className="font-mono">{path}</span>
            {descSuffix}
          </DialogDescription>
        </DialogHeader>
        <label
          htmlFor={inputId}
          className={cn(
            'absolute right-12 top-3.5 inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-[5px] border border-border bg-card px-2 text-[12px] font-medium transition-colors',
            'hover:bg-muted/60 hover:border-foreground/20 active:translate-y-px',
            uploading && 'pointer-events-none opacity-60',
          )}
        >
          {uploading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Upload className="size-3.5" />
          )}
          <span>{t.asset.upload}</span>
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) handleFile(file).catch(() => {});
          }}
        />
        <section
          aria-label={t.inspector.replaceImageDialogTitle}
          className="relative max-h-[60vh] overflow-y-auto"
          onDragEnter={(e) => {
            if (uploading || !hasFiles(e)) return;
            e.preventDefault();
            dragDepth.current += 1;
            setDragActive(true);
          }}
          onDragOver={(e) => {
            if (uploading || !hasFiles(e)) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDragLeave={() => {
            dragDepth.current = Math.max(0, dragDepth.current - 1);
            if (dragDepth.current === 0) setDragActive(false);
          }}
          onDrop={(e) => {
            if (uploading || !hasFiles(e)) return;
            e.preventDefault();
            dragDepth.current = 0;
            setDragActive(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file).catch(() => {});
          }}
        >
          {loading ? (
            <p className="px-1 py-6 text-center text-xs text-muted-foreground">
              {t.inspector.pickerLoading}
            </p>
          ) : images.length === 0 ? (
            <p className="px-1 py-6 text-center text-xs text-muted-foreground">
              {t.inspector.pickerEmpty}
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
          {dragActive && (
            <div
              className="pointer-events-none absolute inset-0 z-10 animate-in fade-in-0 duration-200"
              aria-hidden
            >
              <div className="absolute inset-0 bg-brand/5" />
              <div className="absolute inset-1 rounded-[8px] border border-dashed border-brand/40" />
              <div className="absolute inset-x-0 bottom-4 flex justify-center">
                <div className="flex items-center gap-2 rounded-[6px] border border-border bg-card px-3 py-1.5 text-[12px] font-medium shadow-floating">
                  <ArrowDownToLine className="size-3.5 text-brand" />
                  <span>{t.asset.dropToUpload}</span>
                </div>
              </div>
            </div>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}

function hasFiles(e: React.DragEvent): boolean {
  const types = e.dataTransfer?.types;
  if (!types) return false;
  for (let i = 0; i < types.length; i++) {
    if (types[i] === 'Files') return true;
  }
  return false;
}

function AgentWatchingBadge() {
  const t = useLocale();
  const connected = useAgentSocketConnected();
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="flex shrink-0 cursor-help items-center gap-1.5 rounded-[3px] border border-hairline bg-card px-1.5 py-px text-[10.5px] text-foreground/85 outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <span aria-hidden className="relative flex size-1.5 items-center justify-center">
              {connected ? (
                <>
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </>
              ) : (
                <span className="relative inline-flex size-1.5 rounded-full bg-rose-500" />
              )}
            </span>
            {connected ? t.inspector.agentWatching : t.inspector.agentNotWatching}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="max-w-[260px] leading-relaxed">
          {connected ? t.inspector.agentWatchingTooltip : t.inspector.agentNotWatchingTooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function CommentsSection({
  selected,
  onAdd,
}: {
  selected: { line: number; column: number };
  onAdd: (line: number, column: number, text: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const t = useLocale();

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
    <Section title={t.inspector.leaveComment}>
      <div className="flex flex-col gap-2">
        <div className="comment-cue rounded-[6px]">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={t.inspector.commentPlaceholder}
            className="min-h-16 resize-none text-[12px]"
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10.5px] text-muted-foreground/70">
            {t.inspector.commentShortcutHint}
          </span>
          <Button size="sm" variant="brand" disabled={submitting || !draft.trim()} onClick={submit}>
            {t.inspector.addComment}
          </Button>
        </div>
      </div>
    </Section>
  );
}

function readSnapshot(el: HTMLElement): ElementSnapshot {
  const cs = getComputedStyle(el);
  const text = isSimpleTextElement(el) ? readEditableText(el) : null;
  const imageSrc =
    el.tagName === 'IMG'
      ? (el as HTMLImageElement).currentSrc || (el as HTMLImageElement).src || null
      : null;
  const ph = el.dataset.slidePlaceholder ?? null;
  const placeholder =
    ph !== null
      ? {
          hint: ph,
          width: el.dataset.placeholderW ? Number(el.dataset.placeholderW) : undefined,
          height: el.dataset.placeholderH ? Number(el.dataset.placeholderH) : undefined,
        }
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
    placeholder,
  };
}

function isSimpleTextElement(el: HTMLElement): boolean {
  if (el.childNodes.length === 0) return true;
  return hasOnlyInlineTextChildren(el);
}

const INLINE_TEXT_TAGS = new Set([
  'B',
  'CODE',
  'DEL',
  'EM',
  'I',
  'INS',
  'MARK',
  'S',
  'SMALL',
  'SPAN',
  'STRONG',
  'SUB',
  'SUP',
  'U',
]);

function hasOnlyInlineTextChildren(el: HTMLElement): boolean {
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      continue;
    } else if (child instanceof HTMLElement) {
      if (child.tagName === 'BR') continue;
      if (INLINE_TEXT_TAGS.has(child.tagName) && hasOnlyInlineTextChildren(child)) continue;
    }
    return false;
  }
  return true;
}

function readEditableText(el: HTMLElement): string {
  const parts: string[] = [];
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      parts.push(renderedTextNodeValue(child as Text));
    } else if (child instanceof HTMLBRElement) {
      parts.push('\n');
    } else if (child instanceof HTMLElement) {
      parts.push(readEditableText(child));
    }
  }
  return normalizeRenderedText(parts);
}

function normalizeRenderedText(parts: string[]): string {
  return parts
    .map((part, index) => {
      if (part === '\n') return part;
      let next = part;
      if (parts[index - 1] === '\n') next = next.replace(/^\s+/, '');
      if (parts[index + 1] === '\n') next = next.replace(/\s+$/, '');
      return next;
    })
    .join('');
}

function renderedTextNodeValue(node: Text): string {
  const value = node.textContent ?? '';
  const whiteSpace = node.parentElement ? getComputedStyle(node.parentElement).whiteSpace : '';
  if (whiteSpace === 'pre' || whiteSpace === 'pre-wrap' || whiteSpace === 'break-spaces') {
    return value;
  }
  return value.replace(/\s+/g, ' ');
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
