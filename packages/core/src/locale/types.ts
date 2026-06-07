export type Plural = { one: string; other: string };

export type Locale = {
  id: 'en' | 'zh-TW' | 'zh-CN' | 'ja';

  common: {
    cancel: string;
    save: string;
    saving: string;
    saved: string;
    discard: string;
    delete: string;
    rename: string;
    move: string;
    close: string;
    loading: string;
    loadFailed: string;
    failedToLoadSlide: string;
    home: string;
    backToHome: string;
    preview: string;
    add: string;
    done: string;
    tryAgain: string;
    undo: string;
    redo: string;
    light: string;
    dark: string;
    system: string;
    selected: string;
  };

  notFound: {
    eyebrow: string;
    title: string;
  };

  home: {
    appTitle: string;
    draft: string;
    duplicate: string;
    themes: string;
    assets: string;
    folders: string;
    newFolder: string;
    folderName: string;
    updateAvailable: string;
    changeIcon: string;
    iconEmojiTab: string;
    iconColorTab: string;
    folderActions: string;
    searchPlaceholder: string;
    clearSearch: string;
    sortLabel: string;
    sortByCreatedDesc: string;
    sortByCreatedAsc: string;
    sortByTitleAsc: string;
    sortByTitleDesc: string;
    noMatches: string;
    nothingMatchesPrefix: string;
    nothingMatchesSuffix: string;
    noSlidesYet: string;
    createSlideHintPrefix: string;
    createSlideHintSuffix: string;
    folderEmptyTitle: string;
    folderEmptyHint: string;
    slideActions: string;
    moveToFolder: string;
    renameDialogEyebrow: string;
    renameDialogTitle: string;
    renameDialogDescription: string;
    slideNamePlaceholder: string;
    moveDialogEyebrow: string;
    moveDialogTitle: string;
    moveDialogDescriptionPrefix: string;
    moveDialogDescriptionSuffix: string;
    deleteDialogEyebrow: string;
    deleteDialogTitle: string;
    deleteDialogDescriptionPrefix: string;
    deleteDialogDescriptionMid: string;
    deleteDialogDescriptionSuffix: string;
    /** template: "Created folder “{name}”" */
    toastFolderCreated: string;
    toastFolderCreateFailed: string;
    /** template: "Duplicated “{slide}” as {newSlide}" */
    toastSlideDuplicated: string;
    toastSlideDuplicateFailed: string;
    /** template: "Moved “{slide}” to {folder}" */
    toastSlideMoved: string;
    toastSlideMoveFailed: string;
    /** template: "Deleted folder “{name}”" */
    toastFolderDeleted: string;
    toastFolderDeleteFailed: string;
    toastFolderReorderFailed: string;
    pickIcon: string;
  };

  slide: {
    home: string;
    backToHome: string;
    agentConnected: string;
    agentConnectedTooltip: string;
    agentDisconnected: string;
    agentDisconnectedTooltip: string;
    download: string;
    copyLink: string;
    toastCopyLinkSuccess: string;
    toastCopyLinkFailed: string;
    exportAsHtml: string;
    exportAsPdf: string;
    exportAsImagePptx: string;
    exportAsPptx: string;
    comingSoon: string;
    pptxComingSoonTooltip: string;
    pdfExportFailed: string;
    imagePptxExportFailed: string;
    pdfExportSafariUnsupported: string;
    present: string;
    presentMenuAria: string;
    presentInWindow: string;
    presentFullscreen: string;
    presentPresenter: string;
    slidesTab: string;
    assetsTab: string;
    renameSlide: string;
    loadingEyebrow: string;
    emptyEyebrow: string;
    nothingToShow: string;
    emptyHintPrefix: string;
    emptyHintMust: string;
    emptyHintSuffix: string;
  };

  presenter: {
    eyebrow: string;
    notLinked: string;
    nowShowing: string;
    upNext: string;
    lastSlide: string;
    endOfDeck: string;
    speakerNotes: string;
    noNotesPrefix: string;
    noNotesSuffix: string;
    blackScreen: string;
    whiteScreen: string;
    prev: string;
    next: string;
    black: string;
    white: string;
    reset: string;
    resetTimer: string;
    currentTime: string;
    elapsed: string;
    jump: string;
    /** template: "Loading {slideId}…" */
    loadingSlide: string;
  };

  present: {
    prevSlideAria: string;
    nextSlideAria: string;
    overviewAria: string;
    blackoutAria: string;
    whiteoutAria: string;
    laserAria: string;
    presenterAria: string;
    enterFullscreenAria: string;
    exitFullscreenAria: string;
    helpAria: string;
    exitAria: string;
    elapsedTime: string;
    helpEyebrow: string;
    helpTitle: string;
    shortcutNext: string;
    shortcutPrev: string;
    shortcutFirstLast: string;
    shortcutJump: string;
    shortcutOverview: string;
    shortcutBlack: string;
    shortcutWhite: string;
    shortcutLaser: string;
    shortcutPresenter: string;
    shortcutToggleHelp: string;
    shortcutCloseExit: string;
    overviewDialogAria: string;
    overviewEyebrow: string;
    /** template: "Go to slide {n}" */
    overviewGoToAria: string;
    nowBadge: string;
  };

  inspector: {
    inspect: string;
    deselect: string;
    agentWatching: string;
    agentWatchingTooltip: string;
    agentNotWatching: string;
    agentNotWatchingTooltip: string;
    contentSection: string;
    typographySection: string;
    colorSection: string;
    textColor: string;
    backgroundColor: string;
    imageSection: string;
    imagePlaceholderSection: string;
    elementTextPlaceholder: string;
    sizeLabel: string;
    weightLabel: string;
    weightLight: string;
    weightRegular: string;
    weightMedium: string;
    weightSemibold: string;
    weightBold: string;
    weightExtrabold: string;
    styleLabel: string;
    boldAria: string;
    italicAria: string;
    lineHeightLabel: string;
    trackingLabel: string;
    alignLabel: string;
    clearAria: string;
    replace: string;
    replaceImageDialogTitle: string;
    /** template: "Pick an asset from {path}." */
    replaceImageDescription: string;
    pickerLoading: string;
    pickerEmpty: string;
    placeholderHintLabel: string;
    crop: string;
    cropDialogTitle: string;
    cropDialogDescription: string;
    cropFitCover: string;
    cropFitContain: string;
    cropApply: string;
    cropResetAria: string;
    leaveComment: string;
    commentPlaceholder: string;
    commentShortcutHint: string;
    addComment: string;
    /** templates: "{count} unsaved change" / "{count} unsaved changes" */
    unsavedChanges: Plural;
    /** templates: "{count} comment" / "{count} comments" */
    commentsCount: Plural;
    /** template: "line {n}" */
    commentLineLabel: string;
    commentsEmpty: string;
    commentsApplyHintPrefix: string;
    commentsApplyHintSuffix: string;
    commentDeleteAria: string;
    /** Prefix for the toast shown when one or more buffered edits fail to write to disk. */
    saveFailed: string;
  };

  stylePanel: {
    designTokens: string;
    draftBadge: string;
    unsavedTitle: string;
    closePanelAria: string;
    colorsSection: string;
    typographySection: string;
    shapeSection: string;
    backgroundLabel: string;
    textLabel: string;
    accentLabel: string;
    displayFontLabel: string;
    bodyFontLabel: string;
    heroLabel: string;
    bodyLabel: string;
    radiusLabel: string;
    designToggle: string;
    designToggleTitle: string;
    fontPresetCustom: string;
    shuffleAria: string;
    shuffleTitle: string;
  };

  asset: {
    devOnlyMessage: string;
    sectionAria: string;
    eyebrow: string;
    scopeSlide: string;
    scopeGlobal: string;
    /** templates: "{count} file" / "{count} files" */
    fileCount: Plural;
    usageUnused: string;
    searchLogos: string;
    upload: string;
    dropToUpload: string;
    loading: string;
    noAssetsYet: string;
    noAssetsHintPrefix: string;
    noAssetsHintSuffix: string;
    nameAlreadyExists: string;
    /** template: "Preview {name}" */
    previewAria: string;
    /** template: "Actions for {name}" */
    actionsAria: string;
    previewMenuItem: string;
    renameMenuItem: string;
    deleteMenuItem: string;
    conflictTitle: string;
    /** template: "{name} is already in the assets folder." */
    conflictDescription: string;
    conflictReplace: string;
    conflictRenameCopy: string;
    deleteAssetTitle: string;
    /** template: "Delete {name}? Imports referencing this file in the slide will break." */
    deleteAssetDescription: string;
    /** template: "{name} is used in {count} place across {slides} slide." (singular/plural via {count}/{slides}) */
    deleteAssetInUseDescription: string;
    deleteAssetInUseHint: string;
    deleteAndRevert: string;
    /** template: "Couldn't revert usage in {slideId}." */
    toastRevertFailed: string;
    /** template: "Deleted {name} and reverted {count} usage." */
    toastDeletedWithRevert: string;
    noPreview: string;
    importHintComment: string;
    importHintSemi: string;
    logoSearchTitle: string;
    logoSearchPoweredByPrefix: string;
    logoSearchPlaceholder: string;
    logoSearchErrorTitle: string;
    logoSearchErrorBody: string;
    /** template: 'No logos for "{query}"' */
    logoSearchNoResults: string;
    logoSearchEmpty: string;
    logoSearchEmptyHintPrefix: string;
    logoSearchEmptyHintSuffix: string;
    logoVariantLight: string;
    logoVariantDark: string;
    /** template: "Upload failed ({status})" */
    toastUploadFailed: string;
    /** template: "Replaced {name}" */
    toastReplaced: string;
    /** template: "Uploaded as {name}" */
    toastUploadedAs: string;
    /** template: "Uploaded {name}" */
    toastUploaded: string;
    /** template: "Rename failed ({status})" */
    toastRenameFailed: string;
    /** template: "Renamed to {name}" */
    toastRenamed: string;
    /** template: "Delete failed ({status})" */
    toastDeleteFailed: string;
    /** template: "Deleted {name}" */
    toastDeleted: string;
    toastDownloadFailed: string;
    toastSearchFailed: string;
  };

  thumbnailRail: {
    pages: string;
    /** template: "Go to page {n}" */
    goToPageAria: string;
    duplicatePage: string;
    deletePage: string;
    /** template: "Page {n} actions" */
    pageActionsAria: string;
    /** template: "Duplicated page {n}" */
    toastDuplicated: string;
    /** template: "Deleted page {n}" */
    toastDeleted: string;
    toastDuplicateFailed: string;
    toastDeleteFailed: string;
    resizeRail: string;
    transitionIndicator: string;
    stepsIndicator: string;
    overviewAria: string;
  };

  pdfToast: {
    title: string;
    /** template: "Processing page {current} of {total}" */
    processing: string;
    printing: string;
    done: string;
  };

  pptxToast: {
    title: string;
    /** template: "Rendering page {current} of {total}" */
    processing: string;
    generating: string;
    done: string;
  };

  themeToggle: {
    toggleAria: string;
    title: string;
    light: string;
    dark: string;
    system: string;
  };

  languageToggle: {
    toggleAria: string;
    title: string;
  };

  imagePlaceholder: {
    dropOverlay: string;
    uploading: string;
    uploadFailed: string;
  };

  notesDrawer: {
    toggle: string;
    /** template: "page {n}/{total}" */
    pageLabel: string;
    placeholder: string;
    statusSaving: string;
    statusSaved: string;
    /** template: "Save failed: {msg}" */
    statusError: string;
  };

  themes: {
    title: string;
    noThemesTitle: string;
    noThemesHintPrefix: string;
    noThemesHintSuffix: string;
    noDemoYet: string;
    noDemoHintPrefix: string;
    noDemoHintSuffix: string;
    backToGallery: string;
    /** template: "page {n}/{total}" */
    pageOf: string;
    nextPageAria: string;
    prevPageAria: string;
    /** template: "Open theme {name}" */
    openThemeAria: string;
    usedBy: string;
    usedByEmpty: string;
    expandPromptAria: string;
    collapsePromptAria: string;
  };
};
