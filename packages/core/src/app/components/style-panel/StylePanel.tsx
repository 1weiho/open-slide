import { Palette, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Field, NumberField, Section } from '@/components/panel/PanelFields';
import { PanelShell, usePanelMount } from '@/components/panel/PanelShell';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Slider } from '../ui/slider';
import { useDesignPanelState } from './DesignProvider';

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
            <span className="flex size-6 items-center justify-center rounded-md bg-muted/70 text-foreground/80">
              <Palette className="size-3.5" />
            </span>
            <span className="text-[13px] font-semibold tracking-tight">Design</span>
            {!exists && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                not added
              </span>
            )}
            {dirty && (
              <span
                className="size-1.5 animate-pulse rounded-full bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.18)]"
                aria-hidden
              />
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={onClose}
            aria-label="Close design panel"
          >
            <X className="size-3.5" />
          </Button>
        </>
      }
      banner={
        warning && (
          <div className="border-b bg-amber-50 px-3 py-2 text-[11px] text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            {warning}
          </div>
        )
      }
    >
      <PalettePreview
        bg={draft.palette.bg}
        text={draft.palette.text}
        accent={draft.palette.accent}
        font={draft.fonts.display}
      />

      <Section title="Colors">
        <ColorField
          label="Background"
          value={draft.palette.bg}
          onChange={(v) =>
            update((d) => {
              d.palette.bg = v;
            })
          }
        />
        <ColorField
          label="Text"
          value={draft.palette.text}
          onChange={(v) =>
            update((d) => {
              d.palette.text = v;
            })
          }
        />
        <ColorField
          label="Accent"
          value={draft.palette.accent}
          onChange={(v) =>
            update((d) => {
              d.palette.accent = v;
            })
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
            })
          }
        />
        <FontField
          label="Body"
          value={draft.fonts.body}
          onChange={(v) =>
            update((d) => {
              d.fonts.body = v;
            })
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
            })
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
            })
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
            })
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
    <Button size="sm" variant={active ? 'default' : 'outline'} onClick={onToggle} data-design-ui>
      <Palette className="size-4" />
      Design
    </Button>
  );
}

function PalettePreview({
  bg,
  text,
  accent,
  font,
}: {
  bg: string;
  text: string;
  accent: string;
  font: string;
}) {
  return (
    <div className="px-4 pt-4">
      <div
        className="relative overflow-hidden rounded-lg border shadow-sm"
        style={{ backgroundColor: bg }}
      >
        <div className="flex items-center justify-between gap-3 px-3.5 py-3">
          <div className="min-w-0">
            <div
              className="truncate text-[15px] font-semibold leading-tight tracking-tight"
              style={{ color: text, fontFamily: font }}
            >
              Aa Display
            </div>
            <div
              className="mt-0.5 text-[10px] leading-snug opacity-70"
              style={{ color: text, fontFamily: font }}
            >
              The quick brown fox
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span
              className="size-5 rounded-full ring-1 ring-black/10"
              style={{ backgroundColor: bg }}
              aria-label="Background"
            />
            <span
              className="size-5 rounded-full ring-1 ring-black/10"
              style={{ backgroundColor: text }}
              aria-label="Text"
            />
            <span
              className="size-5 rounded-full ring-1 ring-black/10"
              style={{ backgroundColor: accent }}
              aria-label="Accent"
            />
          </div>
        </div>
      </div>
    </div>
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
