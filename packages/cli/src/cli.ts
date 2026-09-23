#!/usr/bin/env node
import { S_ERROR } from '@clack/prompts';
import chalk from 'chalk';
import { run } from './index.ts';

run(process.argv.slice(2)).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`\n  ${chalk.red(S_ERROR)} ${message}\n`);
  process.exit(1);
});
