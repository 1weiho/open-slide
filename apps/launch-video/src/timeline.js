export const BPM = 120;
export const BEAT = 60 / BPM;
export const BAR = BEAT * 4;
export const DURATION = 78;

// Chapter hand-offs: the next scene rises as a rounded card over the current
// one, which recedes behind it. The card lands fully at `t + CARD / 2`.
export const CARD = 0.8;
export const TRANSITIONS = [
  { t: 10.2, from: 'logo', to: 'editor' },
  { t: 28.25, from: 'editor', to: 'pptx' },
  { t: 42.25, from: 'pptx', to: 'ui' },
  { t: 54.2, from: 'ui', to: 'fonts' },
  { t: 66.15, from: 'stack', to: 'finale' },
];

export const SPANS = {
  hook: [0, 6.4],
  logo: [5.6, 10.2 + CARD / 2],
  editor: [10.2 - CARD / 2, 28.25 + CARD / 2],
  pptx: [28.25 - CARD / 2, 42.25 + CARD / 2],
  ui: [42.25 - CARD / 2, 54.2 + CARD / 2],
  fonts: [54.2 - CARD / 2, 60.0],
  stack: [60.0, 66.15 + CARD / 2],
  finale: [66.15 - CARD / 2, DURATION],
};

// Big downbeats: drive camera shake + flash in the post layer and the impact
// voices in the soundtrack.
export const HITS = [
  { t: 8.0, amount: 1, flash: 1 },
  { t: 30.0, amount: 0.55 },
  { t: 60.0, amount: 0.8 },
  { t: 60.5, amount: 0.6 },
  { t: 61.0, amount: 0.6 },
  { t: 61.5, amount: 0.8 },
  { t: 70.0, amount: 1, flash: 0.8 },
];
