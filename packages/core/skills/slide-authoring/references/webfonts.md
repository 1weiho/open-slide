# Webfonts

The default is a system font stack — prefer it. When a deck genuinely needs a webfont (a brand font, or CJK / Thai / Arabic where system coverage is poor):

- **Load the stylesheet once, in `<head>` — never inside a per-page component.** Every page is mounted live at the same time (thumbnail rail, overview grid, and the PDF print root), so a `<style>@import</style>` / `<link>` rendered inside a `Page` registers the whole `@font-face` set once *per page*. Inject it once, idempotently, from module top level of `index.tsx` (top-level statements as in the snippet below — not inside a component or effect). **Key the element id to the slide** (e.g. `osd-webfont-<slide-id>`) — the home page mounts pages from *every* slide at once, so a generic shared id like `osd-webfont` would let the first slide's fonts suppress every other slide's:

  ```tsx
  const FONT_HREF = 'https://fonts.googleapis.com/css2?family=...&display=swap';
  const FONT_LINK_ID = 'osd-webfont-q2-roadmap'; // suffix = this slide's folder id
  if (typeof document !== 'undefined') {
    let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = FONT_LINK_ID;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.href !== FONT_HREF) link.href = FONT_HREF;
  }
  ```

- **Create-or-update, never create-if-missing.** HMR re-runs the module but leaves the previous `<link>` / `<style>` in the document, so an `if (!document.getElementById(id)) { … }` guard skips the new content and edits don't show up until a full reload. The same shape applies to any `<style>` you inject for `@keyframes`:

  ```tsx
  const STYLE_ID = 'osd-styles-q2-roadmap';
  const css = `@keyframes rise { from { opacity: 0 } to { opacity: 1 } }`;
  if (typeof document !== 'undefined') {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    if (style.textContent !== css) style.textContent = css;
  }
  ```

- **List only the weights you actually use.** Each extra weight multiplies the number of `@font-face` rules.
- **CJK fonts are large.** A Google Fonts CJK family registers hundreds of `unicode-range` subset faces (Noto Sans TC ≈ 105 subsets × each weight), and PDF export waits on fonts before printing. If the deck's text is fixed, add `&text=<unique chars>` to the URL to request a tiny single-face subset instead of the full set.
