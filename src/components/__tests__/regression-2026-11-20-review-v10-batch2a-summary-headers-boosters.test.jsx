// @vitest-environment happy-dom
// ─────────────────────────────────────────────────────────────────────────
// Review v10, Batch 2a (owner answers 2026-11-20, "Approve them all";
// docs/archive/decisions-2026-11-20-review-v10.md): the summary line at the
// top of the results, the card headers, and the booster line under the brands.
//
//   P5–P7   summary line: "may (also) be offered (shared clinical
//           decision-making)"; "two injections or one MenABCWY injection"
//   P8–P11  card headers: "Due today, boosters to follow", "Shared decision
//           today", "Booster due later", "Answer needed below"
//   P24–P30 booster lines: say from when; no "(ongoing)", no "primary";
//           "Booster due [date]" (no spaced hyphen)
//
// Siblings given the same edit (named in the PR): the two other "two separate
// shots or one combined pentavalent shot" and "optional (shared clinical
// decision)" summary lines, the dual-due banner, and the "(ongoing)" endings
// on the infant high-risk and MenB high-risk booster lines.
// Style rule 4 (no semicolons) kept, owner 2026-11-20: each approved ";"
// became a comma or a period.
// ─────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Results from '../Results.jsx';
import { recommend } from '../../logic/recommend.js';

const TODAY = '2026-11-20';
function Harness({ initial }) {
  const [state, setState] = useState(initial);
  return <Results state={state} onChange={(p) => setState((s) => ({ ...s, ...p }))} onReset={() => {}} />;
}
const screenText = (input) => {
  const { container } = render(<Harness initial={{ today: TODAY, menacwyDoses: [], menbDoses: [], riskIds: [], ...input }} />);
  return container.textContent.replace(/\s+/g, ' ');
};
const rec = (input) => recommend({ today: TODAY, menacwyDoses: [], menbDoses: [], riskIds: [], ...input });
const strip = (s) => (s || '').replace(/\s*\[c\]/g, '');

describe('Review v10 Batch 2a: summary line, card headers, booster lines', () => {
  it('P5: healthy 17-year-old with a MenACWY dose at 16, nothing else due', () => {
    const t = screenText({ dob: '2009-06-01', menacwyDoses: [{ brand: 'Menveo 2-vial', date: '2021-06-15' }, { brand: 'Menveo 2-vial', date: '2025-06-15' }] });
    expect(t).toContain('No MenACWY dose is due today. MenB may be offered today by shared clinical decision-making.');
    // extinct: P5's old summary line.
    expect(t).not.toContain('No other MenACWY or MenB doses due today');
  });

  it('P6 and P7: the summary line names MenB as "may also be offered", and the combined shot one way', () => {
    const t17 = screenText({ dob: '2009-06-01' });
    expect(t17).toMatch(/Due today: MenACWY\. MenB may also be offered \(shared clinical decision-making\)\.|Due today: MenACWY and MenB, as two injections or one MenABCWY injection\./);
    const asp = screenText({ dob: '2014-06-01', riskIds: ['asplenia'] });
    expect(asp).toContain('Due today: MenACWY and MenB, as two injections or one MenABCWY injection.');
    // extinct: the pre-P7 summary wording.
    expect(asp).not.toContain('two separate shots or one combined pentavalent shot');
  });

  it('P8 and P10: card headers', () => {
    const asp = screenText({ dob: '2021-06-01', riskIds: ['asplenia'] });
    expect(asp).toContain('Due today, boosters to follow');
    const after = screenText({ dob: '2013-06-01', menacwyDoses: [{ brand: 'Menveo 2-vial', date: '2025-06-15' }] });
    expect(after).toContain('Booster due later');
    // extinct: the old header wording.
    expect(asp + after).not.toMatch(/future boosters? needed/i);
  });

  it('P9: the shared-decision header', () => {
    const t = screenText({ dob: '2009-06-01', menacwyDoses: [{ brand: 'Menveo 2-vial', date: '2021-06-15' }, { brand: 'Menveo 2-vial', date: '2025-06-15' }] });
    expect(t).toContain('Shared decision today');
    // extinct: "Optional today - shared decision".
    expect(t).not.toContain('Optional today - shared decision');
  });

  it('P30: the booster date line reads "Booster due [date]."', () => {
    const t = screenText({ dob: '2013-06-01', menacwyDoses: [{ brand: 'Menveo 2-vial', date: '2025-06-15' }] });
    expect(t).toMatch(/Booster due (about )?[A-Z][a-z]{2} \d{1,2}, \d{4}\./);
    // extinct: the spaced hyphen.
    expect(t).not.toContain('Booster not yet due -');
  });

  it('P24: infant high-risk booster line says from when', () => {
    const a = rec({ dob: '2026-07-01', riskIds: ['asplenia'] }).menacwy[0];
    expect(strip(a.boosterSummary)).toBe('Boosters: 3 years after the series, then every 5 years while at risk');
  });

  it('P25: high-risk MenACWY booster line, one sentence, no "primary"', () => {
    const a = rec({ dob: '2021-06-01', riskIds: ['asplenia'] }).menacwy[0];
    expect(strip(a.boosterSummary)).toBe('Boosters: 3 years after the series if it ends before 7 years, otherwise 5, then every 5 years while at risk');
  });

  it('P27 and P28: travel and lab-exposure lines, no "(ongoing)"', () => {
    expect(strip(rec({ ageMonths: 300, riskIds: ['travel'] }).menacwy[0].boosterSummary)).toBe('Boosters: every 5 years while travel continues');
    expect(strip(rec({ ageMonths: 300, riskIds: ['microbiologist'] }).menacwy[0].boosterSummary)).toBe('Boosters: every 5 years while exposure continues');
  });

  it('P29: MenB high-risk booster line says from when', () => {
    const b = rec({ dob: '2014-06-01', riskIds: ['asplenia'] }).menb[0];
    expect(strip(b.boosterSummary)).toBe('Boosters: 1 year after the series, then every 2–3 years while at risk');
  });

  it('no booster line anywhere says "(ongoing)", "first in" or "at high risk"', () => {
    const lines = [];
    for (const riskIds of [['asplenia'], ['complement'], ['hiv'], ['travel'], ['microbiologist']]) {
      for (const dob of ['2026-07-01', '2021-06-01', '2014-06-01', '2000-06-01']) {
        const out = rec({ dob, riskIds });
        for (const r of [...out.menacwy, ...out.menb]) if (r.boosterSummary) lines.push(r.boosterSummary);
      }
    }
    expect(lines.length).toBeGreaterThan(0);
    // extinct: P24–P29's retired phrasings.
    for (const l of lines) expect(l).not.toMatch(/\(ongoing\)|first in \d|at high risk|primary series/);
  });
});
