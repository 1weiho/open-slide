import type { Locale } from './locale/types';

export type OpenSlideBuildConfig = {
  showSlideBrowser?: boolean;
  showSlideUi?: boolean;
  allowHtmlDownload?: boolean;
};

/**
 * `'workspace'` (default) hosts many slides under `slides/<id>/` with a home
 * browser, folders, and themes. `'standalone'` is a single deck whose entry is
 * the project-root `index.tsx` — no slide listing, folders, or themes.
 */
export type SlideMode = 'workspace' | 'standalone';

export type OpenSlideConfig = {
  mode?: SlideMode;
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
};
