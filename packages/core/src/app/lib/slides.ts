import type { SlideModule } from './sdk';
import { slideIds as ids, loadSlide as load } from 'virtual:open-slide/slides';

export const slideIds: string[] = ids;

export async function loadSlide(id: string): Promise<SlideModule> {
  return load(id);
}
