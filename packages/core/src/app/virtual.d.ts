declare module 'virtual:open-slide/slides' {
  import type { SlideModule } from './lib/sdk';
  export const slideIds: string[];
  export function loadSlide(id: string): Promise<SlideModule>;
}

declare module 'virtual:open-slide/config' {
  const config: {
    slidesDir?: string;
    port?: number;
    build: {
      showSlideBrowser: boolean;
      showSlideUi: boolean;
      allowHtmlDownload: boolean;
    };
  };
  export default config;
}
