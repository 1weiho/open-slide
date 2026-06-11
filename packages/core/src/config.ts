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
  /**
   * @deprecated Pick the UI language from the language switcher in the slide UI
   * instead. When set, this only seeds the initial language until the user
   * chooses one (their choice is then remembered locally).
   */
  locale?: Locale;
  build?: OpenSlideBuildConfig;
  /**
   * Public origin of the deployed site (e.g. `https://slides.example.com`).
   * Used to emit absolute `og:url` / `og:image` URLs in per-slide HTML at build.
   * Trailing slashes are stripped. Leave unset to skip absolute URL rewriting.
   */
  site?: string;
  /**
   * Deck-wide default Open Graph image. Applied to every slide that doesn't
   * set its own `meta.ogImage`. Accepts an `@assets/...` path (resolved
   * against `assetsDir`), a path relative to the slides root, or an absolute
   * URL. Use PNG/JPG/WebP.
   */
  ogImage?: string;
};
