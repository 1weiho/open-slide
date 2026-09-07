import { type DesignSystem, defaultDesign } from './design';

const SANS_SYSTEM = '-apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif';
const SANS_INTER = '"Inter", system-ui, sans-serif';
const SANS_HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const SERIF_GEORGIA = 'Georgia, "Times New Roman", serif';
const SERIF_TIMES = '"Times New Roman", Times, serif';
const MONO_SF = '"SF Mono", "JetBrains Mono", Menlo, monospace';

const designPresets: DesignSystem[] = [
  defaultDesign,
  {
    palette: { bg: '#0f1115', text: '#f5f3ee', accent: '#7cc4ff' },
    fonts: { display: SERIF_GEORGIA, body: SANS_SYSTEM },
    typeScale: { hero: 192, body: 32 },
    radius: 6,
  },
  {
    palette: { bg: '#eef1f4', text: '#1c2733', accent: '#ff6a5b' },
    fonts: { display: SANS_HELV, body: SANS_SYSTEM },
    typeScale: { hero: 156, body: 30 },
    radius: 8,
  },
  {
    palette: { bg: '#fdf6e3', text: '#073642', accent: '#b58900' },
    fonts: { display: SERIF_GEORGIA, body: SANS_INTER },
    typeScale: { hero: 144, body: 28 },
    radius: 14,
  },
  {
    palette: { bg: '#ede2cc', text: '#3a2a1a', accent: '#2f6e3a' },
    fonts: { display: SERIF_TIMES, body: SERIF_GEORGIA },
    typeScale: { hero: 168, body: 32 },
    radius: 4,
  },
  {
    palette: { bg: '#ffffff', text: '#0a0a0a', accent: '#e11d48' },
    fonts: { display: SANS_HELV, body: SANS_HELV },
    typeScale: { hero: 200, body: 28 },
    radius: 0,
  },
  {
    palette: { bg: '#fde9d9', text: '#3a1f3d', accent: '#f97316' },
    fonts: { display: SERIF_GEORGIA, body: SANS_SYSTEM },
    typeScale: { hero: 184, body: 36 },
    radius: 24,
  },
  {
    palette: { bg: '#e9f5ee', text: '#0f3324', accent: '#ec4899' },
    fonts: { display: SANS_INTER, body: SANS_INTER },
    typeScale: { hero: 160, body: 32 },
    radius: 16,
  },
  {
    palette: { bg: '#0a0a0a', text: '#f3edd9', accent: '#eab308' },
    fonts: { display: SERIF_GEORGIA, body: SANS_HELV },
    typeScale: { hero: 200, body: 32 },
    radius: 2,
  },
  {
    palette: { bg: '#ece2f5', text: '#2a1c4a', accent: '#facc15' },
    fonts: { display: SERIF_GEORGIA, body: SANS_SYSTEM },
    typeScale: { hero: 168, body: 34 },
    radius: 20,
  },
  {
    palette: { bg: '#101418', text: '#a7f3d0', accent: '#fbbf24' },
    fonts: { display: MONO_SF, body: MONO_SF },
    typeScale: { hero: 144, body: 24 },
    radius: 4,
  },
  {
    palette: { bg: '#fafafa', text: '#0a0a0a', accent: '#facc15' },
    fonts: { display: SANS_HELV, body: SANS_HELV },
    typeScale: { hero: 220, body: 32 },
    radius: 0,
  },
];

function pickRandom(): DesignSystem {
  const idx = Math.floor(Math.random() * designPresets.length);
  return designPresets[idx] ?? defaultDesign;
}

export function shuffleDesign(current?: DesignSystem | null): DesignSystem {
  if (designPresets.length === 0) return defaultDesign;
  if (designPresets.length === 1) return designPresets[0] ?? defaultDesign;
  const currentJson = current ? JSON.stringify(current) : null;
  for (let i = 0; i < 8; i++) {
    const pick = pickRandom();
    if (JSON.stringify(pick) !== currentJson) return pick;
  }
  return pickRandom();
}
