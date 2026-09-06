import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronRight,
  Crop,
  ImageIcon,
  Italic,
  MousePointer2,
  Move,
  Paintbrush,
  PencilLine,
  Shapes,
  Type,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { IconSwitcherIndicator } from '@/components/icon-switcher-indicator';
import { Field, NumberField, Section } from '@/components/panel/panel-fields';
import { PanelShell } from '@/components/panel/panel-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { findSlideSource } from '@/lib/inspector/fiber';
import { hasOnlyInlineTextChildren } from '@/lib/inspector/inline-text';
import { styleContext } from '@/lib/inspector/text-selection';
import type { EditOp } from '@/lib/inspector/use-editor';
import { useAgentSocketConnected } from '@/lib/use-agent-socket';
import { format, useLocale } from '@/lib/use-locale';
import { cn, round2 } from '@/lib/utils';
import type { Locale } from '../../../locale/types';
import { ArrangePanel } from './arrange-panel';
import { AssetPickerDialog } from './asset-picker-dialog';
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

export function InspectorPanel({
  preferredTab,
  onTabChange,
}: {
  preferredTab: 'format' | 'arrange';
  onTabChange: (tab: 'format' | 'arrange') => void;
}) {
  const {
    togglePanel,
    inlineEdit,
    inlineSelection,
    startInlineEdit,
    stopInlineEdit,
    applyInlineStyle,
    slideId,
    selected,
    selection,
    setSelected,
    bufferOps,
    pendingCount,
    opsVersion,
    add,
    applyEdit,
  } = useInspector();
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

  useLayoutEffect(() => {
    void reloadCounter;
    void pendingCount;
    void opsVersion;
    if (!selected) {
      setSnapshot(null);
      return;
    }
    const anchor = selected.anchor;
    if (!anchor.isConnected) return;
    setSnapshot(readSnapshot(anchor));
  }, [selected, reloadCounter, pendingCount, opsVersion]);

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

  const multiple = selection.length > 1;
  const tab = multiple ? 'arrange' : inlineEdit ? 'format' : preferredTab;
  const textSelected = selected && snapshot?.text !== null && snapshot?.text !== undefined;
  const imageSelected = Boolean(snapshot?.imageSrc || snapshot?.placeholder);
  const elementLabel = multiple
    ? format(t.inspector.selectionCount, { count: selection.length })
    : textSelected
      ? t.inspector.elementText
      : imageSelected
        ? t.inspector.elementImage
        : t.inspector.elementShape;
  const ElementIcon = textSelected ? Type : imageSelected ? ImageIcon : Shapes;
  const FormatIcon = textSelected ? Type : imageSelected ? ImageIcon : Paintbrush;
  const formatLabel = textSelected
    ? t.inspector.elementText
    : imageSelected
      ? t.inspector.elementImage
      : t.inspector.styleLabel;
  const selectedInlineRange =
    inlineEdit?.anchor === selected?.anchor && inlineSelection ? inlineSelection : null;
  const contentRange =
    !inlineEdit &&
    snapshot &&
    snapshot.text !== null &&
    contentSelection &&
    contentSelection.end > contentSelection.start
      ? contentSelection
      : null;
  const rangePreviewApplies =
    contentRange &&
    rangeStylePreview &&
    rangeStylePreview.anchor === selected?.anchor &&
    rangeStylePreview.start === contentRange.start &&
    rangeStylePreview.end === contentRange.end;
  const rangeSnapshot =
    selected && selectedInlineRange && snapshot
      ? { ...snapshot, ...readTypography(styleContext(selected.anchor, selectedInlineRange)) }
      : snapshot;
  const typographySnapshot =
    rangePreviewApplies && rangeSnapshot
      ? { ...rangeSnapshot, ...rangeStylePreview.values }
      : rangeSnapshot;
  const applyTextStyle = (ops: EditOp[]) => {
    if (!selected || !snapshot) return;
    if (applyInlineStyle(ops)) {
      if (selected.anchor.isConnected) setSnapshot(readSnapshot(selected.anchor));
      return;
    }
    const styleOps = ops.flatMap((op) => (op.kind === 'set-style' ? [op] : []));
    const target = resolveSelectedTarget(selected, slideId);
    if (target !== selected) setSelected(target);
    if (
      contentRange &&
      snapshot.text !== null &&
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
          prevText: snapshot.text ?? undefined,
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
      snapshot.text !== null &&
      styleOps.length > 0 &&
      styleOps.length === ops.length &&
      styleOps.every((op) => INLINE_CONTENT_STYLE_KEYS.has(op.key))
    ) {
      bufferOps(
        target.line,
        target.column,
        target.anchor,
        styleOps.map((op) => ({ ...op, prevText: snapshot.text ?? undefined })),
      );
      if (target.anchor.isConnected) setSnapshot(readSnapshot(target.anchor));
      return;
    }
    apply(ops);
  };

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        if (value === 'arrange') stopInlineEdit();
        if (value === 'format' || value === 'arrange') onTabChange(value);
      }}
      className="h-full shrink-0 gap-0"
      onPointerDownCapture={(event) => {
        if (!inlineEdit || !(event.target instanceof Element)) return;
        const button = event.target.closest('button');
        if (button && !button.matches('[aria-haspopup], [role="tab"]')) event.preventDefault();
      }}
    >
      <PanelShell
        uiAttr="inspector"
        header={
          <>
            <div className="flex min-w-0 items-center gap-2">
              <Paintbrush className="size-3.5 text-muted-foreground" />
              <span className="font-heading text-[12px] font-semibold tracking-tight">
                {t.inspector.format}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={togglePanel}
              aria-label={t.inspector.closeFormatPanel}
            >
              <X />
            </Button>
          </>
        }
        banner={
          selected && snapshot ? (
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-hairline px-3.5 py-3">
              <div className="flex min-w-0 items-center gap-2 text-[12px] font-medium">
                <ElementIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{elementLabel}</span>
              </div>
              <TabsList
                className="relative isolate shrink-0 rounded-lg group-data-[orientation=horizontal]/tabs:h-8"
                aria-label={t.inspector.format}
              >
                <IconSwitcherIndicator index={tab === 'arrange' ? 1 : 0} />
                <TabsTrigger
                  value="format"
                  disabled={multiple}
                  title={formatLabel}
                  className="z-10 h-full w-8 flex-none rounded-md px-0 data-active:bg-transparent data-active:shadow-none dark:data-active:bg-transparent"
                >
                  <FormatIcon aria-hidden />
                  <span className="sr-only">{formatLabel}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="arrange"
                  title={t.inspector.arrangeSection}
                  className="z-10 h-full w-8 flex-none rounded-md px-0 data-active:bg-transparent data-active:shadow-none dark:data-active:bg-transparent"
                >
                  <Move aria-hidden />
                  <span className="sr-only">{t.inspector.arrangeSection}</span>
                </TabsTrigger>
              </TabsList>
            </div>
          ) : undefined
        }
      >
        {selected && snapshot && typographySnapshot ? (
          <>
            <TabsContent value="format">
              {textSelected && (
                <>
                  <div className="flex flex-col gap-2 px-3.5 pt-3.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => startInlineEdit(selected)}
                    >
                      <PencilLine data-icon="inline-start" />
                      {t.inspector.editText}
                    </Button>
                    {selectedInlineRange && selectedInlineRange.end > selectedInlineRange.start && (
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        {t.inspector.textSelectionHint}
                      </p>
                    )}
                  </div>
                  <Section title={t.inspector.typographySection}>
                    <FontSizeField snapshot={typographySnapshot} apply={applyTextStyle} />
                    <FontWeightField snapshot={typographySnapshot} apply={applyTextStyle} />
                    <StyleToggles snapshot={typographySnapshot} apply={applyTextStyle} />
                    <ColorField
                      label={t.inspector.textColor}
                      value={typographySnapshot.color}
                      onChange={(value) =>
                        applyTextStyle([{ kind: 'set-style', key: 'color', value }])
                      }
                      clearable={false}
                    />
                    <TextAlignField snapshot={snapshot} apply={apply} />
                  </Section>
                  <Separator />
                  <Disclosure title={t.inspector.spacingSection}>
                    <div className="flex flex-col gap-2.5 px-3.5 pb-3.5">
                      <LineHeightField snapshot={snapshot} apply={apply} />
                      <LetterSpacingField snapshot={snapshot} apply={apply} />
                    </div>
                  </Disclosure>
                  <Separator />
                </>
              )}
              {snapshot.imageSrc !== null && (
                <>
                  <Section title={t.inspector.imageSection}>
                    <ImageField src={snapshot.imageSrc} anchor={selected.anchor} />
                  </Section>
                  <Separator />
                </>
              )}
              {snapshot.placeholder && (
                <>
                  <Section title={t.inspector.imagePlaceholderSection}>
                    <PlaceholderField
                      slideId={slideId}
                      hint={snapshot.placeholder.hint}
                      line={selected.line}
                      column={selected.column}
                      applyEdit={applyEdit}
                    />
                  </Section>
                  <Separator />
                </>
              )}
              <Section title={t.inspector.appearanceSection}>
                <ColorField
                  label={t.inspector.backgroundColor}
                  value={snapshot.backgroundColor ?? '#ffffff'}
                  dim={!snapshot.backgroundColor}
                  onChange={(value) =>
                    apply([{ kind: 'set-style', key: 'backgroundColor', value }])
                  }
                  onClear={() =>
                    apply([{ kind: 'set-style', key: 'backgroundColor', value: null }])
                  }
                  clearable
                />
              </Section>
              {textSelected && (
                <>
                  <Separator />
                  <Disclosure title={t.inspector.contentSection}>
                    <div className="px-3.5 pb-3.5">
                      <ContentField
                        snapshot={snapshot}
                        apply={apply}
                        onFocus={stopInlineEdit}
                        onSelectionChange={setContentSelection}
                      />
                    </div>
                  </Disclosure>
                </>
              )}
            </TabsContent>
            <TabsContent value="arrange">
              <ArrangePanel />
            </TabsContent>
            {!multiple && (
              <div className="mt-auto">
                <Separator />
                <Disclosure title={t.inspector.leaveComment}>
                  <CommentsSection selected={selected} onAdd={add} />
                </Disclosure>
                <Separator />
                <Disclosure title={t.inspector.sourceSection}>
                  <div className="flex items-center justify-between gap-2 px-3.5 pb-3.5">
                    <span className="font-mono text-[10.5px] text-muted-foreground">
                      &lt;{selected.anchor.tagName.toLowerCase()}&gt; · {selected.line}:
                      {selected.column}
                    </span>
                    <AgentWatchingBadge />
                  </div>
                </Disclosure>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 px-7 py-16 text-center">
            <MousePointer2 aria-hidden className="size-8 text-muted-foreground/50" />
            <div className="flex flex-col gap-1.5">
              <h2 className="text-[13px] font-medium">{t.inspector.emptySelectionTitle}</h2>
              <p className="text-[12px] leading-relaxed text-muted-foreground">
                {t.inspector.emptySelectionHint}
              </p>
            </div>
          </div>
        )}
      </PanelShell>
    </Tabs>
  );
}

function Disclosure({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group/disclosure">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3.5 py-3 text-[11px] font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40 [&::-webkit-details-marker]:hidden">
        <ChevronRight aria-hidden className="size-3 group-open/disclosure:rotate-90" />
        {title}
      </summary>
      {children}
    </details>
  );
}

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

function ContentField({
  snapshot,
  apply,
  onFocus,
  onSelectionChange,
}: {
  snapshot: ElementSnapshot;
  apply: (ops: EditOp[]) => void;
  onFocus: () => void;
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
      aria-label={t.inspector.elementTextPlaceholder}
      onFocus={onFocus}
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
      className="field-sizing-fixed min-h-16 w-full resize-none overflow-x-auto whitespace-pre text-xs"
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
        onValueChange={(v) => set((Array.isArray(v) ? v[0] : v) ?? snapshot.fontSize)}
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
        items={Object.fromEntries(weightOptions.map((opt) => [opt.value, opt.label]))}
        value={String(snapshot.fontWeight)}
        onValueChange={(value) => {
          const n = Number(value);
          apply([
            {
              kind: 'set-style',
              key: 'fontWeight',
              value: String(n),
            },
          ]);
        }}
      >
        <SelectTrigger size="sm" className="h-8 flex-1 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {weightOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectGroup>
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
          apply([{ kind: 'set-style', key: 'fontWeight', value: v ? '700' : '400' }])
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
          apply([{ kind: 'set-style', key: 'fontStyle', value: v ? 'italic' : 'normal' }])
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
        onValueChange={(next) => set((Array.isArray(next) ? next[0] : next) ?? v)}
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
        onValueChange={(next) =>
          set((Array.isArray(next) ? next[0] : next) ?? snapshot.letterSpacing)
        }
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
        size="sm"
        variant="outline"
        value={[snapshot.textAlign]}
        onValueChange={(value) => {
          const next = value[0];
          if (!next) return;
          apply([
            {
              kind: 'set-style',
              key: 'textAlign',
              value: next === 'left' ? null : next,
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
      <label className="relative inline-flex size-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border bg-background shadow-xs transition-[border-color,scale] duration-150 hover:border-foreground/20 active:scale-[0.96] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/40">
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
          aria-label={label}
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
        aria-label={label}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          commitHex(e.target.value);
        }}
        className="nums h-8 flex-1 font-mono text-[11px] uppercase"
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

function ImageField({ src, anchor }: { src: string; anchor: HTMLElement }) {
  const t = useLocale();
  const { openCrop, openReplace } = useInspector();
  const isImage = anchor.tagName === 'IMG';
  return (
    <div className="flex flex-col gap-2">
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
            onClick={() => openReplace(anchor)}
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
    <div className="flex flex-col gap-2">
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
          onPick={async (asset, scope) => {
            setOpen(false);
            setSubmitting(true);
            try {
              const assetPath =
                scope === 'global' ? `@assets/${asset.name}` : `./assets/${asset.name}`;
              await applyEdit(line, column, [
                {
                  kind: 'replace-placeholder-with-image',
                  assetPath,
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

function AgentWatchingBadge() {
  const t = useLocale();
  const connected = useAgentSocketConnected();
  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              className="flex shrink-0 cursor-help items-center gap-1.5 rounded-[3px] border border-hairline bg-card px-1.5 py-px text-[10.5px] text-foreground/85 outline-none transition-colors duration-150 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              <span aria-hidden className="relative flex size-1.5 items-center justify-center">
                {connected ? (
                  <>
                    <span className="absolute inline-flex size-full rounded-full bg-emerald-500 opacity-60 motion-safe:animate-ping" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                  </>
                ) : (
                  <span className="relative inline-flex size-1.5 rounded-full bg-rose-500" />
                )}
              </span>
              {connected ? t.inspector.agentWatching : t.inspector.agentNotWatching}
            </button>
          }
        />
        <TooltipContent
          side="bottom"
          align="end"
          className="w-max max-w-[min(520px,calc(100vw-2rem))] text-center leading-relaxed"
        >
          {connected ? t.inspector.agentWatchingTooltip : t.inspector.agentNotWatchingTooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// The cue animation re-mounts with every element selection; without this
// guard it replays each time instead of once per inspector session.
let commentCuePlayed = false;

function CommentsSection({
  selected,
  onAdd,
}: {
  selected: { line: number; column: number };
  onAdd: (line: number, column: number, text: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCue] = useState(() => !commentCuePlayed);
  const wrapRef = useRef<HTMLDivElement>(null);
  const t = useLocale();

  useEffect(() => {
    commentCuePlayed = true;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/') return;
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.altKey || e.shiftKey) return;
      const ta = wrapRef.current?.querySelector('textarea');
      if (!ta) return;
      e.preventDefault();
      const details = ta.closest('details');
      if (details) details.open = true;
      ta.focus({ preventScroll: true });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
    <div className="px-3.5 pb-3.5">
      <div className="flex flex-col gap-2">
        <div ref={wrapRef} className={cn('rounded-[6px]', showCue && 'comment-cue')}>
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
    </div>
  );
}

function readSnapshot(el: HTMLElement): ElementSnapshot {
  const cs = getComputedStyle(el);
  const text =
    el.tagName !== 'IMG' &&
    el.dataset.slidePlaceholder === undefined &&
    hasOnlyInlineTextChildren(el) &&
    (el.textContent?.trim() || /^(H[1-6]|P|SPAN|LABEL|BLOCKQUOTE|LI|PRE|CODE)$/.test(el.tagName))
      ? readEditableText(el)
      : null;
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
    ...readTypography(el),
    backgroundColor: isTransparent(cs.backgroundColor) ? null : rgbToHex(cs.backgroundColor),
    textAlign: normalizeTextAlign(cs.textAlign),
    lineHeight: parseLineHeight(cs.lineHeight, parseFloat(cs.fontSize) || 16),
    letterSpacing: parseLetterSpacing(cs.letterSpacing),
    text,
    imageSrc,
    placeholder,
  };
}

function readTypography(el: HTMLElement) {
  const cs = getComputedStyle(el);
  return {
    fontSize: parseFloat(cs.fontSize) || 16,
    fontWeight: parseInt(cs.fontWeight, 10) || 400,
    fontStyle: cs.fontStyle === 'italic' ? ('italic' as const) : ('normal' as const),
    color: rgbToHex(cs.color) ?? '#000000',
  };
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
