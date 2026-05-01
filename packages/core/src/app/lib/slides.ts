import { slideIds as ids, loadSlide as load } from 'virtual:open-slide/slides';
import type { SlideModule } from './sdk';

export const slideIds: string[] = ids;

export async function loadSlide(id: string): Promise<SlideModule> {
  return load(id);
}
