import {
  slideCreatedAt as createdAt,
  slideIds as ids,
  loadSlide as load,
  slideThemes as themes,
} from 'virtual:open-slide/slides';
import type { SlideModule } from './sdk';

export const slideIds: string[] = ids;
export const slideThemes: Record<string, string> = themes;
export const slideCreatedAt: Record<string, number> = createdAt;

export function slidesByTheme(themeId: string): string[] {
  return slideIds.filter((id) => slideThemes[id] === themeId);
}

export async function loadSlide(id: string): Promise<SlideModule> {
  return load(id);
}

export function changedSlideIds(data: unknown): string[] {
  if (!data || typeof data !== 'object') return [];
  const ids = (data as { slideIds?: unknown }).slideIds;
  return Array.isArray(ids) ? (ids as string[]) : [];
}

export function slideChangeIncludes(data: unknown, slideId: string): boolean {
  return changedSlideIds(data).includes(slideId);
}
