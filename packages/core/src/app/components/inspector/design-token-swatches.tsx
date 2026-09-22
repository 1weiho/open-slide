import { type DesignPalette, paletteTokenVar } from '@/lib/design';
import { format, useLocale } from '@/lib/use-locale';

const PALETTE_TOKENS = ['bg', 'text', 'accent'] as const;

export function DesignTokenSwatches({
  palette,
  pendingValue,
  onPick,
}: {
  palette: DesignPalette;
  pendingValue?: string | null;
  onPick: (value: string) => void;
}) {
  const t = useLocale();
  const labels: Record<keyof DesignPalette, string> = {
    bg: t.stylePanel.backgroundLabel,
    text: t.stylePanel.textLabel,
    accent: t.stylePanel.accentLabel,
  };

  return (
    <div className="grid grid-cols-[68px_1fr] items-center gap-3">
      <span aria-hidden />
      <div className="flex items-center gap-1.5">
        {PALETTE_TOKENS.map((token) => {
          const tokenVar = paletteTokenVar(token);
          const label = format(t.inspector.designTokenSwatchAria, { name: labels[token] });
          return (
            <button
              key={token}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={pendingValue === tokenVar}
              onClick={() => onPick(tokenVar)}
              className="size-5 cursor-pointer rounded-[3px] border border-border transition-[scale,box-shadow] duration-150 hover:border-foreground/20 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 aria-pressed:ring-2 aria-pressed:ring-foreground/70 aria-pressed:ring-offset-1 aria-pressed:ring-offset-background"
              style={{ backgroundColor: palette[token] }}
            />
          );
        })}
      </div>
    </div>
  );
}
