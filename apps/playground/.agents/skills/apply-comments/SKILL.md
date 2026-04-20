---
name: apply-comments
description: Apply pending @slide-comment markers written by the open-slide inspector tool. Use when the user asks to "apply comments", "process slide comments", "apply the inspector comments", "套用留言", or references markers left inside `slides/<id>/index.tsx`.
---

# Apply slide comments

The open-slide editor has an inspector tool that lets the user click on a rendered page element and attach a textual comment (e.g. *"make this red"*, *"change to 'Open Slide Rocks'"*). Each comment is persisted as an in-source JSX marker inside `slides/<slideId>/index.tsx`.

Your job: read those markers, perform the described edits, and delete the markers.

## Marker format

```
{/* @slide-comment id="c-<8hex>" ts="<ISO>" text="<base64url(JSON)>" */}
```

- Always sits on its own line, immediately **above** the JSX element it refers to.
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
   - The targeted JSX element is the next non-blank line after the marker.
   - Read enough surrounding code (parent element, sibling elements, inline styles) to apply the change faithfully. A comment on a `<div>` with an inline `background` style usually refers to that element's styling, for example.
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

- **Marker at EOF / without a following element**: delete the marker; note it in the summary as orphan.
- **Multiple markers stacked on consecutive lines**: they all refer to the same next non-blank JSX element. Apply them in source order but still delete each line individually.
- **`_debugSource` used SWC instead of Babel**: not your problem — the marker line is authoritative.
- **Comment asks for something outside the target element's scope** (e.g. "add a new page"): do the closest-reasonable edit and mention the scope expansion in your summary.
- **Can't resolve the comment** (e.g. truly ambiguous, or the file changed shape such that the target element doesn't exist): leave the marker in place and report it as skipped. Don't guess.

## Do not

- Do not touch `package.json`, `open-slide.json`, or files outside `slides/`.
- Do not add dependencies.
- Do not re-introduce markers or leave `TODO` breadcrumbs — the user already has a record in git.
