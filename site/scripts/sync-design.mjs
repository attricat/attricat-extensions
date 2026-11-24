import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Snapshot the canonical design repository so the site builds without it.
// src/design/tokens.ts turns these tokens into CSS custom properties at build time.
// Usage: pnpm sync:design [path-to-design-repo]; then update the commit in src/design/README.md.
const source = resolve(process.argv[2] ?? '../../design');
for (const name of ['colors', 'typography', 'spacing', 'radius', 'elevation']) {
  copyFileSync(`${source}/tokens/${name}.json`, `src/design/${name}.json`);
}
copyFileSync(`${source}/assets/logos/favicon.svg`, 'public/favicon.svg');
