export function openPresenterWindow(slideId: string) {
  if (typeof window === 'undefined') return;
  const url = `${import.meta.env.BASE_URL}s/${encodeURIComponent(slideId)}/presenter`;
  window.open(url, `open-slide-presenter-${slideId}`, 'popup,width=1280,height=800');
}
