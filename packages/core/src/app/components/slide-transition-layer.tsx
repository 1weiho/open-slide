import { type MutableRefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { SlidePageProvider } from '../lib/page-context';
import type { Page } from '../lib/sdk';
import {
  type EntryDirection,
  type StepAggregate,
  type StepController,
  StepHost,
} from '../lib/step-context';
import {
  resolveTransition,
  type SharedElementTransition,
  type SlideTransition,
  type TransitionPhase,
} from '../lib/transition';

type Props = {
  pages: Page[];
  index: number;
  total: number;
  moduleTransition?: SlideTransition;
  disabled?: boolean;
  stepControllerRef?: MutableRefObject<StepController | null>;
  entryDirection?: EntryDirection;
  onStepAggregateChange?: (aggregate: StepAggregate) => void;
};

type Direction = 'forward' | 'backward';

const DEFAULT_EASING = 'cubic-bezier(.4, 0, .2, 1)';
const SHARED_ELEMENT_SELECTOR = '[data-osd-shared-element]';
const TEXT_FILL_COLOR_PROPERTY = '-webkit-text-fill-color';
const SHARED_ELEMENT_VISUAL_PROPERTIES = [
  'opacity',
  'color',
  'background-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline-color',
  'text-decoration-color',
  TEXT_FILL_COLOR_PROPERTY,
  '-webkit-text-stroke-color',
  'fill',
  'stroke',
] as const;
const BORDER_COLOR_PROPERTIES = [
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
] as const;
const BORDER_SIDE_PROPERTIES = [
  {
    width: 'borderTopWidth',
    style: 'borderTopStyle',
    color: 'borderTopColor',
    cssWidth: 'border-top-width',
    cssStyle: 'border-top-style',
    cssColor: 'border-top-color',
  },
  {
    width: 'borderRightWidth',
    style: 'borderRightStyle',
    color: 'borderRightColor',
    cssWidth: 'border-right-width',
    cssStyle: 'border-right-style',
    cssColor: 'border-right-color',
  },
  {
    width: 'borderBottomWidth',
    style: 'borderBottomStyle',
    color: 'borderBottomColor',
    cssWidth: 'border-bottom-width',
    cssStyle: 'border-bottom-style',
    cssColor: 'border-bottom-color',
  },
  {
    width: 'borderLeftWidth',
    style: 'borderLeftStyle',
    color: 'borderLeftColor',
    cssWidth: 'border-left-width',
    cssStyle: 'border-left-style',
    cssColor: 'border-left-color',
  },
] as const;
const INHERITED_VISUAL_PROPERTIES = new Set<string>([
  'color',
  'text-decoration-color',
  TEXT_FILL_COLOR_PROPERTY,
  '-webkit-text-stroke-color',
  'fill',
  'stroke',
]);

function runPhase(
  el: HTMLElement,
  phase: TransitionPhase | undefined,
  fallbackDuration: number,
  fallbackEasing: string,
): Animation | null {
  if (!phase) return null;
  return el.animate(phase.keyframes, {
    duration: phase.duration ?? fallbackDuration,
    easing: phase.easing ?? fallbackEasing,
    delay: phase.delay ?? 0,
    fill: 'both',
  });
}

type ResolvedSharedElementTransition = Required<SharedElementTransition>;

function resolveSharedElementTransition(
  sharedElements: SlideTransition['sharedElements'],
  fallbackDuration: number,
  fallbackEasing: string,
): ResolvedSharedElementTransition | null {
  if (!sharedElements) return null;
  if (sharedElements === true) {
    return { duration: fallbackDuration, easing: fallbackEasing, delay: 0 };
  }
  return {
    duration: sharedElements.duration ?? fallbackDuration,
    easing: sharedElements.easing ?? fallbackEasing,
    delay: sharedElements.delay ?? 0,
  };
}

type LocalRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function measureUntransformedClientRect(el: HTMLElement): DOMRect {
  const styles = getComputedStyle(el);
  if (!localTransform(styles)) return el.getBoundingClientRect();

  const value = el.style.getPropertyValue('transform');
  const priority = el.style.getPropertyPriority('transform');
  el.style.setProperty('transform', 'none', 'important');
  try {
    return el.getBoundingClientRect();
  } finally {
    if (value) el.style.setProperty('transform', value, priority);
    else el.style.removeProperty('transform');
  }
}

function measureLocalRect(el: HTMLElement, wrapper: HTMLElement, wrapperRect: DOMRect): LocalRect {
  const rect = measureUntransformedClientRect(el);
  const scaleX = wrapperRect.width / (wrapper.offsetWidth || wrapperRect.width || 1) || 1;
  const scaleY = wrapperRect.height / (wrapper.offsetHeight || wrapperRect.height || 1) || 1;
  return {
    left: (rect.left - wrapperRect.left) / scaleX,
    top: (rect.top - wrapperRect.top) / scaleY,
    width: rect.width / scaleX,
    height: rect.height / scaleY,
  };
}

function hasUsableRect(rect: LocalRect): boolean {
  return rect.width > 0 && rect.height > 0;
}

function collectSharedElements(root: HTMLElement): Map<string, HTMLElement> {
  const elements = new Map<string, HTMLElement>();
  for (const el of root.querySelectorAll<HTMLElement>(SHARED_ELEMENT_SELECTOR)) {
    const id = el.dataset.osdSharedElement;
    if (id && !elements.has(id)) elements.set(id, el);
  }
  return elements;
}

function shouldSkipCopiedStyle(
  source: HTMLElement,
  styles: CSSStyleDeclaration,
  prop: string,
  preserveInheritedVisualStyle: boolean,
): boolean {
  if (prop === TEXT_FILL_COLOR_PROPERTY && getStyleProperty(styles, prop) === styles.color) {
    return true;
  }

  if (!preserveInheritedVisualStyle || !INHERITED_VISUAL_PROPERTIES.has(prop)) return false;

  const parent = source.parentElement;
  if (!parent) return false;

  const parentStyles = getComputedStyle(parent);
  return getStyleProperty(styles, prop) === getStyleProperty(parentStyles, prop);
}

function copyComputedStyles(
  source: HTMLElement,
  target: HTMLElement,
  preserveInheritedVisualStyle = false,
): void {
  const styles = getComputedStyle(source);
  for (let i = 0; i < styles.length; i++) {
    const prop = styles[i];
    if (shouldSkipCopiedStyle(source, styles, prop, preserveInheritedVisualStyle)) continue;
    target.style.setProperty(prop, styles.getPropertyValue(prop), styles.getPropertyPriority(prop));
  }

  const sourceChildren = source.querySelectorAll<HTMLElement>('*');
  const targetChildren = target.querySelectorAll<HTMLElement>('*');
  for (let i = 0; i < sourceChildren.length; i++) {
    const child = targetChildren[i];
    if (!child) continue;
    copyComputedStyles(sourceChildren[i], child, true);
  }
}

function cloneSharedElement(source: HTMLElement): HTMLElement {
  const clone = source.cloneNode(true) as HTMLElement;
  copyComputedStyles(source, clone);
  clone.removeAttribute('data-osd-shared-element');
  return clone;
}

function parsePx(value: string): number | null {
  const match = value.trim().match(/^(-?\d*\.?\d+)px$/);
  if (!match) return null;
  const n = Number.parseFloat(match[1]);
  return Number.isFinite(n) ? n : null;
}

function scaleRadius(value: string, scaleX: number, scaleY: number): string {
  const parts = value.trim().split(/\s+/);
  const x = parsePx(parts[0] ?? '');
  const y = parsePx(parts[1] ?? parts[0] ?? '');
  if (x === null || y === null) return value;
  const nextX = x / scaleX;
  const nextY = y / scaleY;
  return Math.abs(nextX - nextY) < 0.001 ? `${nextX}px` : `${nextX}px ${nextY}px`;
}

function radiusKeyframe(styles: CSSStyleDeclaration, scaleX = 1, scaleY = 1): Keyframe {
  return {
    borderTopLeftRadius: scaleRadius(styles.borderTopLeftRadius, scaleX, scaleY),
    borderTopRightRadius: scaleRadius(styles.borderTopRightRadius, scaleX, scaleY),
    borderBottomRightRadius: scaleRadius(styles.borderBottomRightRadius, scaleX, scaleY),
    borderBottomLeftRadius: scaleRadius(styles.borderBottomLeftRadius, scaleX, scaleY),
  };
}

function localTransform(styles: CSSStyleDeclaration): string {
  return styles.transform && styles.transform !== 'none' ? styles.transform : '';
}

function sharedElementTransform(
  rect: LocalRect,
  scaleX: number,
  scaleY: number,
  local: string,
): string {
  return [`translate(${rect.left}px, ${rect.top}px)`, `scale(${scaleX}, ${scaleY})`, local]
    .filter(Boolean)
    .join(' ');
}

function sharedElementTranslateTransform(rect: LocalRect, local: string): string {
  return [`translate(${rect.left}px, ${rect.top}px)`, local].filter(Boolean).join(' ');
}

function getStyleProperty(styles: CSSStyleDeclaration, css: string): string {
  return styles.getPropertyValue(css);
}

function visualStyleKeyframe(
  styles: CSSStyleDeclaration,
  opacity?: string,
  options: { includeBorderColors?: boolean } = {},
): Keyframe {
  const frame: Record<string, string> = {};
  for (const prop of SHARED_ELEMENT_VISUAL_PROPERTIES) {
    if (
      options.includeBorderColors === false &&
      (BORDER_COLOR_PROPERTIES as readonly string[]).includes(prop)
    ) {
      continue;
    }
    const value = getStyleProperty(styles, prop);
    if (prop === TEXT_FILL_COLOR_PROPERTY && value === styles.color) continue;
    if (value) frame[prop] = value;
  }
  if (opacity !== undefined) frame.opacity = opacity;
  return frame;
}

function hideBorderColors(el: HTMLElement): void {
  for (const { color } of BORDER_SIDE_PROPERTIES) {
    el.style[color] = 'transparent';
  }
}

function isVisibleBorderSide(
  styles: CSSStyleDeclaration,
  side: (typeof BORDER_SIDE_PROPERTIES)[number],
): boolean {
  const width = parsePx(getStyleProperty(styles, side.cssWidth)) ?? 0;
  const borderStyle = getStyleProperty(styles, side.cssStyle);
  return width > 0 && borderStyle !== 'none' && borderStyle !== 'hidden';
}

function hasVisibleBorder(styles: CSSStyleDeclaration): boolean {
  return BORDER_SIDE_PROPERTIES.some((side) => isVisibleBorderSide(styles, side));
}

function borderFrameKeyframe(
  rect: LocalRect,
  styles: CSSStyleDeclaration,
  opacity: string,
): Keyframe {
  const frame: Keyframe = {
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    opacity,
    transform: sharedElementTranslateTransform(rect, localTransform(styles)),
    ...radiusKeyframe(styles),
  };

  for (const side of BORDER_SIDE_PROPERTIES) {
    frame[side.width] = getStyleProperty(styles, side.cssWidth);
    frame[side.color] = getStyleProperty(styles, side.cssColor);
  }

  return frame;
}

function appendBorderFrame(
  wrapper: HTMLElement,
  overlay: HTMLElement,
  sourceStyles: CSSStyleDeclaration,
  targetStyles: CSSStyleDeclaration,
  rect: LocalRect,
): HTMLElement {
  if (!overlay.parentElement) wrapper.appendChild(overlay);

  const frame = document.createElement('div');
  Object.assign(frame.style, {
    position: 'absolute',
    left: '0',
    top: '0',
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: '0',
    transformOrigin: 'top left',
    pointerEvents: 'none',
    boxSizing: 'border-box',
    background: 'transparent',
  });

  for (const side of BORDER_SIDE_PROPERTIES) {
    const styles = isVisibleBorderSide(sourceStyles, side) ? sourceStyles : targetStyles;
    frame.style[side.style] = getStyleProperty(styles, side.cssStyle);
    frame.style[side.width] = getStyleProperty(sourceStyles, side.cssWidth);
    frame.style[side.color] = getStyleProperty(sourceStyles, side.cssColor);
  }

  overlay.appendChild(frame);
  return frame;
}

function hasVisualStyleChange(from: CSSStyleDeclaration, to: CSSStyleDeclaration): boolean {
  for (const prop of SHARED_ELEMENT_VISUAL_PROPERTIES) {
    if (getStyleProperty(from, prop) !== getStyleProperty(to, prop)) return true;
  }
  return false;
}

function effectiveOpacity(el: HTMLElement, boundary: HTMLElement): string {
  let opacity = 1;
  let node: HTMLElement | null = el;
  while (node && node !== boundary) {
    const value = Number.parseFloat(getComputedStyle(node).opacity);
    if (Number.isFinite(value)) opacity *= value;
    node = node.parentElement;
  }
  return String(opacity);
}

function hideOriginal(el: HTMLElement): () => void {
  const value = el.style.getPropertyValue('visibility');
  const priority = el.style.getPropertyPriority('visibility');
  el.style.setProperty('visibility', 'hidden', 'important');
  return () => {
    if (value) el.style.setProperty('visibility', value, priority);
    else el.style.removeProperty('visibility');
  };
}

function appendPositionedClone(
  wrapper: HTMLElement,
  overlay: HTMLElement,
  source: HTMLElement,
  rect: LocalRect,
): HTMLElement {
  if (!overlay.parentElement) wrapper.appendChild(overlay);

  const clone = cloneSharedElement(source);
  Object.assign(clone.style, {
    position: 'absolute',
    left: '0',
    top: '0',
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: '0',
    transformOrigin: 'top left',
    pointerEvents: 'none',
    boxSizing: 'border-box',
  });
  overlay.appendChild(clone);
  return clone;
}

function sharedElementAnimationOptions(
  phase: ResolvedSharedElementTransition,
): KeyframeAnimationOptions {
  return {
    duration: phase.duration,
    easing: phase.easing,
    delay: phase.delay,
    fill: 'both',
  };
}

function runDescendantVisualStyleTransitions(
  clone: HTMLElement,
  source: HTMLElement,
  target: HTMLElement,
  phase: ResolvedSharedElementTransition,
): Animation[] {
  const animations: Animation[] = [];
  const cloneChildren = clone.querySelectorAll<HTMLElement>('*');
  const sourceChildren = source.querySelectorAll<HTMLElement>('*');
  const targetChildren = target.querySelectorAll<HTMLElement>('*');

  for (let i = 0; i < sourceChildren.length; i++) {
    const cloneChild = cloneChildren[i];
    const targetChild = targetChildren[i];
    if (!cloneChild || !targetChild) continue;

    const sourceStyles = getComputedStyle(sourceChildren[i]);
    const targetStyles = getComputedStyle(targetChild);
    if (!hasVisualStyleChange(sourceStyles, targetStyles)) continue;

    animations.push(
      cloneChild.animate(
        [visualStyleKeyframe(sourceStyles), visualStyleKeyframe(targetStyles)],
        sharedElementAnimationOptions(phase),
      ),
    );
  }

  return animations;
}

function runStationarySharedElementAnimation(
  clone: HTMLElement,
  rect: LocalRect,
  styles: CSSStyleDeclaration,
  fromOpacity: string,
  toOpacity: string,
  phase: ResolvedSharedElementTransition,
): Animation {
  const transform = sharedElementTransform(rect, 1, 1, localTransform(styles));
  return clone.animate(
    [
      {
        ...visualStyleKeyframe(styles, fromOpacity),
        ...radiusKeyframe(styles),
        transform,
      },
      {
        ...visualStyleKeyframe(styles, toOpacity),
        ...radiusKeyframe(styles),
        transform,
      },
    ],
    sharedElementAnimationOptions(phase),
  );
}

function runSharedElementTransition(
  wrapper: HTMLElement,
  outgoingLayer: HTMLElement,
  incomingLayer: HTMLElement,
  phase: ResolvedSharedElementTransition,
): { animations: Animation[]; cleanup: () => void } {
  const wrapperRect = wrapper.getBoundingClientRect();
  if (wrapperRect.width === 0 || wrapperRect.height === 0) {
    return { animations: [], cleanup: () => {} };
  }

  const incoming = collectSharedElements(incomingLayer);
  const overlay = document.createElement('div');
  overlay.setAttribute('data-osd-shared-layer', '');
  Object.assign(overlay.style, {
    position: 'absolute',
    inset: '0',
    zIndex: '2147483647',
    pointerEvents: 'none',
  });

  const animations: Animation[] = [];
  const restore: Array<() => void> = [];
  const outgoing = collectSharedElements(outgoingLayer);
  const handledIncoming = new Set<string>();

  for (const [id, source] of outgoing) {
    const target = incoming.get(id);
    const from = measureLocalRect(source, wrapper, wrapperRect);
    if (!hasUsableRect(from)) {
      if (target) {
        const to = measureLocalRect(target, wrapper, wrapperRect);
        if (hasUsableRect(to)) {
          handledIncoming.add(id);
          const clone = appendPositionedClone(wrapper, overlay, target, to);
          restore.push(hideOriginal(target));

          const targetStyles = getComputedStyle(target);
          animations.push(
            runStationarySharedElementAnimation(
              clone,
              to,
              targetStyles,
              '0',
              effectiveOpacity(target, incomingLayer),
              phase,
            ),
          );
        }
      }
      continue;
    }

    if (!target) {
      const clone = appendPositionedClone(wrapper, overlay, source, from);
      restore.push(hideOriginal(source));

      const sourceStyles = getComputedStyle(source);
      animations.push(
        runStationarySharedElementAnimation(
          clone,
          from,
          sourceStyles,
          effectiveOpacity(source, outgoingLayer),
          '0',
          phase,
        ),
      );
      continue;
    }

    const to = measureLocalRect(target, wrapper, wrapperRect);
    if (!hasUsableRect(to)) {
      const clone = appendPositionedClone(wrapper, overlay, source, from);
      restore.push(hideOriginal(source));

      const sourceStyles = getComputedStyle(source);
      animations.push(
        runStationarySharedElementAnimation(
          clone,
          from,
          sourceStyles,
          effectiveOpacity(source, outgoingLayer),
          '0',
          phase,
        ),
      );
      continue;
    }

    handledIncoming.add(id);

    const clone = appendPositionedClone(wrapper, overlay, source, from);
    restore.push(hideOriginal(source), hideOriginal(target));

    const sourceStyles = getComputedStyle(source);
    const targetStyles = getComputedStyle(target);
    const fromOpacity = effectiveOpacity(source, outgoingLayer);
    const toOpacity = effectiveOpacity(target, incomingLayer);
    const needsBorderFrame = hasVisibleBorder(sourceStyles) || hasVisibleBorder(targetStyles);
    const scaleX = to.width / from.width;
    const scaleY = to.height / from.height;
    const fromTransform = sharedElementTransform(from, 1, 1, localTransform(sourceStyles));
    const toTransform = sharedElementTransform(to, scaleX, scaleY, localTransform(targetStyles));

    if (needsBorderFrame) {
      hideBorderColors(clone);
      const borderFrame = appendBorderFrame(wrapper, overlay, sourceStyles, targetStyles, from);
      animations.push(
        borderFrame.animate(
          [
            borderFrameKeyframe(from, sourceStyles, fromOpacity),
            borderFrameKeyframe(to, targetStyles, toOpacity),
          ],
          sharedElementAnimationOptions(phase),
        ),
      );
    }

    animations.push(
      clone.animate(
        [
          {
            ...visualStyleKeyframe(sourceStyles, fromOpacity, {
              includeBorderColors: !needsBorderFrame,
            }),
            ...radiusKeyframe(sourceStyles),
            transform: fromTransform,
          },
          {
            ...visualStyleKeyframe(targetStyles, toOpacity, {
              includeBorderColors: !needsBorderFrame,
            }),
            ...radiusKeyframe(targetStyles, scaleX, scaleY),
            transform: toTransform,
          },
        ],
        sharedElementAnimationOptions(phase),
      ),
      ...runDescendantVisualStyleTransitions(clone, source, target, phase),
    );
  }

  for (const [id, target] of incoming) {
    if (handledIncoming.has(id) || outgoing.has(id)) continue;

    const to = measureLocalRect(target, wrapper, wrapperRect);
    if (!hasUsableRect(to)) continue;

    const clone = appendPositionedClone(wrapper, overlay, target, to);
    restore.push(hideOriginal(target));

    const targetStyles = getComputedStyle(target);
    animations.push(
      runStationarySharedElementAnimation(
        clone,
        to,
        targetStyles,
        '0',
        effectiveOpacity(target, incomingLayer),
        phase,
      ),
    );
  }

  if (animations.length === 0) overlay.remove();

  let cleaned = false;
  return {
    animations,
    cleanup: () => {
      if (cleaned) return;
      cleaned = true;
      for (const fn of restore) fn();
      overlay.remove();
    },
  };
}

export function SlideTransitionLayer({
  pages,
  index,
  total,
  moduleTransition,
  disabled,
  stepControllerRef,
  entryDirection = 'jump',
  onStepAggregateChange,
}: Props) {
  const [current, setCurrent] = useState(index);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const [direction, setDirection] = useState<Direction>('forward');

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const outgoingLayerRef = useRef<HTMLDivElement | null>(null);
  const incomingLayerRef = useRef<HTMLDivElement | null>(null);
  const animsRef = useRef<Animation[]>([]);
  const cleanupRef = useRef<(() => void) | null>(null);
  const currentRef = useRef(current);
  currentRef.current = current;

  useEffect(() => {
    if (index === currentRef.current) return;

    const prev = currentRef.current;
    const next = index;

    // Interrupt: cancel in-flight animations. The previously-incoming page
    // (currentRef) becomes the new outgoing; React reuses its DOM slot.
    for (const a of animsRef.current) {
      try {
        a.cancel();
      } catch {}
    }
    animsRef.current = [];
    cleanupRef.current?.();
    cleanupRef.current = null;

    const transition = resolveTransition(pages, next, moduleTransition);
    if (disabled || !transition) {
      setCurrent(next);
      setOutgoing(null);
      return;
    }

    setDirection(next > prev ? 'forward' : 'backward');
    setOutgoing(prev);
    setCurrent(next);
  }, [index, pages, moduleTransition, disabled]);

  useLayoutEffect(() => {
    if (outgoing === null) return;

    const transition = resolveTransition(pages, current, moduleTransition);
    const wrapper = wrapperRef.current;
    const out = outgoingLayerRef.current;
    const inc = incomingLayerRef.current;
    if (!transition || !wrapper || !out || !inc) {
      setOutgoing(null);
      return;
    }

    wrapper.dataset.osdDir = direction;
    wrapper.style.setProperty('--osd-dir', direction === 'forward' ? '1' : '-1');

    const easing = transition.easing ?? DEFAULT_EASING;
    const duration = transition.duration;

    const anims: Animation[] = [];
    const exitAnim = runPhase(out, transition.exit, duration, easing);
    const enterAnim = runPhase(inc, transition.enter, duration, easing);
    if (exitAnim) anims.push(exitAnim);
    if (enterAnim) anims.push(enterAnim);

    const cleanups: Array<() => void> = [];
    const sharedPhase = resolveSharedElementTransition(transition.sharedElements, duration, easing);
    if (sharedPhase) {
      const shared = runSharedElementTransition(wrapper, out, inc, sharedPhase);
      anims.push(...shared.animations);
      cleanups.push(shared.cleanup);
      if (!exitAnim && shared.animations.length > 0) cleanups.push(hideOriginal(out));
    }
    animsRef.current = anims;

    if (anims.length === 0) {
      for (const fn of cleanups) fn();
      setOutgoing(null);
      return;
    }

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      for (const fn of cleanups) fn();
      if (cleanupRef.current === cleanup) cleanupRef.current = null;
    };
    cleanupRef.current = cleanup;

    let cancelled = false;
    Promise.all(anims.map((a) => a.finished))
      .then(() => {
        if (cancelled) return;
        cleanup();
        animsRef.current = [];
        setOutgoing(null);
      })
      .catch(() => {
        // AbortError fires when we cancel mid-flight on an interrupt.
      });

    return () => {
      cancelled = true;
    };
  }, [outgoing, current, direction, pages, moduleTransition]);

  useEffect(() => {
    return () => {
      for (const a of animsRef.current) {
        try {
          a.cancel();
        } catch {}
      }
      animsRef.current = [];
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  const CurrentPage = pages[current];
  const OutgoingPage = outgoing !== null ? pages[outgoing] : null;

  // Outgoing layer mirrors the direction we just navigated so its <Steps>
  // re-mounts in the state the audience just saw: forward nav → outgoing was
  // fully revealed; backward nav → outgoing was at zero reveals.
  const outgoingEntryDirection: EntryDirection =
    entryDirection === 'backward' ? 'forward' : 'backward';

  const noopControllerRef = useRef<StepController | null>(null);
  const activeControllerRef = stepControllerRef ?? noopControllerRef;

  return (
    <div
      ref={wrapperRef}
      className="relative h-full w-full overflow-hidden"
      style={{ background: 'var(--osd-bg)' }}
    >
      {OutgoingPage && outgoing !== null ? (
        <div ref={outgoingLayerRef} className="absolute inset-0">
          <SlidePageProvider index={outgoing} total={total}>
            <StepHost
              isActivePage={false}
              entryDirection={outgoingEntryDirection}
              controllerRef={activeControllerRef}
            >
              <OutgoingPage />
            </StepHost>
          </SlidePageProvider>
        </div>
      ) : null}
      {CurrentPage ? (
        <div ref={incomingLayerRef} className="absolute inset-0">
          <SlidePageProvider index={current} total={total}>
            <StepHost
              isActivePage
              entryDirection={entryDirection}
              controllerRef={activeControllerRef}
              onAggregateChange={onStepAggregateChange}
            >
              <CurrentPage />
            </StepHost>
          </SlidePageProvider>
        </div>
      ) : null}
    </div>
  );
}
