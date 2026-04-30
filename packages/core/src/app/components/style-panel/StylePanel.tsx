import { Palette, RotateCcw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Slider } from '../ui/slider';
import { useDesignPanelState } from './DesignProvider';

const PANEL_W = 340;
const PANEL_TRANSITION_MS = 280;

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
  const { slideId, draft, exists, warning, loaded, dirty, update, resetToDefaults } =
    useDesignPanelState();
  const [animVisible, setAnimVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Stay mounted through the close-out width transition so the panel
  // visibly collapses instead of vanishing.
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    setAnimVisible(false);
    const t = setTimeout(() => setMounted(false), PANEL_TRANSITION_MS);
    return () => clearTimeout(t);
  }, [open]);

  // Defer the width expansion to the next frame so the browser paints once
  // at width=0 first; otherwise the transition has no starting frame.
  useEffect(() => {
    if (!open || !mounted) return;
    const id = requestAnimationFrame(() => setAnimVisible(true));
    return () => cancelAnimationFrame(id);
  }, [open, mounted]);

  if (!loaded) return null;
  if (!mounted) return null;
  if (!draft) return null;

  return (
    <aside
      data-design-ui
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
            <Palette className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold tracking-tight">Design</span>
            {!exists && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                not added
              </span>
            )}
            {dirty && <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />}
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
        </header>

        {warning && (
          <div className="border-b bg-amber-50 px-3 py-2 text-[11px] text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            {warning}
          </div>
        )}

        <ScrollArea className="flex flex-1 flex-col">
          <div className="flex min-h-full flex-col">
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
          </div>
        </ScrollArea>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t bg-card px-3 py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetToDefaults}
            className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3" />
            Reset
          </Button>
          <span className="text-[10px] text-muted-foreground">slides/{slideId}/index.tsx</span>
        </div>
      </div>
    </aside>
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
