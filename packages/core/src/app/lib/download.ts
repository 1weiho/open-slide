/**
 * Shared blob-download helper used by the viewer's client-side exporters.
 *
 * Extracted out of `export-html.ts` so PNG, HTML, and any future exporter can
 * trigger downloads through one well-tested code path (single `<a download>`
 * click + `revokeObjectURL`) without coupling the exporter modules to each
 * other.
 *
 * @agents-index Shared `downloadBlob` helper for client-side viewer exporters.
 */

/**
 * Trigger a browser download of `blob` as `filename` via a hidden
 * `<a download>` click, then revoke the object URL on the next tick so the
 * browser has time to start the download before the URL is released.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
