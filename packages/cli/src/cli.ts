#!/usr/bin/env node
import { run } from './index.ts';

run(process.argv.slice(2)).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exit(1);
});
