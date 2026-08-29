import type { CanvasOption } from './canvas';
import type { Locale } from './locale/types';

export type OpenSlideBuildConfig = {
  showSlideBrowser?: boolean;
  showSlideUi?: boolean;
  allowHtmlDownload?: boolean;
};

export type OpenSlideConfig = {
  base?: string;
  slidesDir?: string;
  themesDir?: string;
  assetsDir?: string;
  port?: number;
  allowedHosts?: string[] | true;
  /**
   * Pixel dimensions every slide renders into. Accepts a named preset
   * (`'16:9'`, `'4:3'`, `'4:5'`, `'1:1'`, `'9:16'`) or explicit
   * `{ width, height }`. Defaults to `'16:9'` (1920×1080).
   *
   * Slides do not reflow — the canvas is scaled to fit — so changing this on an
   * existing deck re-frames its layout rather than adapting it.
   */
  canvas?: CanvasOption;
  /**
   * @deprecated Pick the UI language from the language switcher in the slide UI
   * instead. When set, this only seeds the initial language until the user
   * chooses one (their choice is then remembered locally).
   */
  locale?: Locale;
  build?: OpenSlideBuildConfig;
};
