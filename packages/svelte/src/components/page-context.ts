import { getContext } from 'svelte';

export type SlidePageContext = { index: number; total: number };

export const PAGE_CONTEXT = 'open-slide:page';

export function getSlidePageNumber(): SlidePageContext {
  return getContext<SlidePageContext>(PAGE_CONTEXT) ?? { index: 0, total: 1 };
}
