# Homepage Cover Design

## Goal

Redesign slide 1 of `apps/demo/slides/my-story-30min/index.tsx` so it reads as a true presentation cover, not as a normal content page.

The cover should establish the talk's tone immediately: personal, reflective, and formal enough for an opening slide. It should feel like a keynote cover or talk title card, with a clear visual hierarchy and minimal information density.

## Fixed Content

The cover will contain exactly four content elements:

1. Main title: `經驗，沒有替代品`
2. Identity line: `iOS Club 9th 社長｜開發者・設計實踐者`
3. Subtitle: `這不是成功學，是我一路跌撞、學會、再往前走的過程。`
4. Name: `蔡承曄`

The previous greeting-style copy such as `大家好，我是...` should be removed from the cover because it makes the page read like an agenda or intro-content slide instead of a title slide.

## Layout

The cover should keep a two-column structure:

- Left column: text-led title composition
- Right column: portrait-led cover visual

The left column should use a strong top-to-bottom hierarchy:

1. Small identity line near the top
2. Very large main title as the primary anchor
3. Short subtitle below the title
4. Speaker name as a distinct closing element near the lower portion of the text block

The text column should not feel like a `top + body paragraph` content layout. It should feel like a stacked cover composition with intentional spacing between title, subtitle, and name.

The right column should preserve the existing portrait asset, but it should behave as a cover visual rather than as an illustration attached to body copy. The image frame can become larger, more dominant, and cleaner if needed, as long as it still fits within the slide safely.

## Visual Direction

The overall tone should be closer to a presentation cover than a normal story slide:

- Fewer explanatory cues
- Stronger typographic contrast
- More deliberate whitespace
- Cleaner grouping of information

The page should remain aligned with the existing deck language:

- Keep the current palette family
- Keep the existing portrait asset
- Avoid introducing decorative elements that would feel unrelated to the rest of the deck

Accent usage should stay restrained. If an accent line remains, it should support the cover hierarchy rather than divide content like a normal section slide.

## Implementation Notes

Implementation should be limited to the `Cover` page and closely related styling in `apps/demo/slides/my-story-30min/index.tsx`.

Preferred changes:

- Replace greeting-style text with the approved content
- Rebuild the left-side composition around title-cover hierarchy
- Adjust spacing, font sizes, and image presence so the slide feels intentional at first glance
- Reuse existing shared primitives where possible, but do not force the old `TopBottomLayout` if it preserves the current content-page feeling

## Acceptance Criteria

The redesign is complete when:

1. Slide 1 reads immediately as a cover slide rather than a content slide
2. The approved four content elements are present and nothing extra competes with them
3. The title is the strongest element on the page
4. The portrait feels like a cover visual, not a supporting inline image
5. The page remains balanced on the full slide canvas without large accidental empty areas
6. The slide builds successfully with `open-slide build`

## Risks

- If the text stack is too dense, the page may drift back toward a content-slide feeling
- If the image is too small or too boxed in, the right side will feel secondary instead of cover-like
- If too many decorative accents are added, the page may feel disconnected from the rest of the deck
