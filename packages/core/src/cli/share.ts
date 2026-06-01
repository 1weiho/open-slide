import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export type ShareProvider = 'tailscale';

export type ShareResult = {
  provider: ShareProvider;
  url: string | null;
  statusCommand: string;
  stopCommand: string | null;
};

export type TailscaleRunner = {
  run(command: string, args: string[], opts?: { timeoutMs?: number }): Promise<string>;
};

const defaultRunner: TailscaleRunner = {
  async run(command, args, opts) {
    try {
      const { stdout } = await execFileAsync(command, args, {
        ...(opts?.timeoutMs !== undefined ? { timeout: opts.timeoutMs } : {}),
      });
      return stdout;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(
          'tailscale CLI not found. Install Tailscale and make sure `tailscale` is on PATH.',
        );
      }
      throw err;
    }
  },
};

function parseTailscaleIpv4(rawIp: string): string | null {
  const [first] = rawIp.trim().split(/\s+/);
  return first && /^\d{1,3}(?:\.\d{1,3}){3}$/.test(first) ? first : null;
}

export async function createTailscaleShare(
  port: number,
  runner: TailscaleRunner = defaultRunner,
): Promise<ShareResult> {
  let rawIp = '';
  try {
    rawIp = await runner.run('tailscale', ['ip', '-4']);
  } catch {
    rawIp = '';
  }
  const ip = parseTailscaleIpv4(rawIp);
  return {
    provider: 'tailscale',
    url: ip ? `http://${ip}:${port}/` : null,
    statusCommand: 'tailscale status',
    stopCommand: null,
  };
}
