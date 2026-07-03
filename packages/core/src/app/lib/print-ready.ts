const DEFAULT_WAITFOR_TIMEOUT_MS = 10_000;
const DEFAULT_IMAGE_TIMEOUT_MS = 15_000;

// `document.fonts.ready` already waits for every in-flight face. Never call
// `face.load()` on the rest: unloaded faces were never requested by CSS, and
// `load()` ignores `unicode-range`, so a subsetted CJK family (hundreds of
// faces) would be force-downloaded in full and hang or crash the tab.
export async function waitForFonts(): Promise<void> {
  if (!('fonts' in document)) return;
  await document.fonts.ready;
}

export async function waitForImages(
  root: HTMLElement,
  timeoutMs = DEFAULT_IMAGE_TIMEOUT_MS,
): Promise<void> {
  const images = Array.from(root.querySelectorAll<HTMLImageElement>('img'));
  if (images.length === 0) return;

  const deadline = performance.now() + timeoutMs;
  await Promise.all(images.map((img) => waitForImage(img, deadline)));
}

async function waitForImage(img: HTMLImageElement, deadline: number): Promise<void> {
  if (!img.currentSrc && !img.src) return;

  while (!img.complete && performance.now() < deadline) {
    await nextFrame();
  }
  if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) return;

  if (typeof img.decode !== 'function') return;
  const remaining = Math.max(0, deadline - performance.now());
  if (remaining === 0) return;

  await Promise.race([
    img.decode().catch(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, remaining)),
  ]);
}

export async function waitForDataWaitfor(
  root: HTMLElement,
  timeoutMs = DEFAULT_WAITFOR_TIMEOUT_MS,
): Promise<void> {
  const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-waitfor]'));
  if (targets.length === 0) return;
  const deadline = performance.now() + timeoutMs;
  await Promise.all(
    targets.map(async (el) => {
      const selector = el.getAttribute('data-waitfor');
      if (!selector) return;
      while (performance.now() < deadline) {
        try {
          if (el.querySelector(selector)) return;
        } catch {
          return; // invalid selector — skip rather than hang
        }
        await nextFrame();
      }
    }),
  );
}

export function isFrameAnimationSettled(frame: Element): boolean {
  if (typeof document.getAnimations !== 'function') return true;
  for (const anim of document.getAnimations()) {
    const effect = anim.effect as KeyframeEffect | null;
    if (!effect) continue;
    const target = effect.target;
    if (!target || !frame.contains(target)) continue;
    const timing = effect.getComputedTiming();
    if (timing.iterations === Infinity) continue;
    if (anim.playState !== 'finished') return false;
  }
  return true;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
