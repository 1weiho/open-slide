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
};

export type MorphTransition = {
  duration?: number;
  easing?: string;
  delay?: number;
};

export function resolveTransition<TPage extends { transition?: SlideTransition }>(
  pages: TPage[],
  index: number,
  moduleDefault?: SlideTransition,
): SlideTransition | undefined {
  return pages[index]?.transition ?? moduleDefault;
}
