import { ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/lib/use-locale';

export function OgPanelToggleButton({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  const t = useLocale();
  if (import.meta.env.PROD) return null;
  return (
    <Button
      size="sm"
      variant={active ? 'default' : 'ghost'}
      onClick={onToggle}
      aria-label={t.ogPanel.toggleAria}
      title={t.ogPanel.toggleTitle}
    >
      <ImageIcon className="size-3.5" />
      <span className="hidden md:inline">{t.ogPanel.toggle}</span>
      <kbd className="ml-1 hidden rounded-[3px] bg-foreground/10 px-1 font-mono text-[9.5px] tracking-[0.04em] md:inline">
        G
      </kbd>
    </Button>
  );
}
