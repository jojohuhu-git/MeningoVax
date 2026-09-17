// C5 (2026-07-23 handoff): "[c]" placeholder deep-links in `note` text, each
// paired with a `noteCites` entry (in order) pointing at the exact ACIP 2020
// MMWR sentence via a URL text-fragment (#:~:text=<phrase>). Every phrase
// here was verified live in a real browser against
// https://pmc.ncbi.nlm.nih.gov/articles/PMC7527029/ before being wired in —
// these tests only check the app attaches the right anchor to the right
// sentence, not the MMWR content itself.
// Change 4 (2026-07-24): recommend.js emits ordered {key, url, label}
// entries, not hardcoded [N] markers — RecCard assigns the visible number
// at render time. These logic-layer tests check the note text and the
// noteCites order/keys/urls, not the rendered [N] text.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { cite } from '../../data/refs.js';

const ACIP_ANCHORS = {
  acwyRoutine1112and16: cite('acwyRoutine1112and16').url,
  menbHealthy2Dose0and6: cite('menbHealthy2Dose0and6').url,
  boosterBeforeAge7: cite('boosterBeforeAge7').url,
  boosterAtOrAfterAge7: cite('boosterAtOrAfterAge7').url,
};

const TODAY = '2026-06-03';
function run(input) {
  return recommend({ today: TODAY, ...input });
}
const acwy = (r) => r.menacwy[0];
const menb = (r) => r.menb[0];

describe('C5 note-citation anchors', () => {
  it('routine MenACWY "not yet due" note cites the 11-12y/16y schedule', () => {
    const r = run({ ageMonths: 96, riskIds: [], menacwyDoses: [], menbDoses: [] });
    const rec = acwy(r);
    expect(rec.note).toContain('[c]');
    expect(rec.noteCites).toHaveLength(1);
    expect(rec.noteCites[0]).toMatchObject({ key: 'acwyRoutine1112and16', url: ACIP_ANCHORS.acwyRoutine1112and16 });
  });

  // U2 (2026-09-17): "A booster follows at 16 years" left the note -- the card's
  // booster line was already saying it -- and took its citation with it. The
  // source is still one click away, on the sentence that now makes the claim.
  it('routine MenACWY dose-1 cites the 11-12y/16y schedule on its booster line', () => {
    const r = run({ ageMonths: 132, riskIds: [], menacwyDoses: [], menbDoses: [] });
    const rec = acwy(r);
    expect(rec.boosterSummary).toContain('[c]');
    expect(rec.boosterCites[0]).toMatchObject({ key: 'acwyRoutine1112and16', url: ACIP_ANCHORS.acwyRoutine1112and16 });
  });

  // M16 (2026-09-15) revised both of these. C5's original point was that the
  // MISLABELED Penmenvy page (menbHealthySCDM1623Box, mm7501a2) must not be
  // cited -- that still holds and is still asserted. What changed is the second
  // half: C5 also pinned the REMOVAL of the preferred-age claim, on the
  // reasoning that it was absent from mm7349a3. It is absent from mm7349a3, but
  // it is verbatim in ACIP 2020 Table 2 and still in the current CDC schedule
  // notes, so it was mis-cited rather than unsupported. Each [c] now points at
  // the source for its own claim: Table 2 for the age, mm7349a3 for the
  // 0/6-month schedule.
  it('healthy MenB 16-23y dose-1 note cites Table 2 for the age and mm7349a3 for the schedule, never the mislabeled Penmenvy page', () => {
    const r = run({ ageMonths: 192, riskIds: [], menacwyDoses: [], menbDoses: [] });
    const rec = menb(r);
    expect(rec.status).toBe('shared-decision');
    expect(rec.noteCites).toHaveLength(2);
    expect(rec.noteCites[0]).toMatchObject({ key: 'menbHealthyPreferredAge1618' });
    expect(rec.noteCites[1]).toMatchObject({ key: 'menbHealthy2Dose0and6', url: ACIP_ANCHORS.menbHealthy2Dose0and6 });
    // The thing C5 was actually guarding against:
    expect(rec.noteCites.map((c) => c.key)).not.toContain('menbHealthySCDM1623Box');
  });

  it('healthy MenB "not yet due" (before 16) note cites Table 2 and names the preferred age', () => {
    const r = run({ ageMonths: 120, riskIds: [], menacwyDoses: [], menbDoses: [] });
    const rec = menb(r);
    expect(rec.note).toContain('[c]');
    expect(rec.note).toMatch(/16 through 18/);
    expect(rec.noteCites[0]).toMatchObject({ key: 'menbHealthyPreferredAge1618' });
    expect(rec.noteCites.map((c) => c.key)).not.toContain('menbHealthySCDM1623Box');
  });

  // U2 (2026-09-17): both quotes moved to the booster line with the sentence
  // they support, which now names 3 years or 5 rather than "3-5 years".
  it('high-risk MenACWY dose-1 cites both age-7 booster-cadence branches on its booster line', () => {
    const r = run({ ageMonths: 132, riskIds: ['asplenia'], menacwyDoses: [], menbDoses: [] });
    const rec = acwy(r);
    expect(rec.boosterCites).toHaveLength(2);
    const urls = rec.boosterCites.map((c) => c.url);
    expect(urls).toContain(ACIP_ANCHORS.boosterBeforeAge7);
    expect(urls).toContain(ACIP_ANCHORS.boosterAtOrAfterAge7);
  });

  function addDays(iso, n) {
    const dt = new Date(`${iso}T00:00:00Z`);
    dt.setUTCDate(dt.getUTCDate() + n);
    return dt.toISOString().slice(0, 10);
  }
  function monthsBack(m) { return addDays(TODAY, -Math.round(m * 30.4375)); }

  it('high-risk MenACWY first booster completed before age 7 cites the <7y anchor', () => {
    // D1 at ~4y, D2 at ~5y — both before age 7 → 3-year first-booster cadence.
    const r = run({
      ageMonths: 120, riskIds: ['asplenia'],
      menacwyDoses: [
        { date: monthsBack(72) },
        { date: monthsBack(60) },
      ],
      riskAtDoseAnswers: { MenACWY: { 0: 'yes', 1: 'yes' } },
    });
    const rec = acwy(r);
    expect(rec.doseLabel).toMatch(/first booster/);
    expect(rec.note).toContain('[c]');
    expect(rec.noteCites[0]).toMatchObject({ key: 'boosterBeforeAge7', url: ACIP_ANCHORS.boosterBeforeAge7 });
  });

  it('high-risk MenACWY first booster completed at/after age 7 cites the >=7y anchor', () => {
    // D1 at ~20y, D2 at ~21y — both at/after age 7 → 5-year first-booster cadence.
    const r = run({
      ageMonths: 300, riskIds: ['complement'],
      menacwyDoses: [
        { date: monthsBack(60) },
        { date: monthsBack(48) },
      ],
    });
    const rec = acwy(r);
    expect(rec.doseLabel).toMatch(/first booster/);
    expect(rec.note).toContain('[c]');
    expect(rec.noteCites[0]).toMatchObject({ key: 'boosterAtOrAfterAge7', url: ACIP_ANCHORS.boosterAtOrAfterAge7 });
  });
});

// L2-3 (2026-09-16): travel and microbiologist share the exposure booster branch
// but not its citation. Found by the citation-integrity sweep, which caught the
// note's [c] markers and its noteCites list out of step in both directions.
describe('L2-3: the exposure first-booster note and its citation stay in step', () => {
  const oneDoseSixYearsAgo = [{ date: '2020-09-15' }];

  it('a traveller\'s first booster shows the age-split citation it claims', () => {
    const r = run({ ageMonths: 204, riskIds: ['travel'], menacwyDoses: oneDoseSixYearsAgo, menbDoses: [] });
    const rec = acwy(r);
    expect(rec.note).toContain('[c]');
    expect(rec.note.split('[c]').length - 1).toBe(rec.noteCites.length);
    expect(rec.noteCites[0].key).toBe('boosterAtOrAfterAge7');
  });

  it('a microbiologist\'s first booster claims no age split, and renders no empty superscript', () => {
    const r = run({ ageMonths: 204, riskIds: ['microbiologist'], menacwyDoses: oneDoseSixYearsAgo, menbDoses: [] });
    const rec = acwy(r);
    // ACIP Table 7 covers ">=10 yrs" with a flat 5-year interval and no under-7
    // row, so his card must not imply the age split travellers get.
    expect(rec.note).not.toContain('age 7 or older');
    expect(rec.note).not.toContain('[c]');
    expect(rec.noteCites).toHaveLength(0);
    // The interval itself is unchanged by this fix.
    expect(rec.doseLabel).toContain('5 years after the primary dose');
  });
});
