#!/usr/bin/env node
import { run } from './run.ts';
import { formatError } from './ui.ts';

run(process.argv.slice(2)).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(formatError(message));
  process.exit(1);
});
