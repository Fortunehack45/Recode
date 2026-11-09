#!/usr/bin/env node

// Recode Terminal CLI Executable
import("../dist/index.js").catch((err) => {
  console.error(err);
  process.exit(1);
});
