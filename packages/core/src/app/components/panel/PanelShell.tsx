import { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

export const PANEL_W = 340;
export const PANEL_TRANSITION_MS = 280;

// Defer the width expansion to the next frame so the browser paints once
// at width=0 first; otherwise the transition has no starting frame.
export function useAnimatedOpen(open: boolean): boolean {
  const [animVisible, setAnimVisible] = useState(false);
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setAnimVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setAnimVisible(false);
  }, [open]);
  return animVisible;
}

// Stay mounted through the close-out width transition so the panel
// visibly collapses instead of vanishing.
export function usePanelMount(open: boolean): { mounted: boolean; animVisible: boolean } {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const t = setTimeout(() => setMounted(false), PANEL_TRANSITION_MS);
    return () => clearTimeout(t);
  }, [open]);
  const animVisible = useAnimatedOpen(open && mounted);
  return { mounted, animVisible };
}

type PanelShellProps = {
  animVisible: boolean;
  uiAttr: 'inspector' | 'design';
  header: React.ReactNode;
  banner?: React.ReactNode;
  children: React.ReactNode;
};

export function PanelShell({ animVisible, uiAttr, header, banner, children }: PanelShellProps) {
  const dataAttrs = uiAttr === 'inspector' ? { 'data-inspector-ui': '' } : { 'data-design-ui': '' };
  return (
    <aside
      {...dataAttrs}
      className="flex h-full shrink-0 justify-end overflow-hidden bg-card transition-[width,border-left-width] ease-out"
      style={{
        width: animVisible ? PANEL_W : 0,
        borderLeftWidth: animVisible ? 1 : 0,
        transitionDuration: `${PANEL_TRANSITION_MS}ms`,
      }}
    >
      <div style={{ width: PANEL_W }} className="flex h-full shrink-0 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2.5">
          {header}
        </header>
        {banner}
        <ScrollArea className="flex flex-1 flex-col">
          <div className="flex min-h-full flex-col">{children}</div>
        </ScrollArea>
      </div>
    </aside>
  );
}
