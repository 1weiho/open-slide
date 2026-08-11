import type { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

/**
 * Shared hover label for the toolbar icon buttons. `children` supplies the
 * `TooltipTrigger`; a button that also opens a menu has to compose it inward
 * (`<DropdownMenuTrigger render={<TooltipTrigger />}>`) — the other nesting
 * order swallows the trigger ref and the tooltip never opens.
 */
export function IconTooltip({
  label,
  shortcut,
  children,
}: {
  label: string;
  shortcut?: string;
  children: ReactNode;
}) {
  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        {children}
        <TooltipContent side="bottom" sideOffset={6} className="flex items-center gap-1.5">
          {label}
          {shortcut && (
            <kbd className="rounded-[3px] bg-background/18 px-1 py-0.5 font-mono text-[9.5px] tracking-[0.04em] text-background/85">
              {shortcut}
            </kbd>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
