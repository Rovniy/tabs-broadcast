/**
 * Post-build steps:
 *  1. Copy the rolled-up declaration file to a `.d.cts` for the CJS/UMD `require` export.
 *  2. Emit `dist/version.js` (ESM) with the current package version, so the demo page can
 *     display the real version without any deploy-time placeholder substitution.
 */
import { copyFileSync, writeFileSync, readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

copyFileSync('dist/index.d.ts', 'dist/index.d.cts');
writeFileSync('dist/version.js', `export const version = ${JSON.stringify(pkg.version)};\n`);
