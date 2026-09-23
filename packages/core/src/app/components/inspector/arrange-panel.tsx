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
  CircleHelp,
  CornerLeftUp,
  type LucideIcon,
  Magnet,
  RotateCw,
  SendToBack,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NumberInput, NumberShell, Section } from '@/components/panel/panel-fields';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { canTransform, readCanvas, readFrame, readRotation } from '@/lib/inspector/visual-dom';
import { useLocale } from '@/lib/use-locale';
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
    <TooltipProvider delay={350}>
      <Section
        title={t.positionLabel}
        action={
          <div className="flex items-center gap-0.5">
            <HeaderButton
              label={t.selectParent}
              icon={CornerLeftUp}
              disabled={multiple || committing}
              onClick={visual.selectParent}
            />
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="cursor-help text-muted-foreground hover:text-foreground"
                    aria-label={t.visualEditorHint}
                  />
                }
              >
                <CircleHelp />
              </TooltipTrigger>
              <TooltipContent side="bottom" align="end" className="max-w-64 leading-relaxed">
                {t.visualEditorHint}
              </TooltipContent>
            </Tooltip>
          </div>
        }
      >
        {!frame.editable && (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {frame.shared ? t.sharedLayoutHint : t.inlineLayoutHint}
          </p>
        )}
        <div className="grid grid-cols-2 gap-1.5">
          <FrameInput
            prefix="X"
            label={t.positionX}
            value={frame.x}
            disabled={blocked}
            onChange={(x) => visual.setFrame({ x })}
          />
          <FrameInput
            prefix="Y"
            label={t.positionY}
            value={frame.y}
            disabled={blocked}
            onChange={(y) => visual.setFrame({ y })}
          />
          <FrameInput
            prefix="W"
            label={t.widthLabel}
            value={frame.width}
            min={8}
            disabled={multiple || blocked}
            onChange={(width) => visual.setFrame({ width })}
          />
          <FrameInput
            prefix="H"
            label={t.heightLabel}
            value={frame.height}
            min={8}
            disabled={multiple || blocked}
            onChange={(height) => visual.setFrame({ height })}
          />
          <FrameInput
            icon={RotateCw}
            suffix="°"
            label={t.rotationLabel}
            value={frame.rotation}
            disabled={multiple || blocked}
            onChange={(rotation) => visual.setFrame({ rotation })}
          />
        </div>
      </Section>

      <Section
        title={t.alignLabel}
        action={
          <Tooltip>
            <TooltipTrigger
              render={
                <Toggle
                  size="sm"
                  disabled={committing}
                  pressed={visual.snapping}
                  onPressedChange={visual.setSnapping}
                  aria-label={t.smartGuides}
                  className="size-6 min-w-6 rounded-[5px] px-0 text-muted-foreground/60 hover:bg-transparent hover:text-foreground data-pressed:bg-muted data-pressed:text-foreground"
                />
              }
            >
              <Magnet />
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end">
              {t.smartGuides}
            </TooltipContent>
          </Tooltip>
        }
      >
        {multiple && (
          <ToggleGroup
            size="sm"
            variant="outline"
            disabled={committing}
            value={[alignToSlide ? 'slide' : 'selection']}
            onValueChange={(value) => {
              if (value.length > 0) setToSlide(value[0] === 'slide');
            }}
            aria-label={t.alignToLabel}
            className="w-full"
          >
            <ToggleGroupItem value="selection" className="flex-1">
              {t.alignToSelection}
            </ToggleGroupItem>
            <ToggleGroupItem value="slide" className="flex-1">
              {t.alignToSlide}
            </ToggleGroupItem>
          </ToggleGroup>
        )}
        <div className="flex items-center gap-2">
          <ButtonGroup label={t.alignLabel}>
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
          </ButtonGroup>
          <ButtonGroup label={t.alignLabel}>
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
          </ButtonGroup>
          {multiple && (
            <ButtonGroup label={t.distributeLabel}>
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
            </ButtonGroup>
          )}
        </div>
      </Section>

      <Section title={t.layerLabel}>
        <ButtonGroup label={t.layerLabel}>
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
        </ButtonGroup>
      </Section>
    </TooltipProvider>
  );
}

function ButtonGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset
      aria-label={label}
      className="flex min-w-0 [&>button]:relative [&>button]:rounded-none [&>button+button]:-ml-px [&>button:first-child]:rounded-l-[5px] [&>button:last-child]:rounded-r-[5px] [&>button:focus-visible]:z-10 [&>button:hover]:z-10"
    >
      {children}
    </fieldset>
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
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
          />
        }
      >
        <Icon />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function HeaderButton({
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
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
          />
        }
      >
        <Icon />
      </TooltipTrigger>
      <TooltipContent side="bottom" align="end">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function FrameInput({
  prefix,
  icon,
  suffix,
  label,
  value,
  onChange,
  min,
  disabled = false,
}: {
  prefix?: string;
  icon?: LucideIcon;
  suffix?: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(String(round2(value)));
  const focused = useRef(false);
  const cancelled = useRef(false);
  const edit = useRef({ value, onChange });

  useEffect(() => {
    if (!focused.current) setDraft(String(round2(value)));
  }, [value]);

  return (
    <NumberShell prefix={prefix} icon={icon} suffix={suffix} label={label}>
      <NumberInput
        aria-label={label}
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
    </NumberShell>
  );
}
