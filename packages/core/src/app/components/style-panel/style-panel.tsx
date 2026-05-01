import { Palette, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Field, NumberField, Section } from '@/components/panel/panel-fields';
import { PanelShell, usePanelMount } from '@/components/panel/panel-shell';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Slider } from '../ui/slider';
import { useDesignPanelState } from './design-provider';

const FONT_PRESETS: Array<{ label: string; value: string }> = [
  {
    label: 'System sans',
    value: '-apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif',
  },
  { label: 'Inter', value: '"Inter", system-ui, sans-serif' },
  { label: 'Helvetica', value: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Times', value: '"Times New Roman", Times, serif' },
  { label: 'SF Mono', value: '"SF Mono", "JetBrains Mono", Menlo, monospace' },
];

type DesignPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function DesignPanel({ open, onClose }: DesignPanelProps) {
  const { draft, exists, warning, loaded, dirty, update } = useDesignPanelState();
  const { mounted, animVisible } = usePanelMount(open);

  if (!loaded) return null;
  if (!mounted) return null;
  if (!draft) return null;

  return (
    <PanelShell
      uiAttr="design"
      animVisible={animVisible}
      header={
        <>
          <div className="flex min-w-0 items-center gap-2">
            <Palette className="size-3.5 text-muted-foreground" />
            <span className="font-heading text-[12px] font-semibold tracking-tight">
              Design tokens
            </span>
            {!exists && (
              <span className="rounded-[3px] border border-hairline bg-muted/60 px-1.5 py-px font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted-foreground">
                draft
              </span>
            )}
            {dirty && (
              <span className="size-1.5 rounded-full bg-brand" title="Unsaved" aria-hidden />
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={onClose}
            aria-label="Close design panel"
          >
            <X className="size-3.5" />
          </Button>
        </>
      }
      banner={
        warning && (
          <div className="flex gap-2 border-b border-hairline bg-[oklch(0.97_0.04_85)] px-3 py-2 text-[11px] leading-relaxed text-[oklch(0.35_0.08_45)] dark:bg-[oklch(0.25_0.04_60)] dark:text-[oklch(0.85_0.08_85)]">
            <span aria-hidden className="mt-0.5 size-1.5 shrink-0 rounded-full bg-brand" />
            <span>{warning}</span>
          </div>
        )
      }
    >
      <Section title="Colors">
        <ColorField
          label="Background"
          value={draft.palette.bg}
          onChange={(v) =>
            update((d) => {
              d.palette.bg = v;
            }, 'design:palette.bg')
          }
        />
        <ColorField
          label="Text"
          value={draft.palette.text}
          onChange={(v) =>
            update((d) => {
              d.palette.text = v;
            }, 'design:palette.text')
          }
        />
        <ColorField
          label="Accent"
          value={draft.palette.accent}
          onChange={(v) =>
            update((d) => {
              d.palette.accent = v;
            }, 'design:palette.accent')
          }
        />
      </Section>

      <Separator />

      <Section title="Typography">
        <FontField
          label="Display"
          value={draft.fonts.display}
          onChange={(v) =>
            update((d) => {
              d.fonts.display = v;
            }, 'design:fonts.display')
          }
        />
        <FontField
          label="Body"
          value={draft.fonts.body}
          onChange={(v) =>
            update((d) => {
              d.fonts.body = v;
            }, 'design:fonts.body')
          }
        />
        <SliderField
          label="Hero"
          value={draft.typeScale.hero}
          min={48}
          max={240}
          step={2}
          suffix="px"
          onChange={(n) =>
            update((d) => {
              d.typeScale.hero = n;
            }, 'design:typeScale.hero')
          }
        />
        <SliderField
          label="Body"
          value={draft.typeScale.body}
          min={16}
          max={72}
          step={1}
          suffix="px"
          onChange={(n) =>
            update((d) => {
              d.typeScale.body = n;
            }, 'design:typeScale.body')
          }
        />
      </Section>

      <Separator />

      <Section title="Shape">
        <SliderField
          label="Radius"
          value={draft.radius.md}
          min={0}
          max={80}
          step={1}
          suffix="px"
          onChange={(n) =>
            update((d) => {
              d.radius.md = n;
            }, 'design:radius.md')
          }
        />
      </Section>
    </PanelShell>
  );
}

export function DesignToggleButton({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  if (import.meta.env.PROD) return null;
  return (
    <Button
      size="sm"
      variant={active ? 'default' : 'ghost'}
      onClick={onToggle}
      data-design-ui
      title="Design tokens"
    >
      <Palette className="size-3.5" />
      <span className="hidden md:inline">Design</span>
    </Button>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [hexDraft, setHexDraft] = useState(value);
  useEffect(() => setHexDraft(value), [value]);

  return (
    <Field label={label}>
      <label className="relative inline-flex size-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border bg-background shadow-xs">
        <span className="size-5 rounded-sm" style={{ backgroundColor: value }} />
        <input
          type="color"
          value={normalizeHex(value)}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <Input
        type="text"
        value={hexDraft}
        onChange={(e) => {
          const v = e.target.value;
          setHexDraft(v);
          if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v);
        }}
        onBlur={() => {
          if (!/^#[0-9a-fA-F]{6}$/.test(hexDraft)) setHexDraft(value);
        }}
        className="h-8 flex-1 font-mono text-[11px] uppercase"
        spellCheck={false}
      />
    </Field>
  );
}

function FontField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const matched = FONT_PRESETS.find((p) => p.value === value);
  return (
    <Field label={label}>
      <Select
        value={matched ? matched.value : '__custom__'}
        onValueChange={(v) => {
          if (v !== '__custom__') onChange(v);
        }}
      >
        <SelectTrigger size="sm" className="h-8 flex-1 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONT_PRESETS.map((p) => (
            <SelectItem key={p.label} value={p.value} className="text-xs">
              {p.label}
            </SelectItem>
          ))}
          {!matched && (
            <SelectItem value="__custom__" className="text-xs">
              Custom…
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </Field>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (n: number) => void;
}) {
  return (
    <Field label={label}>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v ?? value)}
        className="flex-1"
      />
      <NumberField
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        suffix={suffix}
      />
    </Field>
  );
}

function normalizeHex(value: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const r = value[1];
    const g = value[2];
    const b = value[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return '#000000';
}
