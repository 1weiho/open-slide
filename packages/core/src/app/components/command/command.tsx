import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import type * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn('flex h-full w-full flex-col overflow-hidden', className)}
      {...props}
    />
  );
}

function CommandDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        // ⌘K fires dozens of times a day — opacity-only and fast, no scale
        // theater on a keyboard-triggered surface.
        className="top-[14vh] translate-y-0 gap-0 overflow-hidden p-0 duration-100 data-starting-style:scale-100 data-ending-style:scale-100 sm:max-w-[560px]"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  );
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className="flex items-center gap-2 border-b border-hairline px-3">
      <Search className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          'h-11 w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/70 disabled:opacity-50',
          className,
        )}
        {...props}
      />
    </div>
  );
}

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        'max-h-[min(56vh,380px)] scroll-py-1 overflow-y-auto overscroll-contain p-1',
        className,
      )}
      {...props}
    />
  );
}

function CommandEmpty({ ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="px-3 py-10 text-center text-[12.5px] text-muted-foreground"
      {...props}
    />
  );
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        'overflow-hidden pt-1.5 pb-1 [&:not(:first-child)]:mt-1 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-hairline',
        '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-1 [&_[cmdk-group-heading]]:pb-1.5',
        '[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-muted-foreground/70',
        className,
      )}
      {...props}
    />
  );
}

function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        'relative flex cursor-default select-none items-center gap-2 rounded-[5px] px-2 py-1.5 text-[12.5px] outline-none',
        'data-[selected=true]:bg-muted data-[selected=true]:text-foreground active:bg-muted/80',
        'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-45',
        "[&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:text-muted-foreground [&_svg:not([class*='opacity'])]:opacity-80",
        className,
      )}
      {...props}
    />
  );
}

function CommandShortcut({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      data-slot="command-shortcut"
      className={cn(
        'ml-auto shrink-0 rounded-[3px] bg-muted px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.04em] text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
};
