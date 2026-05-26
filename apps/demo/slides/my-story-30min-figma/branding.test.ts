import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('my-story-30min slide 7 branding', () => {
  it('uses brand assets instead of hand-drawn platform icons', () => {
    const source = readFileSync(join(import.meta.dirname, 'index.tsx'), 'utf8');

    expect(source).toContain('nicee-app-icon.jpg');
    expect(source).toContain('tcs12-badge.svg');
    expect(source).toContain('mcdonaldsGoldenArches');
    expect(source).toContain('FestivalBadge');
    expect(source).toContain('TCS12');
    expect(source).not.toContain('https://is1-ssl.mzstatic.com');
    expect(source).not.toContain('nicee-badge.svg');
    expect(source).not.toContain('weplayBadgeSrc');
    expect(source).not.toContain('youtubeBadgeSrc');
    expect(source).not.toContain('title="YouTuber"');
    expect(source).not.toContain('const YouTubeIcon = () =>');
    expect(source).not.toContain('const WePlayIcon = () =>');
    expect(source).not.toContain('const McDonaldsIcon = () =>');
  });
});
