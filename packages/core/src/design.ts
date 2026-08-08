export type DesignPalette = {
  bg: string;
  text: string;
  accent: string;
};

export type DesignFonts = {
  display: string;
  body: string;
};

export type DesignTypeScale = {
  hero: number;
  body: number;
};

export type DesignSystem = {
  palette: DesignPalette;
  fonts: DesignFonts;
  typeScale: DesignTypeScale;
  radius: number;
};

export function designToCssVars(d: DesignSystem): Record<string, string> {
  return {
    '--osd-bg': d.palette.bg,
    '--osd-text': d.palette.text,
    '--osd-accent': d.palette.accent,
    '--osd-font-display': d.fonts.display,
    '--osd-font-body': d.fonts.body,
    '--osd-size-hero': `${d.typeScale.hero}px`,
    '--osd-size-body': `${d.typeScale.body}px`,
    '--osd-radius': `${d.radius}px`,
  };
}

export function cssVarsToString(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');
}

export const defaultDesign: DesignSystem = {
  palette: {
    bg: '#f7f5f0',
    text: '#1a1814',
    accent: '#6d4cff',
  },
  fonts: {
    display: 'Georgia, "Times New Roman", serif',
    body: '-apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif',
  },
  typeScale: {
    hero: 168,
    body: 36,
  },
  radius: 12,
};
