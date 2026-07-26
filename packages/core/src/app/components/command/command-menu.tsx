import { Check, Languages, Loader2, Monitor, Moon, RotateCw, Search, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { IconTooltip } from '@/components/icon-tooltip';
import { buttonVariants } from '@/components/ui/button';
import { TooltipTrigger } from '@/components/ui/tooltip';
import { LOCALE_OPTIONS, setLocale } from '@/lib/locale-store';
import { format, useLocale } from '@/lib/use-locale';
import { useRestartServer } from '@/lib/use-restart-server';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from './command';

export type CommandSpec = {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Extra match terms — ASCII aliases keep commands findable under any locale. */
  keywords?: string[];
  shortcut?: string;
  disabled?: boolean;
  active?: boolean;
  run: () => void | Promise<void>;
};

export type CommandGroupSpec = {
  id: string;
  heading: string;
  items: CommandSpec[];
  /** Long lists (deck pages) only surface once the user types, so the idle menu stays scannable. */
  searchOnly?: boolean;
};

export function CommandMenu({
  open,
  onOpenChange,
  groups,
  placeholder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: CommandGroupSpec[];
  placeholder: string;
}) {
  const t = useLocale();
  const [search, setSearch] = useState('');
  const sharedGroups = useSharedCommandGroups();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'k' && event.key !== 'K') return;
      if (!event.metaKey && !event.ctrlKey) return;
      // Auto-repeat while the combo is held would toggle the menu shut again.
      if (event.repeat) return;
      event.preventDefault();
      onOpenChange(!open);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const searching = search.trim().length > 0;
  const visibleGroups = [...groups, ...sharedGroups].filter(
    (group) => group.items.length > 0 && (searching || !group.searchOnly),
  );

  const run = (item: CommandSpec) => {
    if (item.disabled) return;
    // Close first: exports, fullscreen and panels all expect an unobstructed page.
    onOpenChange(false);
    void item.run();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t.commandMenu.trigger}
      description={placeholder}
    >
      <Command label={t.commandMenu.trigger} loop>
        <CommandInput value={search} onValueChange={setSearch} placeholder={placeholder} />
        <CommandList>
          <CommandEmpty>{t.commandMenu.empty}</CommandEmpty>
          {visibleGroups.map((group) => (
            <CommandGroup key={group.id} heading={group.heading}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  keywords={[item.label, ...(item.keywords ?? [])]}
                  disabled={item.disabled}
                  onSelect={() => run(item)}
                >
                  {item.icon}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.active && <Check className="ml-auto opacity-100 text-brand" aria-hidden />}
                  {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
        <CommandFooter />
      </Command>
    </CommandDialog>
  );
}

const IS_APPLE =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

export const COMMAND_MENU_SHORTCUT = IS_APPLE ? '⌘K' : 'Ctrl K';

export function CommandMenuTrigger({ onClick }: { onClick: () => void }) {
  const t = useLocale();
  return (
    <IconTooltip label={t.commandMenu.triggerTooltip} shortcut={COMMAND_MENU_SHORTCUT}>
      <TooltipTrigger
        type="button"
        onClick={onClick}
        aria-label={t.commandMenu.triggerAria}
        aria-haspopup="dialog"
        className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
      >
        <Search className="size-3.5" />
      </TooltipTrigger>
    </IconTooltip>
  );
}

function CommandFooter() {
  const t = useLocale();
  return (
    <div className="flex items-center justify-between gap-3 border-t border-hairline bg-muted/30 px-3 py-2 text-[10.5px] text-muted-foreground">
      <Hint keys="esc" label={t.commandMenu.hintClose} />
      <span className="inline-flex items-center gap-3">
        <Hint keys="↑↓" label={t.commandMenu.hintNavigate} />
        <Hint keys="↵" label={t.commandMenu.hintSelect} />
      </span>
    </div>
  );
}

function Hint({ keys, label }: { keys: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <kbd className="rounded-[3px] border border-hairline bg-card px-1 py-0.5 font-mono text-[9.5px] leading-none">
        {keys}
      </kbd>
      {label}
    </span>
  );
}

function useSharedCommandGroups(): CommandGroupSpec[] {
  const t = useLocale();
  const { theme, setTheme } = useTheme();
  const { canRestart, restarting, restartServer } = useRestartServer();

  return useMemo(() => {
    const appearance: CommandSpec[] = [
      {
        id: 'theme-light',
        label: format(t.commandMenu.themeItem, { name: t.themeToggle.light }),
        icon: <Sun />,
        keywords: ['theme', 'light', 'appearance'],
        active: theme === 'light',
        run: () => setTheme('light'),
      },
      {
        id: 'theme-dark',
        label: format(t.commandMenu.themeItem, { name: t.themeToggle.dark }),
        icon: <Moon />,
        keywords: ['theme', 'dark', 'appearance'],
        active: theme === 'dark',
        run: () => setTheme('dark'),
      },
      {
        id: 'theme-system',
        label: format(t.commandMenu.themeItem, { name: t.themeToggle.system }),
        icon: <Monitor />,
        keywords: ['theme', 'system', 'appearance'],
        active: theme === 'system',
        run: () => setTheme('system'),
      },
      ...LOCALE_OPTIONS.map((option) => ({
        id: `locale-${option.id}`,
        label: format(t.commandMenu.languageItem, { name: option.label }),
        icon: <Languages />,
        keywords: ['language', 'locale', option.id],
        active: t.id === option.id,
        run: () => setLocale(option.id),
      })),
    ];

    const developer: CommandSpec[] =
      import.meta.env.DEV && canRestart
        ? [
            {
              id: 'restart-dev-server',
              label: restarting ? t.home.restartingServer : t.home.restartServer,
              icon: restarting ? <Loader2 className="animate-spin" /> : <RotateCw />,
              keywords: ['restart', 'dev', 'server', 'reload'],
              disabled: restarting,
              run: restartServer,
            },
          ]
        : [];

    return [
      { id: 'appearance', heading: t.commandMenu.groupAppearance, items: appearance },
      { id: 'developer', heading: t.commandMenu.groupDeveloper, items: developer },
    ];
  }, [t, theme, setTheme, canRestart, restarting, restartServer]);
}
