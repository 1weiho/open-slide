export type OpenSlideBuildConfig = {
  showSlideBrowser?: boolean;
  showSlideUi?: boolean;
  allowHtmlDownload?: boolean;
};

export type OpenSlideConfig = {
  slidesDir?: string;
  port?: number;
  build?: OpenSlideBuildConfig;
};
