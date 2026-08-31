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
