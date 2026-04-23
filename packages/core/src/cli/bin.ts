#!/usr/bin/env node
import chalk from 'chalk';
import { run } from './run.ts';

run(process.argv.slice(2)).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`${chalk.red('error:')} ${message}\n`);
  process.exit(1);
});
