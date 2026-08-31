const LAST_HOME_LOCATION_KEY = 'open-slide:last-home-location';

export function rememberHomeLocation(pathname: string, search: string): void {
  try {
    sessionStorage.setItem(LAST_HOME_LOCATION_KEY, pathname + search);
  } catch {
    // sessionStorage can be unavailable (private browsing, quota); falling
    // back to the default home route is fine.
  }
}

export function readLastHomeLocation(): string {
  try {
    return sessionStorage.getItem(LAST_HOME_LOCATION_KEY) ?? '/';
  } catch {
    return '/';
  }
}
