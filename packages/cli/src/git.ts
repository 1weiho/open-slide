import { spawn } from 'node:child_process';

const IS_WINDOWS = process.platform === 'win32';

interface RunResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

async function run(cmd: string, args: string[], cwd: string): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], shell: IS_WINDOWS });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (d: Buffer) => {
      stdout += d.toString();
    });
    child.stderr?.on('data', (d: Buffer) => {
      stderr += d.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

export async function isGitAvailable(): Promise<boolean> {
  try {
    const res = await run('git', ['--version'], process.cwd());
    return res.code === 0;
  } catch {
    return false;
  }
}

export async function isInsideWorkTree(cwd: string): Promise<boolean> {
  try {
    const res = await run('git', ['rev-parse', '--is-inside-work-tree'], cwd);
    return res.code === 0 && res.stdout.trim() === 'true';
  } catch {
    return false;
  }
}

export interface GitInitResult {
  status: 'committed' | 'skipped-nested' | 'skipped-no-git' | 'failed';
  message?: string;
}

export async function gitInitAndCommit(target: string): Promise<GitInitResult> {
  if (!(await isGitAvailable())) {
    return { status: 'skipped-no-git', message: 'git binary not found on PATH' };
  }

  if (await isInsideWorkTree(target)) {
    return {
      status: 'skipped-nested',
      message: 'target is already inside a git work tree; leaving parent repo alone',
    };
  }

  const init = await run('git', ['init'], target);
  if (init.code !== 0) {
    return {
      status: 'failed',
      message: `git init failed: ${init.stderr.trim() || init.stdout.trim()}`,
    };
  }

  const add = await run('git', ['add', '-A'], target);
  if (add.code !== 0) {
    return {
      status: 'failed',
      message: `git add failed: ${add.stderr.trim() || add.stdout.trim()}`,
    };
  }

  const commit = await run('git', ['commit', '-m', 'chore: init open-slide project'], target);
  if (commit.code !== 0) {
    return {
      status: 'failed',
      message: `git commit failed: ${commit.stderr.trim() || commit.stdout.trim()}`,
    };
  }

  return { status: 'committed' };
}
