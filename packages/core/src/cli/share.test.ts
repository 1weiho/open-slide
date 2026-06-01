import { describe, expect, it } from 'vitest';
import { createTailscaleShare } from './share.ts';

describe('createTailscaleShare', () => {
  it('uses the local Tailscale IPv4 address for a tailnet URL', async () => {
    const commands: string[][] = [];
    const share = await createTailscaleShare(5173, {
      run: async (command, args) => {
        commands.push([command, ...args]);
        return '100.124.194.22\n';
      },
    });

    expect(commands).toEqual([['tailscale', 'ip', '-4']]);
    expect(share.url).toBe('http://100.124.194.22:5173/');
    expect(share.stopCommand).toBeNull();
  });

  it('falls back to status guidance when Tailscale does not report an IPv4 address', async () => {
    const share = await createTailscaleShare(5173, {
      run: async () => '',
    });

    expect(share.url).toBeNull();
    expect(share.statusCommand).toBe('tailscale status');
  });

  it('falls back to status guidance when Tailscale IP lookup fails', async () => {
    const share = await createTailscaleShare(5173, {
      run: async () => {
        throw new Error('ip lookup failed');
      },
    });

    expect(share.url).toBeNull();
    expect(share.statusCommand).toBe('tailscale status');
  });
});
