// Computed styles resolve var() to a colour, so a saved token only survives in
// the inline style; a pending edit (including a clear, which is null) wins.
export function swatchValue(
  pending: string | null | undefined,
  inlineValue: string,
): string | null {
  return pending === undefined ? inlineValue : pending;
}
