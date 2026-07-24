// 2026-07-24: coverage for the CITATIONS single-table redesign (2026-07-23
// citation audit handoff) — resolveRefs() stays a whole-page chip link (no
// #:~:text= fragment), cite() builds the per-sentence deep-link from `quote`
// and surfaces that same quote as the tooltip label (2026-07-23 owner
// decision: quote shows on hover).
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
  it('builds a [N] marker whose url deep-links to the exact quoted sentence', () => {
    const c = cite(1, 'acwyRoutine1112and16');
    expect(c.marker).toBe('[1]');
    expect(c.url).toBe(
      `${CITATIONS.acwyRoutine1112and16.url}#:~:text=${encodeURIComponent(CITATIONS.acwyRoutine1112and16.quote)}`
    );
  });

  it('label is the exact quoted sentence (used as the hover tooltip)', () => {
    const c = cite(1, 'boosterBeforeAge7');
    expect(c.label).toBe(CITATIONS.boosterBeforeAge7.quote);
  });
});
