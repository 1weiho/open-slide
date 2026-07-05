import type { Locale } from './locale/types';

export type OpenSlideBuildConfig = {
  showSlideBrowser?: boolean;
  showSlideUi?: boolean;
  allowHtmlDownload?: boolean;
};

export type OpenSlideThemeImportConfig = {
  /**
   * When set, themes may only be imported from these hosts (exact match or a
   * subdomain of an entry). Leave unset to allow any host — the CLI/UI still
   * asks for confirmation before importing, since a theme's demo file is
   * executable code.
   */
  allowedHosts?: string[];
};

export type OpenSlideConfig = {
  base?: string;
  slidesDir?: string;
  themesDir?: string;
  assetsDir?: string;
  port?: number;
  themeImport?: OpenSlideThemeImportConfig;
  /**
   * @deprecated Pick the UI language from the language switcher in the slide UI
   * instead. When set, this only seeds the initial language until the user
   * chooses one (their choice is then remembered locally).
   */
  locale?: Locale;
  build?: OpenSlideBuildConfig;
};
