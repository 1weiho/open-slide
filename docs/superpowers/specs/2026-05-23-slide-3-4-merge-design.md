# Slide 3/4 Merge Design

## Scope

Merge page 3 (`Promise`) and page 4 (`Map`) in `slides/my-story-30min/index.tsx` into a single page.

The merged page should keep the current declaration-style headline from page 3, but replace its lower content area with the existing roadmap structure from page 4.

## Selected Direction

Use option `B`:

- Keep the current page 3 headline: `今天我想分享的，不是履歷。`
- Remove the current right-side declaration card on page 3.
- Remove the current bottom row of four summary cards on page 3.
- Pull the page 4 roadmap section into page 3 as the lower half of the page.
- Delete the standalone `Map` page from the exported slide order.

## Content Structure

### Upper section

Retain the current declaration framing from `Promise`:

- section label: `What this talk is`
- eyebrow / intro label above the main headline
- main headline: `今天我想分享的，不是履歷。`
- short supporting paragraph explaining that the talk is about how the speaker got here, not a resume recital

This upper section remains the tonal anchor of the merged page.

### Lower section

Reuse the visual structure and narrative role of `Map`:

- the roadmap line / directional sequence
- the four-step explanation area below it
- the overall feeling of a route through the talk

However, the text taxonomy should stay aligned with the original page 4 sequence:

1. `起點`
2. `轉折`
3. `選擇`
4. `現在`

This is intentional. The user selected the page 4 framing for the lower section, so the merged page should read as:

- declaration at the top
- roadmap for the rest of the talk at the bottom

## Removal

Remove the standalone `Map` page from:

- the `const Map: Page = ...` page flow if no longer needed
- the default export array

All later pages should shift forward by one page in presentation order.

## Constraints

- Keep the page within the 1920 x 1080 canvas without overflow.
- Preserve the current slide-wide visual language already used in `my-story-30min`.
- Avoid duplicating the same four-topic explanation twice on the merged page.
- Keep the merged page readable at presentation distance; the lower roadmap area may need slightly tighter copy than the old standalone `Map` page.

## Verification

After implementation:

- run `corepack pnpm --filter demo build`
- visually confirm that page 3 contains both the declaration title and the roadmap content
- confirm that the old standalone page 4 no longer exists as a separate stop in the deck
