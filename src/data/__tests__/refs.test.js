// 2026-07-24: coverage for the CITATIONS single-table redesign (2026-07-23
// citation audit handoff) — resolveRefs() stays a whole-page chip link (no
// #:~:text= fragment), cite() builds the per-sentence deep-link from `quote`
// and surfaces that same quote as the tooltip label (2026-07-23 owner
// decision: quote shows on hover). Change 4 (2026-07-24): cite() takes only
// a key — the [N] number is no longer hardcoded here, RecCard assigns it at
// render time.
import { describe, it, expect } from 'vitest';
import { CITATIONS, resolveRefs, cite } from '../refs.js';

describe('resolveRefs', () => {
  it('resolves known keys to whole-page {url, label, short} chips', () => {
    const [chip] = resolveRefs(['acip2020']);
    expect(chip.url).toBe(CITATIONS.acip2020.url);
    expect(chip.url).not.toContain('#:~:text=');
    expect(chip.short).toBe('ACIP 2020 MMWR');
  });

  it('drops unknown keys', () => {
    expect(resolveRefs(['does-not-exist'])).toEqual([]);
  });

  it('never includes a #:~:text= fragment even for keys that also have a quote-bearing sibling entry', () => {
    const [chip] = resolveRefs(['acwyRoutine1112and16']);
    expect(chip.url).toBe(CITATIONS.acwyRoutine1112and16.url);
    expect(chip.url).not.toContain('#:~:text=');
  });
});

describe('cite', () => {
  it('carries the key and a url that deep-links to the exact quoted sentence', () => {
    const c = cite('acwyRoutine1112and16');
    expect(c.key).toBe('acwyRoutine1112and16');
    expect(c.url).toBe(
      `${CITATIONS.acwyRoutine1112and16.url}#:~:text=${encodeURIComponent(CITATIONS.acwyRoutine1112and16.quote)}`
    );
  });

  it('label is the exact quoted sentence (used as the hover tooltip)', () => {
    const c = cite('boosterBeforeAge7');
    expect(c.label).toBe(CITATIONS.boosterBeforeAge7.quote);
  });

  it('carries the plain page URL (no fragment) so RecCard can dedupe same-page citations', () => {
    const before = cite('boosterBeforeAge7');
    const after = cite('boosterAtOrAfterAge7');
    expect(before.page).toBe(CITATIONS.boosterBeforeAge7.url);
    expect(before.page).not.toContain('#:~:text=');
    // These two keys quote different sentences on the SAME MMWR page.
    expect(before.page).toBe(after.page);
    expect(before.url).not.toBe(after.url);
  });
});
