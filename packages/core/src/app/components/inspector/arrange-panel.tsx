import {
  AlignHorizontalDistributeCenter,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignVerticalDistributeCenter,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  ArrowDown,
  ArrowUp,
  BringToFront,
  CornerLeftUp,
  type LucideIcon,
  Magnet,
  SendToBack,
} from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Field, Section } from '@/components/panel/panel-fields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { canTransform, readCanvas, readFrame, readRotation } from '@/lib/inspector/visual-dom';
import { format, useLocale } from '@/lib/use-locale';
import { round2 } from '@/lib/utils';
import { useInspector } from './inspector-provider';

type Frame = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  editable: boolean;
  shared: boolean;
};

export function ArrangePanel() {
  const { selection, opsVersion, visual, committing } = useInspector();
  const { inspector: t } = useLocale();
  const [frame, setFrame] = useState<Frame | null>(null);
  const [toSlide, setToSlide] = useState(false);
  const multiple = selection.length > 1;
  const alignToSlide = !multiple || toSlide;

  useEffect(() => {
    void opsVersion;
    const update = () => {
      const canvas = readCanvas();
      const anchors = selection
        .map((target) => target.anchor)
        .filter((anchor) => anchor.isConnected);
      if (!canvas || anchors.length === 0) {
        setFrame(null);
        return;
      }
      const frames = anchors.map((anchor) => readFrame(anchor, canvas));
      const x = Math.min(...frames.map((frame) => frame.x));
      const y = Math.min(...frames.map((frame) => frame.y));
      setFrame({
        x,
        y,
        width: Math.max(...frames.map((frame) => frame.x + frame.width)) - x,
        height: Math.max(...frames.map((frame) => frame.y + frame.height)) - y,
        rotation: anchors.length === 1 ? readRotation(anchors[0]) : 0,
        editable: selection.every((target) => canTransform(target, canvas)),
        shared: selection.some(
          (target) =>
            canvas.root.querySelectorAll(`[data-slide-loc="${target.line}:${target.column}"]`)
              .length > 1,
        ),
      });
    };
    update();
    const observer = new ResizeObserver(update);
    for (const target of selection) observer.observe(target.anchor);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [selection, opsVersion]);

  if (!frame) return null;
  const blocked = !frame.editable || committing;

  return (
    <Section title={t.arrangeSection}>
      <TooltipProvider delay={350}>
        {multiple && (
          <p className="text-[11px] text-muted-foreground">
            {format(t.selectionCount, { count: selection.length })}
          </p>
        )}
        {!frame.editable && (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {frame.shared ? t.sharedLayoutHint : t.inlineLayoutHint}
          </p>
        )}
        <Field label={t.positionLabel}>
          <FrameInput
            label="X"
            ariaLabel={t.positionX}
            value={frame.x}
            disabled={blocked}
            onChange={(x) => visual.setFrame({ x })}
          />
          <FrameInput
            label="Y"
            ariaLabel={t.positionY}
            value={frame.y}
            disabled={blocked}
            onChange={(y) => visual.setFrame({ y })}
          />
        </Field>
        <Field label={t.dimensionsLabel}>
          <FrameInput
            label="W"
            ariaLabel={t.widthLabel}
            value={frame.width}
            min={8}
            disabled={multiple || blocked}
            onChange={(width) => visual.setFrame({ width })}
          />
          <FrameInput
            label="H"
            ariaLabel={t.heightLabel}
            value={frame.height}
            min={8}
            disabled={multiple || blocked}
            onChange={(height) => visual.setFrame({ height })}
          />
        </Field>
        <Field label={t.rotationLabel}>
          <FrameInput
            label="°"
            ariaLabel={t.rotationLabel}
            value={frame.rotation}
            disabled={multiple || blocked}
            onChange={(rotation) => visual.setFrame({ rotation })}
          />
        </Field>
        <Field label={t.alignToLabel}>
          <ToggleGroup
            variant="outline"
            size="sm"
            disabled={committing}
            value={[alignToSlide ? 'slide' : 'selection']}
            onValueChange={(value) => {
              if (value.length > 0) setToSlide(value[0] === 'slide');
            }}
            aria-label={t.alignToLabel}
          >
            <ToggleGroupItem value="selection" disabled={!multiple}>
              {t.alignToSelection}
            </ToggleGroupItem>
            <ToggleGroupItem value="slide">{t.alignToSlide}</ToggleGroupItem>
          </ToggleGroup>
        </Field>
        <fieldset className="grid grid-cols-6 gap-1">
          <legend className="sr-only">{t.alignLabel}</legend>
          <ArrangeButton
            label={t.alignLeft}
            icon={AlignHorizontalJustifyStart}
            disabled={blocked}
            onClick={() => visual.align('left', alignToSlide)}
          />
          <ArrangeButton
            label={t.alignCenter}
            icon={AlignHorizontalJustifyCenter}
            disabled={blocked}
            onClick={() => visual.align('center', alignToSlide)}
          />
          <ArrangeButton
            label={t.alignRight}
            icon={AlignHorizontalJustifyEnd}
            disabled={blocked}
            onClick={() => visual.align('right', alignToSlide)}
          />
          <ArrangeButton
            label={t.alignTop}
            icon={AlignVerticalJustifyStart}
            disabled={blocked}
            onClick={() => visual.align('top', alignToSlide)}
          />
          <ArrangeButton
            label={t.alignMiddle}
            icon={AlignVerticalJustifyCenter}
            disabled={blocked}
            onClick={() => visual.align('middle', alignToSlide)}
          />
          <ArrangeButton
            label={t.alignBottom}
            icon={AlignVerticalJustifyEnd}
            disabled={blocked}
            onClick={() => visual.align('bottom', alignToSlide)}
          />
        </fieldset>
        <Field label={t.distributeLabel}>
          <ArrangeButton
            label={t.distributeHorizontal}
            icon={AlignHorizontalDistributeCenter}
            disabled={blocked || selection.length < 3}
            onClick={() => visual.distribute('x')}
          />
          <ArrangeButton
            label={t.distributeVertical}
            icon={AlignVerticalDistributeCenter}
            disabled={blocked || selection.length < 3}
            onClick={() => visual.distribute('y')}
          />
        </Field>
        <Field label={t.layerLabel}>
          <ArrangeButton
            label={t.bringToFront}
            icon={BringToFront}
            disabled={blocked}
            onClick={() => visual.arrange('front')}
          />
          <ArrangeButton
            label={t.bringForward}
            icon={ArrowUp}
            disabled={blocked}
            onClick={() => visual.arrange('forward')}
          />
          <ArrangeButton
            label={t.sendBackward}
            icon={ArrowDown}
            disabled={blocked}
            onClick={() => visual.arrange('backward')}
          />
          <ArrangeButton
            label={t.sendToBack}
            icon={SendToBack}
            disabled={blocked}
            onClick={() => visual.arrange('back')}
          />
        </Field>
        <Field label={t.snappingLabel}>
          <Toggle
            size="sm"
            variant="outline"
            disabled={committing}
            pressed={visual.snapping}
            onPressedChange={visual.setSnapping}
            aria-label={t.smartGuides}
          >
            <Magnet data-icon="inline-start" />
            {t.smartGuides}
          </Toggle>
        </Field>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="xs"
            disabled={multiple || committing}
            onClick={visual.selectParent}
          >
            <CornerLeftUp data-icon="inline-start" />
            {t.selectParent}
          </Button>
          <Button variant="ghost" size="xs" disabled={committing} onClick={visual.selectAll}>
            {t.selectAll}
          </Button>
        </div>
        <p className="text-[10px] leading-relaxed text-muted-foreground">{t.visualEditorHint}</p>
      </TooltipProvider>
    </Section>
  );
}

function ArrangeButton({
  label,
  icon: Icon,
  onClick,
  disabled = false,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            className="w-auto min-w-0 flex-1"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
          />
        }
      >
        <Icon data-icon="inline-start" />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function FrameInput({
  label,
  ariaLabel,
  value,
  onChange,
  min,
  disabled = false,
}: {
  label: string;
  ariaLabel: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(String(round2(value)));
  const id = useId();
  const focused = useRef(false);
  const cancelled = useRef(false);
  const edit = useRef({ value, onChange });

  useEffect(() => {
    if (!focused.current) setDraft(String(round2(value)));
  }, [value]);

  return (
    <label htmlFor={id} className="flex min-w-0 flex-1 items-center gap-1">
      <span aria-hidden className="font-mono text-[10px] text-muted-foreground">
        {label}
      </span>
      <Input
        id={id}
        type="number"
        className="h-7 px-1.5"
        aria-label={ariaLabel}
        value={draft}
        min={min}
        step={1}
        disabled={disabled}
        onFocus={() => {
          focused.current = true;
          cancelled.current = false;
          edit.current = { value, onChange };
        }}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          focused.current = false;
          const next = Number(draft);
          if (
            !disabled &&
            !cancelled.current &&
            draft.trim() &&
            Number.isFinite(next) &&
            next !== round2(edit.current.value)
          ) {
            const clamped = min === undefined ? next : Math.max(min, next);
            edit.current.onChange(clamped);
          }
          setDraft(String(round2(value)));
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
          if (event.key === 'Escape') {
            event.stopPropagation();
            cancelled.current = true;
            event.currentTarget.blur();
          }
        }}
      />
    </label>
  );
}
