import type { Locale } from './locale/types';

export type OpenSlideBuildConfig = {
  showSlideBrowser?: boolean;
  showSlideUi?: boolean;
  allowHtmlDownload?: boolean;
};

export type OpenSlideConfig = {
  slidesDir?: string;
  port?: number;
  locale?: Locale;
  build?: OpenSlideBuildConfig;
};
