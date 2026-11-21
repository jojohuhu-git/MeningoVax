// The stylesheet has no broken block.
//
// Found 2026-11-21: `npm run build` printed two warnings about App.css. The
// cause was a block of style lines with no name in front of it (its first line,
// `.howpath-toggle {`, was left behind when PneumoVax's Rulebook styles were
// copied in, #120). A browser reading a nameless block runs on into the NEXT
// rule and throws that one away too: in the running app, `.rb-who` was missing
// from the page's styles. Nothing showed, because no screen uses `.rb-who` yet;
// the next rule written there would have vanished without a trace.
//
// The check is the same one the build runs (esbuild's CSS minifier): any warning
// fails this test, so the next broken block is named on `npm test`, not missed
// in a build log.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';

const cssPath = fileURLToPath(new URL('../../App.css', import.meta.url));

describe('App.css', () => {
  it('reads with no warnings, so no rule is silently dropped', async () => {
    const css = readFileSync(cssPath, 'utf8');
    const { warnings } = await transform(css, { loader: 'css', minify: true });
    const where = warnings.map(w => `line ${w.location?.line}: ${w.text} — ${w.location?.lineText?.trim()}`);
    expect(where).toEqual([]);
  });
});
