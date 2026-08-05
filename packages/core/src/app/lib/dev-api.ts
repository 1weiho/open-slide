export function joinBase(base: string, path: string): string {
  if (!base.startsWith('/')) return path;
  const trimmed = base.replace(/\/+$/, '');
  return trimmed + path;
}

// Dev-server API URLs must stay beneath the configured `base` so authoring
// still works when the app is hosted at a subpath (e.g. behind a reverse
// proxy). Route every `/__*` fetch through here instead of hardcoding paths.
export function devApiUrl(path: string): string {
  return joinBase(import.meta.env.BASE_URL ?? '/', path);
}
