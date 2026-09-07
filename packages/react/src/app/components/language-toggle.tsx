import { Languages } from 'lucide-react';
import { IconTooltip, MenuTooltipTrigger } from '@/components/icon-tooltip';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LOCALE_OPTIONS, setLocale } from '@/lib/locale-store';
import { useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';

export function LanguageToggle() {
  const t = useLocale();

  return (
    <DropdownMenu>
      <IconTooltip label={t.languageToggle.title}>
        <DropdownMenuTrigger
          render={
            <MenuTooltipTrigger
              type="button"
              aria-label={t.languageToggle.toggleAria}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
            />
          }
        >
          <Languages className="size-3.5" />
        </DropdownMenuTrigger>
      </IconTooltip>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {LOCALE_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => setLocale(option.id)}
            data-active={t.id === option.id}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
