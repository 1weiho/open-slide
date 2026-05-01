import { Label } from '@/components/ui/label';

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-4 py-3.5">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {title}
        </span>
        <span aria-hidden className="h-px flex-1 bg-border/70" />
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[76px_1fr] items-center gap-3">
      <Label className="truncate text-[11px] font-medium text-muted-foreground">{label}</Label>
      <div className="flex min-w-0 items-center gap-1.5">{children}</div>
    </div>
  );
}

export function NumberField({
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
