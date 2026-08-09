declare module 'virtual:open-slide/slides' {
  import type { Page } from '@open-slide/svelte';
  import type { SlideModule } from '@open-slide/shared';

  export const slideIds: string[];
  export const slideThemes: Record<string, string>;
  export const slideCreatedAt: Record<string, number>;
  export function loadSlide(id: string): Promise<SlideModule<Page>>;
}

declare module 'virtual:open-slide/config' {
  import type { OpenSlideConfig } from '@open-slide/shared';

  const config: OpenSlideConfig & {
    version: string;
    build: {
      showSlideBrowser: boolean;
      showSlideUi: boolean;
      allowHtmlDownload: boolean;
    };
  };
  export default config;
}

declare module 'virtual:open-slide/themes' {
  import type { DesignSystem } from '@open-slide/shared';
  import type { Page } from '@open-slide/svelte';

  export type ThemeMeta = {
    id: string;
    name: string;
    description: string;
    body: string;
    hasDemo: boolean;
  };

  export const themes: ThemeMeta[];
  export function loadThemeDemo(id: string): Promise<{
    default: Page[];
    design?: DesignSystem;
  }>;
}
