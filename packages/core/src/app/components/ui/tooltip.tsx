import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider({
  delay = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delay={delay} {...props} />
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  side,
  sideOffset = 0,
  align,
  alignOffset,
  collisionPadding,
  children,
  container,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Popup> &
  Pick<
    React.ComponentProps<typeof TooltipPrimitive.Positioner>,
    "side" | "sideOffset" | "align" | "alignOffset" | "collisionPadding"
  > & {
    container?: React.ComponentProps<typeof TooltipPrimitive.Portal>["container"]
  }) {
  return (
    <TooltipPrimitive.Portal container={container}>
      <TooltipPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        collisionPadding={collisionPadding}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "w-fit origin-(--transform-origin) rounded-md bg-foreground px-3 py-1.5 text-xs text-balance text-background transition-[transform,scale,opacity] data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 data-[instant]:duration-0",
            className
          )}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground" />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
