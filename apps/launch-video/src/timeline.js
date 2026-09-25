export const BPM = 120;
export const BEAT = 60 / BPM;
export const BAR = BEAT * 4;
export const DURATION = 78;

// Chevron wipes between chapters: the band fully covers the frame at `t`,
// which is also where the outgoing scene ends and the incoming one begins.
export const WIPES = [
  { t: 10.2, tone: 'paper' },
  { t: 28.25, tone: 'void' },
  { t: 42.25, tone: 'chrome' },
  { t: 54.2, tone: 'void' },
  { t: 66.15, tone: 'void' },
];

export const SPANS = {
  hook: [0, 6.4],
  logo: [5.6, 10.2],
  editor: [10.2, 28.25],
  pptx: [28.25, 42.25],
  ui: [42.25, 54.2],
  fonts: [54.2, 60.0],
  stack: [60.0, 66.15],
  finale: [66.15, DURATION],
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
