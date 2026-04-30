---
name: apply-comments
description: Apply pending @slide-comment markers written by the open-slide inspector tool. Use when the user asks to "apply comments", "process slide comments", "apply the inspector comments", or references markers left inside `slides/<id>/index.tsx`.
---

# Apply slide comments

The open-slide editor has an inspector tool that lets the user click on a rendered page element and attach a textual comment (e.g. *"make this red"*, *"change to 'Open Slide Rocks'"*). Each comment is persisted as an in-source JSX marker inside `slides/<slideId>/index.tsx`.

Your job: read those markers, perform the described edits, and delete the markers.

> **Before making any page edit**, consult the **`slide-authoring`** skill — it is the technical reference for how `slides/<id>/index.tsx` is structured (canvas, type scale, palette, assets, file contract). A comment like *"make this bigger"* or *"change the accent colour"* should be applied in a way that stays consistent with those rules.

## Marker format

```
{/* @slide-comment id="c-<8hex>" ts="<ISO>" text="<base64url(JSON)>" */}
```

- Always sits on its own line as the **first child inside** the JSX element it refers to (i.e. between that element's opening `>` and its other children). The marker is dropped *into* its target, not floated above it.
- `text` is base64url-encoded JSON: `{"note": "...", "hint"?: "..."}`.
- Detection regex (authoritative — use exactly this):

  ```
  /\{\/\*\s*@slide-comment\s+id="(c-[a-f0-9]+)"\s+ts="([^"]+)"\s+text="([A-Za-z0-9_\-]+={0,2})"\s*\*\/\}/g
  ```

## Procedure

1. **Identify the target slide(s).**
   - If the user names one (`example-slide`, `youbike-3-survey`, etc.), work on that single `slides/<slideId>/index.tsx`.
   - If they say "all" or don't specify, scan every `slides/*/index.tsx`. Process each slide one at a time.

2. **Read the file and find all markers.**
   - Run the regex above against the whole file.
   - For each match, base64url-decode `text` and `JSON.parse` it to get `{ note, hint? }`.
   - Record each hit as `{ id, lineIndex (0-based), indent, note, hint }`.
   - If there are no markers, tell the user and stop.

3. **Understand each comment in context.**
   - The targeted JSX element is the **enclosing** element of the marker — i.e. read upward from the marker line until you reach the unclosed JSX opening tag whose body the marker lives in. That element is the target. (For self-closing elements like `<img />`, the inspector hoists the marker to the nearest non-self-closing ancestor; in that case the comment usually refers to a child of the enclosing element rather than the enclosing element itself — use the `note` text to disambiguate.)
   - Read enough surrounding code (parent element, sibling elements, inline styles) to apply the change faithfully. A comment inside a `<div>` with an inline `background` style usually refers to that element's styling, for example.
   - If the `note` is ambiguous, do the smallest reasonable interpretation and mention the assumption in your summary.

4. **Apply edits in reverse line order.**
   - Sort markers by descending `lineIndex` and process one at a time, using the `Edit` tool.
   - Processing top-down would invalidate line numbers for later markers as the file shrinks/grows.

5. **Remove each marker after applying its edit.**
   - Delete the entire marker line including its trailing `\n`.
   - Never leave a marker behind. An un-removed marker signals a failure.

6. **Verify.**
   - After all edits, re-read the file and confirm zero remaining markers.
   - Run `pnpm tsc --noEmit` and `pnpm biome check` (or `pnpm lint`). Fix any introduced errors.

7. **Report.**
   - Summarise: `N applied, 0 remaining` plus a one-line description of each change (including the slide id).

## base64url decoding helper

```js
function decode(s) {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64').toString('utf8');
}
```

You can run this inline via `node -e '...'` if you need to inspect a payload; otherwise just reason about the decoded string.

## Edge cases

- **Marker with no enclosing JSX element** (shouldn't happen — the inspector won't write one — but if you find one): delete it and note as orphan.
- **Multiple markers stacked on consecutive lines inside the same element**: they all refer to that enclosing element. Apply them in source order but still delete each line individually.
- **`_debugSource` used SWC instead of Babel**: not your problem — the marker line is authoritative.
- **Comment asks for something outside the target element's scope** (e.g. "add a new page"): do the closest-reasonable edit and mention the scope expansion in your summary.
- **Can't resolve the comment** (e.g. truly ambiguous, or the file changed shape such that the target element doesn't exist): leave the marker in place and report it as skipped. Don't guess.

## Do not

- Do not touch `package.json`, `open-slide.config.ts`, or files outside `slides/`.
- Do not add dependencies.
- Do not re-introduce markers or leave `TODO` breadcrumbs — the user already has a record in git.
