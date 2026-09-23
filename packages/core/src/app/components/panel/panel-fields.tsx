import { ChevronRight, type LucideIcon, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="px-3.5 py-4">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="eyebrow">{title}</span>
        {action && <span className="-my-1 flex items-center">{action}</span>}
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  );
}

export function CollapsibleSection({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="group/section" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40 [&::-webkit-details-marker]:hidden">
        <span className="eyebrow transition-colors group-hover/section:text-foreground">
          {title}
        </span>
        <ChevronRight
          aria-hidden
          className="size-3 text-muted-foreground transition-transform duration-200 ease-swift group-open/section:rotate-90 motion-reduce:transition-none"
        />
      </summary>
      <div className="-mt-1.5 flex flex-col gap-2.5 px-3.5 pb-4">{children}</div>
    </details>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[68px_1fr] items-center gap-3">
      <Label className="text-[11px] font-normal text-muted-foreground">{label}</Label>
      <div className="flex min-w-0 items-center gap-1.5">{children}</div>
    </div>
  );
}

export function NumberShell({
  icon: Icon,
  prefix,
  suffix,
  label,
  className,
  children,
}: {
  icon?: LucideIcon;
  prefix?: string;
  suffix?: string;
  label?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      title={label}
      className={cn(
        'flex h-7 shrink-0 items-center rounded-[5px] border border-border bg-background pr-1.5 transition-colors focus-within:border-foreground/40 focus-within:ring-2 focus-within:ring-ring/30 has-[:disabled]:opacity-50',
        (Icon || prefix) && 'pl-2',
        className,
      )}
    >
      {Icon && <Icon aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />}
      {prefix && (
        <span aria-hidden className="shrink-0 font-mono text-[10px] text-muted-foreground">
          {prefix}
        </span>
      )}
      {children}
      {suffix && (
        <span className="font-mono text-[9.5px] uppercase tracking-[0.06em] text-muted-foreground/80">
          {suffix}
        </span>
      )}
    </div>
  );
}

export function NumberInput({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type="number"
      className={cn(
        'nums h-full w-12 min-w-0 flex-1 bg-transparent px-2 text-right font-mono text-[11px] outline-none [appearance:textfield] disabled:cursor-not-allowed [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
        className,
      )}
      {...props}
    />
  );
}

export function NumberField({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  icon,
  label,
  className,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  icon?: LucideIcon;
  label?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState(String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setDraft(String(value));
  }, [value]);

  return (
    <NumberShell icon={icon} suffix={suffix} label={label} className={className}>
      <NumberInput
        aria-label={label}
        value={draft}
        onFocus={() => {
          focused.current = true;
        }}
        onBlur={() => {
          focused.current = false;
          setDraft(String(value));
        }}
        onChange={(e) => {
          const raw = e.target.value;
          setDraft(raw);
          const n = Number(raw);
          if (!raw.trim() || !Number.isFinite(n)) return;
          if (min !== undefined && n < min) return;
          if (max !== undefined && n > max) return;
          onChange(n);
        }}
        min={min}
        max={max}
        step={step}
      />
    </NumberShell>
  );
}

export function ColorField({
  label,
  value,
  dim,
  onChange,
  onClear,
}: {
  label: string;
  value: string;
  dim?: boolean;
  onChange: (v: string) => void;
  onClear?: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const t = useLocale();
  useEffect(() => setDraft(value), [value]);

  return (
    <Field label={label}>
      <label className="relative inline-flex size-7 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[5px] border border-border bg-background transition-[border-color,scale] duration-150 hover:border-foreground/20 active:scale-[0.96] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/30">
        <span
          className={cn(
            'size-4 rounded-[3px]',
            dim &&
              'bg-[repeating-conic-gradient(theme(colors.muted)_0_25%,transparent_0_50%)] bg-[length:8px_8px]',
          )}
          style={dim ? undefined : { backgroundColor: value }}
        />
        <input
          type="color"
          aria-label={label}
          value={normalizeHex(value)}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <Input
        type="text"
        aria-label={label}
        value={draft}
        onChange={(e) => {
          const v = e.target.value;
          setDraft(v);
          if (HEX6.test(v)) onChange(v);
        }}
        onBlur={() => {
          if (!HEX6.test(draft)) setDraft(value);
        }}
        className="nums h-7 flex-1 px-2 font-mono text-[11px] uppercase"
        spellCheck={false}
      />
      {onClear && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={onClear}
          aria-label={t.inspector.clearAria}
        >
          <X className="size-3.5" />
        </Button>
      )}
    </Field>
  );
}

const HEX6 = /^#[0-9a-fA-F]{6}$/;

function normalizeHex(value: string): string {
  if (HEX6.test(value)) return value;
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const [, r, g, b] = value;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return '#000000';
}
