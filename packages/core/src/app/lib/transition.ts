import type { Page } from './sdk';

export type TransitionPhase = {
  keyframes: Keyframe[] | PropertyIndexedKeyframes;
  easing?: string;
  duration?: number;
  delay?: number;
};

export type SlideTransition = {
  duration: number;
  easing?: string;
  enter?: TransitionPhase;
  exit?: TransitionPhase;
  morph?: boolean | MorphTransition;
  throughBackground?: boolean;
};

export type MorphTransition = {
  duration?: number;
  easing?: string;
  delay?: number;
};

export function resolveTransition(
  pages: Page[],
  index: number,
  moduleDefault?: SlideTransition,
): SlideTransition | undefined {
  return pages[index]?.transition ?? moduleDefault;
}

export function holdOpacity(phase: TransitionPhase | undefined): TransitionPhase | undefined {
  if (!phase) return phase;
  if (Array.isArray(phase.keyframes)) {
    return {
      ...phase,
      keyframes: phase.keyframes.map(({ opacity: _opacity, ...frame }) => frame),
    };
  }
  const { opacity: _opacity, ...keyframes } = phase.keyframes;
  return { ...phase, keyframes };
}
