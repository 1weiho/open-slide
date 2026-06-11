import { Languages } from 'lucide-react';
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
      <DropdownMenuTrigger
        type="button"
        aria-label={t.languageToggle.toggleAria}
        title={t.languageToggle.title}
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
      >
        <Languages className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {LOCALE_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onSelect={() => setLocale(option.id)}
            data-active={t.id === option.id}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
