import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
const bin = path.resolve(here, '..', '..', 'bin.js');
const fixture = path.resolve(here, '..', 'fixture');
const pkg = JSON.parse(readFileSync(path.resolve(here, '..', '..', 'package.json'), 'utf8')) as {
  version: string;
};

function runCli(args: string[]): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [bin, ...args], { cwd: fixture });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

test.describe('Svelte CLI', () => {
  test('prints its version and command help', async () => {
    const version = await runCli(['--version']);
    expect(version.code).toBe(0);
    expect(version.stdout.trim()).toBe(pkg.version);

    const help = await runCli(['--help']);
    expect(help.code).toBe(0);
    expect(help.stdout).toContain('Start the dev server');
    expect(help.stdout).toContain('Build a static site');
    expect(help.stdout).toContain('Preview the production build');
  });

  test('rejects invalid ports', async () => {
    const result = await runCli(['dev', '--port', 'abc']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Invalid port: abc');
  });
});
