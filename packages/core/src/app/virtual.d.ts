declare module 'virtual:open-slide/slides' {
  import type { SlideModule } from './lib/sdk';
  export const slideIds: string[];
  export function loadSlide(id: string): Promise<SlideModule>;
}

declare module 'virtual:open-slide/config' {
  const config: {
    title?: string;
    slidesDir?: string;
    port?: number;
  };
  export default config;
}
