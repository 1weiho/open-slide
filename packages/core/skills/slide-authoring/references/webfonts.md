# Webfonts

The default is a system font stack — prefer it. When a deck genuinely needs a webfont (a brand font, or CJK / Thai / Arabic where system coverage is poor):

- **Load the stylesheet once, in `<head>` — never inside a per-page component.** Every page is mounted live at the same time (thumbnail rail, overview grid, and the PDF print root), so a `<style>@import</style>` / `<link>` rendered inside a `Page` registers the whole `@font-face` set once *per page*. Inject it once, idempotently:

  ```tsx
  const FONT_HREF = 'https://fonts.googleapis.com/css2?family=...&display=swap';
  if (typeof document !== 'undefined' && !document.getElementById('osd-webfont')) {
    const link = document.createElement('link');
    link.id = 'osd-webfont';
    link.rel = 'stylesheet';
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }
  ```

- **List only the weights you actually use.** Each extra weight multiplies the number of `@font-face` rules.
- **CJK fonts are large.** A Google Fonts CJK family registers hundreds of `unicode-range` subset faces (Noto Sans TC ≈ 105 subsets × each weight), and PDF export waits on fonts before printing. If the deck's text is fixed, add `&text=<unique chars>` to the URL to request a tiny single-face subset instead of the full set.
