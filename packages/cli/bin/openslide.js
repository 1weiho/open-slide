#!/usr/bin/env node
import { run } from '../src/index.js';

run(process.argv.slice(2)).catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});
