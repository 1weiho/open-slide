import { type Context, createContext, type PropsWithChildren, useContext, useMemo } from 'react';

type SlidePageContextValue = {
  index: number;
  total: number;
};

// Stored on globalThis so dev (src) and published (dist) copies of this module
// share one context instance — otherwise the provider writes to one context and
// the hook reads from another, and `useSlidePageNumber` always sees null.
const GLOBAL_KEY = '__open_slide_page_context__';
type GlobalWithCtx = typeof globalThis & {
  [GLOBAL_KEY]?: Context<SlidePageContextValue | null>;
};
const g = globalThis as GlobalWithCtx;
if (!g[GLOBAL_KEY]) {
  g[GLOBAL_KEY] = createContext<SlidePageContextValue | null>(null);
}
const SlidePageContext = g[GLOBAL_KEY];

export function SlidePageProvider({
  index,
  total,
  children,
}: PropsWithChildren<{ index: number; total: number }>) {
  const value = useMemo(() => ({ index, total }), [index, total]);
  return <SlidePageContext.Provider value={value}>{children}</SlidePageContext.Provider>;
}

export function useSlidePageNumber(): { current: number; total: number } {
  const ctx = useContext(SlidePageContext);
  if (!ctx) {
    throw new Error(
      'useSlidePageNumber must be called from a slide page rendered by @open-slide/react',
    );
  }
  return { current: ctx.index + 1, total: ctx.total };
}
