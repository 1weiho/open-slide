import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';
import type { ReactNode } from 'react';
import { Tooltip, TooltipContent } from '@/components/ui/tooltip';

/**
 * Tooltip trigger for a button that also opens a menu. The `ui/tooltip` wrapper
 * is a plain function component, so on React 18 it swallows the ref that
 * `DropdownMenuTrigger` hands to its `render` element and the menu never opens —
 * the primitive forwards it.
 */
export const MenuTooltipTrigger = TooltipPrimitive.Trigger;

/**
 * Shared hover label for the toolbar icon buttons. `children` supplies the
 * `TooltipTrigger`; a button that also opens a menu has to compose it inward
 * (`<DropdownMenuTrigger render={<MenuTooltipTrigger />}>`) — the other nesting
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
  // No local provider — tooltips join the app-level group so adjacent
  // toolbar buttons open instantly once one tooltip is showing.
  return (
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
  );
}
