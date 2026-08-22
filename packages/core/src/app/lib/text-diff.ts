/**
 * Narrow a text replacement to the span that actually changed, so an edit to
 * one word does not rewrite the whole node. Shared by the browser inspector
 * and the Node editing engine.
 */
export function textDiff(prevText: string, nextText: string) {
  let start = 0;
  while (
    start < prevText.length &&
    start < nextText.length &&
    prevText[start] === nextText[start]
  ) {
    start += 1;
  }

  let prevEnd = prevText.length;
  let nextEnd = nextText.length;
  while (prevEnd > start && nextEnd > start && prevText[prevEnd - 1] === nextText[nextEnd - 1]) {
    prevEnd -= 1;
    nextEnd -= 1;
  }

  return { start, end: prevEnd, value: nextText.slice(start, nextEnd) };
}
