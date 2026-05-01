import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

/*
 * Editorial button. Tight square-ish radius, hairline borders instead of
 * shadcn's default ring/shadow stack. The default variant is the strongest
 * affordance — solid ink with subtle inner highlight on hover so the press
 * feels physical without glow.
 */
const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center",
    "rounded-[6px] text-[13px] font-medium whitespace-nowrap select-none",
    "outline-none transition-[background-color,color,border-color,box-shadow,transform] duration-100",
    "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
    "active:not-aria-[haspopup]:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-45",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/30",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'bg-foreground text-background',
          'shadow-[inset_0_1px_0_oklch(1_0_0/0.12),0_1px_0_oklch(0_0_0/0.12)]',
          'hover:bg-foreground/90',
          'aria-expanded:bg-foreground/85',
        ].join(' '),
        brand: [
          'bg-brand text-brand-foreground',
          'shadow-[inset_0_1px_0_oklch(1_0_0/0.18),0_1px_0_oklch(0_0_0/0.16)]',
          'hover:brightness-105 active:brightness-95',
        ].join(' '),
        outline: [
          'border border-border bg-card text-foreground',
          'hover:bg-muted/60 hover:border-foreground/20',
          'aria-expanded:bg-muted aria-expanded:border-foreground/25',
          'data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:border-foreground',
        ].join(' '),
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary/90',
        ghost: [
          'text-foreground/75 hover:text-foreground hover:bg-muted',
          'aria-expanded:bg-muted aria-expanded:text-foreground',
        ].join(' '),
        destructive: [
          'bg-destructive text-white',
          'shadow-[inset_0_1px_0_oklch(1_0_0/0.16),0_1px_0_oklch(0_0_0/0.12)]',
          'hover:brightness-105 active:brightness-95',
          'focus-visible:ring-destructive/35',
        ].join(' '),
        link: 'text-foreground underline decoration-foreground/30 decoration-1 underline-offset-[3px] hover:decoration-foreground/70 [&_svg]:hidden',
      },
      size: {
        default: 'h-8 gap-1.5 px-3',
        xs: 'h-6 gap-1 rounded-[5px] px-2 text-[11.5px]',
        sm: 'h-7 gap-1.5 rounded-[5px] px-2.5 text-[12px]',
        lg: 'h-9 gap-1.5 px-3.5 text-[13.5px]',
        icon: 'size-8',
        'icon-xs': 'size-6 rounded-[5px]',
        'icon-sm': 'size-7 rounded-[5px]',
        'icon-lg': 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
