import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('my-story-30min slide 14', () => {
  it('adds the captain full-context slide after TakingResponsibility and documents it in notes', () => {
    const source = readFileSync(join(import.meta.dirname, 'index.tsx'), 'utf8');

    expect(source).toContain('const FullContextCaptain: Page = () =>');
    expect(source).toContain('隊長不是什麼都做，但要知道全部的東西。');
    expect(source).toContain('每一塊不一定都自己做，但每一塊都要知道現在到哪、哪裡會掉、掉了誰補。');
    expect(source).toContain('不是每件事都自己做，但每件事都不能完全不知道。');
    expect(source).toMatch(/TakingResponsibility,\s+FullContextCaptain,/);
    expect(source).toContain('講分工之後的下一層：隊長不是什麼都自己做，但要知道全局。');
  });
});
