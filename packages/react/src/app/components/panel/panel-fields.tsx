import { Label } from '@/components/ui/label';

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-3.5 py-3.5">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="eyebrow">{title}</span>
        <span aria-hidden className="h-px flex-1 bg-hairline" />
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
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
    <div className="flex h-7 shrink-0 items-center rounded-[5px] border border-border bg-background pr-1.5 transition-colors focus-within:border-foreground/40 focus-within:ring-2 focus-within:ring-ring/30">
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
        className="nums h-full w-12 bg-transparent px-2 text-right font-mono text-[11px] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {suffix && (
        <span className="font-mono text-[9.5px] uppercase tracking-[0.06em] text-muted-foreground/80">
          {suffix}
        </span>
      )}
    </div>
  );
}
