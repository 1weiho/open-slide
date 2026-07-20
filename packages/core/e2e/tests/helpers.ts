import { type ChildProcess, spawn } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type APIRequestContext, expect, type Locator, type Page } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));

export const coreRoot = path.resolve(here, '..', '..');
export const coreBin = path.join(coreRoot, 'bin.js');
export const fixtureDir = path.join(coreRoot, 'e2e', 'fixture');
export const devScratchDir = path.join(coreRoot, 'e2e', '.scratch', 'dev');

export function slideSourcePath(slideId: string, projectDir = devScratchDir): string {
  return path.join(projectDir, 'slides', slideId, 'index.tsx');
}

export function readSlideSource(slideId: string, projectDir = devScratchDir): Promise<string> {
  return fs.readFile(slideSourcePath(slideId, projectDir), 'utf8');
}

export function prepareScratchProject(name: string): string {
  const dir = path.join(coreRoot, 'e2e', '.scratch', name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  cpSync(fixtureDir, dir, {
    recursive: true,
    filter: (src) => path.basename(src) !== 'node_modules',
  });
  symlinkSync(path.join(fixtureDir, 'node_modules'), path.join(dir, 'node_modules'), 'junction');
  return dir;
}

export function editorCanvas(page: Page): Locator {
  return page.locator('main[data-inspector-root]');
}

// The first visit per page load holds an asset-warm loading gate (up to 15s),
// so slide opens always wait for the editor chrome to appear.
export async function openSlide(page: Page, slideId: string, query = ''): Promise<void> {
  await page.goto(`/s/${slideId}${query}`);
  await expect(editorCanvas(page)).toBeVisible({ timeout: 30_000 });
}

export async function enterPlayMode(page: Page): Promise<void> {
  await page.keyboard.press('Enter');
  await expect(editorCanvas(page)).toBeHidden();
}

export async function duplicateSlide(
  request: APIRequestContext,
  sourceId: string,
  newId: string,
): Promise<void> {
  const res = await request.post(`/__slides/${sourceId}/duplicate`, { data: { newId } });
  expect(res.ok()).toBe(true);
}

export async function deleteSlide(request: APIRequestContext, slideId: string): Promise<void> {
  await request.delete(`/__slides/${slideId}`);
}

export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

export interface CliResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

export function runCli(args: string[], cwd: string, timeoutMs = 180_000): Promise<CliResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [coreBin, ...args], {
      cwd,
      env: { ...process.env, OPEN_SLIDE_SKIP_SKILLS_CHECK: '1' },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`open-slide ${args.join(' ')} timed out after ${timeoutMs}ms\n${stderr}`));
    }, timeoutMs);
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}

export function startCliServer(args: string[], cwd: string): ChildProcess {
  return spawn(process.execPath, [coreBin, ...args], {
    cwd,
    stdio: 'ignore',
    env: { ...process.env, OPEN_SLIDE_SKIP_SKILLS_CHECK: '1' },
  });
}

export async function waitForHttpOk(url: string, timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown = null;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`server at ${url} never became ready: ${String(lastError)}`);
}

export async function stopServer(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.killed) return;
  const exited = new Promise<void>((resolve) => {
    child.once('exit', () => resolve());
  });
  child.kill('SIGTERM');
  await Promise.race([exited, new Promise((r) => setTimeout(r, 5_000))]);
  if (child.exitCode === null) child.kill('SIGKILL');
}
