# Page numbers (`useSlidePageNumber`)

If a footer shows the current page (`03 / 12`, `Page 3`, etc.), read it from `useSlidePageNumber()` — **never hardcode** `n` / `TOTAL`. Inserting, reordering, or deleting a page would otherwise force you to retouch every footer.

```tsx
import { useSlidePageNumber } from '@open-slide/core';

const Footer = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <span>{String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
  );
};
```

`current` is 1-indexed (matches what readers see) and `total` is the slide's page count. The hook works in every render context (main viewer, thumbnails, overview grid, present mode, presenter window, HTML/PDF export) — the same `<Footer />` JSX is correct everywhere. Call the hook inside a component that's used **per page**; don't try to call it at module top level.
