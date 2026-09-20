// Found 2026-09-19 via plan item D's report-only two-run relational sweep
// (.claude/prompts/plan-2026-09-19-test-depth-and-drift.md, relation 1a:
// "adding a risk factor never reduces what's owed"). The sweep found 16
// cases where a patient `due` for their routine MenACWY booster read as
// `complete` the moment "military" or an outbreak indication was ticked.
//
// What a clinician would have seen: a 16-year-old with MenACWY doses on
// record, all given before their 16th birthday, still owes the routine
// age-16 booster (regression-newborn-menacwy-not-due-yet.test.js's sibling
// file and menacwyRoutine() both already get this right for a patient with
// NO risk factor). Tick "military recruit" or "increased risk from a
// serogroup A/C/W/Y outbreak", and the card flips to "Complete" — the
// occupational/outbreak schedule's own "one dose satisfies this" test was
// applied to ANY prior dose, without checking whether it was before or
// after 16, so the separate, universal routine requirement silently
// disappeared.
//
// college_dorm was never affected: its own qualifying test already IS "a
// dose at >=16y" (M17), so it happens to enforce the routine floor by
// construction. Confirmed against the owner directly (2026-09-19): a single
// MenACWY dose given ON OR AFTER the 16th birthday satisfies the routine
// booster, whatever the reason it was given for; a dose given before 16
// does not, and the age-16 dose is still owed regardless of what other
// indication is also ticked. CDC child/adolescent schedule notes, fetched
// live 2026-09-19 (https://www.cdc.gov/vaccines/hcp/imz-schedules/child-
// adolescent-notes.html): "Age 13–15 years: 1 dose now and booster at age
// 16–18 years (minimum interval: 8 weeks)"; "Age 16–18 years: 1 dose" (no
// booster).
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-09-15';

// A 16y8mo patient (well clear of the 4-day grace either way) with one
// MenACWY dose. `beforeSixteen`: given ~15.7y old. `afterSixteen`: given
// ~16.4y old.
const AGE_MONTHS = 200;
const DOSE_BEFORE_16 = [{ date: '2025-09-15', brand: 'Menveo 2-vial (MenACWY)' }]; // ~12mo ago, age ~15.7y
const DOSE_AT_OR_AFTER_16 = [{ date: '2026-06-15', brand: 'Menveo 2-vial (MenACWY)' }]; // ~3mo ago, age ~16.4y

function card(riskIds, doses) {
  return recommend({
    today: TODAY, ageMonths: AGE_MONTHS, riskIds, menacwyDoses: doses, menbDoses: [],
  }).menacwy[0];
}

describe('D1a — occupational/outbreak "done" never hides an unmet routine booster', () => {
  it('military: a pre-16 dose does NOT read Complete — the routine booster is still owed', () => {
    const c = card(['military'], DOSE_BEFORE_16);
    expect(c.status).not.toBe('complete');
    expect(c.dueToday).toBe(true);
    expect(c.doseLabel).toMatch(/still owed/i);
    expect(`${c.note.lead} ${c.note.detail}`).toMatch(/16/);
  });

  it('military: a dose at/after 16 still reads Complete — both requirements are met by the same dose', () => {
    const c = card(['military'], DOSE_AT_OR_AFTER_16);
    expect(c.status).toBe('complete');
    expect(c.doseLabel).toBe('Complete');
  });

  it('outbreak_acwy: a pre-16 dose does NOT read Complete-for-this-outbreak — the routine booster is still owed', () => {
    const c = card(['outbreak_acwy'], DOSE_BEFORE_16);
    expect(c.status).not.toBe('complete');
    expect(c.dueToday).toBe(true);
    expect(c.doseLabel).toMatch(/still owed/i);
  });

  it('outbreak_acwy: a dose at/after 16, recent enough that no top-up is due, still reads Complete', () => {
    const c = card(['outbreak_acwy'], DOSE_AT_OR_AFTER_16);
    expect(c.status).toBe('complete');
    expect(c.doseLabel).toBe('Complete for this outbreak');
  });

  it('control: college_dorm was already correct and is unaffected by this fix', () => {
    expect(card(['college_dorm'], DOSE_BEFORE_16).status).not.toBe('complete');
    expect(card(['college_dorm'], DOSE_AT_OR_AFTER_16).status).toBe('complete');
  });

  it('control: no risk factor at all — menacwyRoutine() already gets this right, unchanged', () => {
    const c = card([], DOSE_BEFORE_16);
    expect(c.status).not.toBe('complete');
    expect(c.dueToday).toBe(true);
  });
});
