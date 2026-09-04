import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { IconTooltip, MenuTooltipTrigger } from '@/components/icon-tooltip';
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
      <IconTooltip label={t.themeToggle.title}>
        <DropdownMenuTrigger
          render={
            <MenuTooltipTrigger
              type="button"
              aria-label={t.themeToggle.toggleAria}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), 'relative')}
            />
          }
        >
          <Sun className="size-3.5 scale-100 rotate-0 opacity-100 ease-swift motion-safe:transition-[opacity,scale,rotate] motion-safe:duration-200 dark:scale-75 dark:-rotate-90 dark:opacity-0" />
          <Moon className="absolute size-3.5 scale-75 rotate-90 opacity-0 ease-swift motion-safe:transition-[opacity,scale,rotate] motion-safe:duration-200 dark:scale-100 dark:rotate-0 dark:opacity-100" />
        </DropdownMenuTrigger>
      </IconTooltip>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          data-active={mounted && theme === 'light'}
        >
          <Sun />
          {t.themeToggle.light}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          data-active={mounted && theme === 'dark'}
        >
          <Moon />
          {t.themeToggle.dark}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          data-active={mounted && theme === 'system'}
        >
          <Monitor />
          {t.themeToggle.system}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
