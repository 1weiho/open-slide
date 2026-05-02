import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useLocale();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label={t.themeToggle.toggleAria}
        title={t.themeToggle.title}
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), 'relative')}
      >
        <Sun className="size-3.5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute size-3.5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem
          onSelect={() => setTheme('light')}
          data-active={mounted && theme === 'light'}
        >
          <Sun />
          {t.themeToggle.light}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => setTheme('dark')}
          data-active={mounted && theme === 'dark'}
        >
          <Moon />
          {t.themeToggle.dark}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => setTheme('system')}
          data-active={mounted && theme === 'system'}
        >
          <Monitor />
          {t.themeToggle.system}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
