import {
  slideIds as ids,
  loadSlide as load,
  slideThemes as themes,
} from 'virtual:open-slide/slides';
import type { SlideModule } from './sdk';

export const slideIds: string[] = ids;
export const slideThemes: Record<string, string> = themes;

export function slidesByTheme(themeId: string): string[] {
  return slideIds.filter((id) => slideThemes[id] === themeId);
}

export async function loadSlide(id: string): Promise<SlideModule> {
  return load(id);
}
