// ─────────────────────────────────────────────────────────────────────────
// cdsiCore.mjs — the comparing half of the CDC CDSI test-patient check.
//
// Split out of runTestCases.mjs on 2026-11-15 (after STOP B) so the same code
// serves two callers: runTestCases.mjs prints the report, and
// src/logic/__tests__/cdsi-test-patients-gate.test.js fails the suite on a NEW
// disagreement, a known one that now agrees, or a moved answer. Nothing in
// the comparison changed in the split.
//
// Input: cdc-files/meningo-test-cases.json (CDC's two workbooks, extracted by
// extractTestCases.py). Saved answers: cdc-files/meningo-app-answers.json.
// See runTestCases.mjs for what is compared and why.
// ─────────────────────────────────────────────────────────────────────────
import { readFileSync } from 'node:fs';

const R = new URL('../../src', import.meta.url).pathname;
const { recommend } = await import(`${R}/logic/recommend.js`);
const CASES = JSON.parse(readFileSync(new URL('./cdc-files/meningo-test-cases.json', import.meta.url), 'utf8'));

// CDC's vaccine codes (CVX) → the brand a clinician would pick in this app.
// Each choice is a judgement, written down:
//   136 Menveo: CDC's code does not say which vial; both of the app's Menveo
//       entries start at 2 months, so "Menveo 2-vial" is the one that never
//       rejects a dose CDC's code allows.
//   147 / 164 "unspecified": the app's own "Unknown brand" (an empty brand).
const CVX = {
  136: { list: 'MenACWY', brand: 'Menveo 2-vial' },
  114: { list: 'MenACWY', brand: 'Menactra' },
  203: { list: 'MenACWY', brand: 'MenQuadfi' },
  147: { list: 'MenACWY', brand: '' },
  163: { list: 'MenB', brand: 'Bexsero' },
  162: { list: 'MenB', brand: 'Trumenba' },
  164: { list: 'MenB', brand: '' },
  // A pentavalent is entered on the list of the vaccine CDC's patient is about;
  // the engine credits it to the other list itself (G1, pentavalentCredit.js).
  316: { list: 'group', brand: 'Penbraya' },
  328: { list: 'group', brand: 'Penmenvy' },
};
// Products the app has no entry for. The dose is left out of the app's record
// and the patient is flagged, never entered as something else.
const NO_PRODUCT = {
  148: 'MenCY-Hib (Menhibrix, discontinued 2016): the app has no entry for it',
  32: 'MPSV4 (Menomune, polysaccharide, discontinued 2017): the app has no entry for it',
};

// CDC's condition codes → this app's checkboxes.
const RISK = {
  '160': 'asplenia',
  '259': 'asplenia',        // sickle cell disease: the app's box reads "asplenia/sickle cell disease"
  '151': 'complement',
  '050': 'microbiologist',
  '164': 'travel',
  '064': 'military',
};
// "At risk during an outbreak" names no serogroup; CDC's patient is about one
// vaccine, so the outbreak is that vaccine's serogroup.
const OUTBREAK = { MenACWY: 'outbreak_acwy', MenB: 'outbreak_b' };
// CDC code 177 "Patient seeks Meningococcal B protection" is CDSI's way of
// saying a 16–23-year-old chose the shared-decision MenB series. The app has
// no box for it: it shows that choice as a shared-decision card. So with 177
// a shared-decision card is read as "asks for a dose"; without it, as optional.
const SEEKS_MENB = '177';
const CONTRAINDICATION = {
  '095': 'severe allergic reaction to a previous MenACWY dose (a contraindication; the app has no such input)',
  '116': 'severe allergic reaction to a previous MenB dose (a contraindication; the app has no such input)',
};

const ageText = (dob, d) => {
  const b = new Date(dob + 'T00:00:00Z'), t = new Date(d + 'T00:00:00Z');
  let m = (t.getUTCFullYear() - b.getUTCFullYear()) * 12 + t.getUTCMonth() - b.getUTCMonth();
  if (t.getUTCDate() < b.getUTCDate()) m -= 1;
  return m < 24 ? `${m} mo` : `${Math.floor(m / 12)} y ${m % 12} mo`;
};

const NOTHING_OWED = new Set(['complete', 'not-indicated', 'deferred']);
const noteText = (r) => (typeof r.note === 'string' ? r.note : `${r.note?.lead ?? ''} ${r.note?.detail ?? ''}`);

// Every disagreement found on the first full run, sorted into families. A
// re-run prints any patient NOT listed here as NEW: the line to read after CDC
// publishes new test cases or the app changes.
// DELIBERATE = the app follows CDC/ACIP wording or an owner ruling over CDSI.
// OPEN = not yet decided; see docs/archive/report-2026-11-15-cdsi-test-patients.md.
// NOT COMPARABLE = the patient needs an input or product the app does not have.
// SAME ADVICE = the two say the same thing in different shapes.
// First full run 2026-11-15 (CDSI test cases 4.46 healthy / 4.6 conditions).
const KNOWN = {
  // ── Same date, different label ──
  // Closed 2026-11-16 (STOP B, the owner rule "Complete should only be used if
  // no additional doses/boosters are needed"): the healthy 10–15 card is no
  // longer "complete", so 2013-0487/-0499/-0503/-0507/-0509/-0510, 2023-0105
  // and 2025-0017 now agree with CDSI (the others differ for their own family).
  'Healthy MenB at 16–23 is shared clinical decision-making (ACIP); CDSI names its own series "Shared Clinical Decision Making" but forecasts it like any dose. The app labels it optional — DELIBERATE (label only; dates are judged by the families below)':
    ['2024-0032', '2024-0033', '2024-0034', '2024-0035', '2024-0036', '2024-0037', '2024-0040', '2024-0041',
      '2024-0069', '2024-0079', '2024-0081', '2025-0011', '2025-0014', '2025-0015'],
  'Nothing due today in either; CDSI names the future start date, the app names the age instead ("starts at 11–12 years", "from 16 years") — SAME ADVICE':
    ['2013-0502', '2024-0068'],
  'An early MenB dose 2: CDSI says it does not count and repeats it; the app keeps it and adds a third dose. Same next date, same number of doses left — SAME ADVICE (dose label differs)':
    ['2025-0015', '2020-UC-0003'],
  // ── Different date or different dose verdict ──
  'MenACWY at 10 years minus 1–4 days: the app gives the 4-day grace and counts it as the adolescent dose 1; CDSI 4.65 sets that series\' absolute minimum age at exactly "10 years" (no grace). Changes the answer only when no later dose exists (2013-0500: CDSI asks for a dose at 11, the app waits for 16) — DELIBERATE (owner, STOP B 2026-11-15: the grace at an age line "only when it helps", i.e. where it means fewer doses owed; ACIP RR-9: "Children who received MenACWY at age 10 years do not need an additional dose at age 11–12 years")':
    ['2013-0497', '2013-0498', '2013-0500', '2013-0501'],
  'Healthy MenB rescue dose 3: the app gives "at least 4 months after dose 2"; CDSI\'s earliest date also waits for 6 months after dose 1 (but CDSI\'s absolute minimum from dose 1 is 0 days, so it would count a dose given on the app\'s date) — OPEN (packet 1 Q2)':
    ['2024-0034', '2024-0035'],
  // Closed 2026-11-16 by owner answer C12 (STOP C): a healthy MenB dose 2 under
  // 4 weeks no longer counts, so 2024-0036 and 2025-0014 now agree with CDSI on
  // the dose and the date (2027-01-13); only the label family above remains.
  // Ruling D (owner, STOP C C2, 2026-11-15) moved the app's repeat to the dose
  // that did not count. Two patients still differ, for other reasons:
  // Closed 2026-11-17 by owner answer D2: a set-aside MenACWY dose (5 days
  // before 16) starts the 8-week clock, so 2013-0489's booster is 8 weeks
  // after it, as in CDSI.
  'A wrong-family MenB dose (Bexsero, then Trumenba): both say it does not count and both time the next dose from it; CDSI\'s earliest is 4 months after it, the app\'s 4 weeks after it (and not before 6 months from dose 1) — DELIBERATE (owner E2, 2026-11-15; ACIP 2020: "a minimum interval of 4 weeks should be used between any 2 doses")':
    ['2024-0081'],
  'MenB of unspecified product at 16+: CDSI says it cannot count (the product must be known) and repeats in 4 weeks; the app counts it as dose 1 — OPEN':
    ['2024-0069'],
  // Closed 2026-11-16 by owner answer C5 (STOP C): a high-risk MenB dose 3
  // given 4+ months after dose 2 counts whatever the gap from dose 1, so
  // 2020-UC-0004 now agrees with CDSI. (C7, the same PR, moved 2024-0039 —
  // dose 2 four days short of 6 months — from an optional rescue dose to
  // nothing owed; it agreed with CDSI before and after.)
  'Calendar: 4 months after Jul 31 is Nov 30 in the app, Dec 1 in CDSI — 1 day — OPEN (dateUtils.js is shared with PneumoVax, which lists the same family; a change goes to both or neither)':
    ['2024-0040'],
  'Microbiologist on Bexsero: the test patient (last changed in CDSI 4.2) predates Bexsero\'s 3-dose high-risk series; CDSI 4.65\'s own data (3 doses, booster 1 year later) gives the app\'s date — DELIBERATE':
    ['2019-UC-0007'],
  // Closed 2026-11-16 by STOP B: B-2 (2016-UC-0116, the infant outbreak series
  // now books its 3-year booster) and B-3 (2025-UC-0019, the military 5-year
  // booster date) now agree with CDSI.
  // Closed 2026-11-17 by B-1 / owner D13: a dose 1–4 days before the 16th
  // birthday is the 16-year dose from the day it is given, so 2013-0488 and
  // 2013-0511 are "Complete" on the dose day, as in CDSI.
  // ── Not comparable ──
  'Contraindication (severe allergic reaction to a previous dose): the app has no such input — NOT COMPARABLE':
    ['2016-UC-0011', '2016-UC-0203'],
  'A dose of MenCY-Hib (Menhibrix) or MPSV4 (Menomune), both discontinued: the app has no entry for them — NOT COMPARABLE':
    ['2016-UC-0129', '2023-UC-0021', '2023-UC-0023'],
};
const familyOf = (id) => Object.entries(KNOWN).filter(([, ids]) => ids.includes(id)).map(([f]) => f);

function run(c) {
  const today = c.assessmentDate;
  const v = c.group;
  const riskIds = [], unmapped = [], notComparable = [];
  let seeksMenB = false;
  for (const o of c.observations) {
    if (RISK[o.code]) riskIds.push(RISK[o.code]);
    else if (o.code === '070') riskIds.push(OUTBREAK[v]);
    else if (o.code === SEEKS_MENB) seeksMenB = true;
    else if (CONTRAINDICATION[o.code]) notComparable.push(`${o.code} ${CONTRAINDICATION[o.code]}`);
    else unmapped.push(`${o.code} ${o.text}`);
  }

  // Doses, in CDC's order (already by date). `entered[i]` is the index of CDC
  // dose i in the app's record, or null when the app cannot record it.
  const record = [];
  const entered = c.doses.map((d) => {
    const p = CVX[Number(d.cvx)];
    if (!p) {
      notComparable.push(`CVX ${d.cvx} ${NO_PRODUCT[Number(d.cvx)] ?? d.name}`);
      return null;
    }
    const list = p.list === 'group' ? v : p.list;
    if (list !== v) { unmapped.push(`CVX ${d.cvx} ${d.name} is a ${list} product on a ${v} patient`); return null; }
    record.push({ date: d.date, brand: p.brand });
    return record.length - 1;
  });

  const input = {
    dob: c.dob, today, riskIds: [...new Set(riskIds)],
    menacwyDoses: v === 'MenACWY' ? record : [],
    menbDoses: v === 'MenB' ? record : [],
    riskAtDoseAnswers: { MenACWY: {}, MenB: {} },
  };
  // The app asks "was the patient already at high risk when this dose was
  // given?" about some doses. CDC's conditions carry no start date and CDSI
  // applies them to the whole history, so the closest reading is "yes".
  // Counted, so the report can say how often this answer was needed.
  let r = recommend(input);
  let askedAtRisk = 0;
  for (let round = 0; round < 3; round += 1) {
    let changed = false;
    (r.history?.[v]?.perDose ?? []).forEach((d, i) => {
      if (d.needsInput && input.riskAtDoseAnswers[v][i] !== 'yes') {
        input.riskAtDoseAnswers[v][i] = 'yes'; askedAtRisk += 1; changed = true;
      }
    });
    if (!changed) break;
    r = recommend(input);
  }

  // ── Per dose: does it count? ──
  const h = r.history?.[v] ?? { perDose: [], sortedDoses: [] };
  const doseRows = c.doses.map((d, i) => {
    const k = entered[i];
    const base = { n: i + 1, cvx: d.cvx, product: d.name, date: d.date, age: ageText(c.dob, d.date),
      cdsi: d.status + (d.reason ? ` (${d.reason})` : '') };
    if (k === null) return { ...base, app: 'not recorded', appReason: '', agree: null };
    const a = h.perDose[k];
    const sd = h.sortedDoses[k];
    if (!a || sd?.date !== d.date) return { ...base, app: 'HARNESS GAP: dose order changed', appReason: '', agree: false };
    // A dose "counts" in the app when it is valid and not marked as not counting.
    const appCounts = a.status === 'valid' && !a.doesNotCount && !a.notAdolescentCount;
    const flags = [a.doesNotCount && 'doesNotCount', a.notAdolescentCount && 'notAdolescentCount'].filter(Boolean);
    // CDSI "Extraneous": a dose given after the series was already complete.
    // It changes nothing either way, so it agrees with any app verdict except
    // "invalid" (which would ask for a repeat; the next-step check sees that).
    const agree = /^extraneous$/i.test(d.status) ? a.status === 'valid' : appCounts === /^valid$/i.test(d.status);
    return { ...base, app: `${a.status}${flags.length ? '/' + flags.join('/') : ''}`,
      appReason: (a.reasons ?? []).join(' '), agree };
  });

  // ── The patient: complete, or what is next and when? ──
  // The app can name the next date in three ways, read in this order:
  //   asks      a card asking for a dose (due today, or from `earliestNextDate`)
  //   optional  a shared-decision card (healthy MenB 16–23), when CDC's patient
  //             did not "seek MenB protection" (code 177)
  //   booster   a "Complete" card that still states `boosterDueDate`
  //             ("Booster due at 16y")
  // The date is compared whichever way it came; the WAY is reported beside it,
  // because "same date, but the card says Complete" is a different finding
  // from "different date".
  const cards = (v === 'MenACWY' ? r.menacwy : r.menb) ?? [];
  const dateOf = (x) => (x.dueToday ? today : x.earliestNextDate ?? null);
  const firstDate = (xs, f) => xs.map(f).filter(Boolean).sort()[0] ?? null;
  const asking = cards.filter((x) => !NOTHING_OWED.has(x.status) && (seeksMenB || x.status !== 'shared-decision'));
  const optional = cards.filter((x) => x.status === 'shared-decision' && !seeksMenB);
  const boosterOnly = cards.filter((x) => x.status === 'complete' && x.boosterDueDate);
  let appState, appDate = null, appDateFrom = null;
  if (r.excluded) appState = 'stopped (transplant box)';
  else if (asking.length) {
    appState = 'not complete';
    appDate = firstDate(asking, dateOf); appDateFrom = 'asks';
  } else if (optional.length) {
    appState = 'optional (shared decision)';
    appDate = firstDate(optional, dateOf); appDateFrom = 'optional';
  } else {
    appState = 'nothing owed';
    appDate = firstDate(boosterOnly, (x) => x.boosterDueDate);
    if (appDate) { appState = 'Complete, booster date shown'; appDateFrom = 'booster'; }
  }

  const cdsiState = /^complete$/i.test(c.seriesStatus) ? 'complete'
    : /contra/i.test(c.seriesStatus) ? 'contraindicated'
      : /aged out/i.test(c.seriesStatus) ? 'aged out' : 'not complete';

  const due = (d) => (d && d <= today ? today : d); // a date already passed means "due now"
  const compareDates = () => {
    const appD = due(appDate), rec = due(c.recommended), earl = due(c.earliest);
    if (appD === rec) return 'AGREE';
    if (appD === earl) return 'AGREE on earliest date';
    if (appD < earl) return 'DIFFERENT: app earlier than CDSI earliest';
    if (c.pastDue && appD >= due(c.pastDue)) return 'DIFFERENT: app at/after CDSI past-due';
    return appD < rec ? 'DIFFERENT: app between CDSI earliest and recommended' : 'DIFFERENT: app later than CDSI recommended';
  };

  let forecast;
  if (cdsiState === 'contraindicated' || notComparable.some((x) => /contraindication/.test(x))) forecast = 'NOT COMPARABLE (contraindication)';
  else if (notComparable.length) forecast = 'NOT COMPARABLE (a dose of a product the app cannot record)';
  else if (cdsiState !== 'not complete') {
    forecast = appState === 'not complete' ? `DIFFERENT: CDSI ${cdsiState}, app asks for a dose` : 'AGREE';
  } else if (appState === 'not complete') {
    forecast = appDate ? compareDates() : 'DIFFERENT: app asks for a dose but gives no date';
  } else if (!appDate) {
    forecast = due(c.earliest) > today
      ? 'NO DATE: nothing due today in either; CDSI names a future date, the app names none'
      : `DIFFERENT: CDSI due now, app ${appState}`;
  } else {
    // Same question as above, but the app's card does not call it owed.
    const label = appDateFrom === 'booster' ? 'LABEL: app says Complete (booster date shown)' : 'LABEL: app says optional (shared decision)';
    forecast = `${label}; date ${compareDates()}`;
  }

  return {
    id: c.id, source: c.source, group: v, name: c.name, dob: c.dob, today, ageToday: ageText(c.dob, today),
    risks: c.observations.map((o) => `${o.code} ${o.text}`), riskIds: input.riskIds, unmapped, notComparable, askedAtRisk,
    doses: doseRows, dosesAgree: doseRows.every((d) => d.agree !== false),
    cdsi: { state: cdsiState, raw: c.seriesStatus, forecastNum: c.forecastNum, earliest: c.earliest, recommended: c.recommended, pastDue: c.pastDue, guidance: c.guidance, evalType: c.evalType, forecastType: c.forecastType },
    app: { state: appState, date: appDate,
      cards: cards.map((x) => `${x.status}${x.dueToday ? ' due today' : x.earliestNextDate ? ' from ' + x.earliestNextDate : ''} — ${x.doseLabel ?? ''} [${(x.brands ?? []).join(', ')}] :: ${noteText(x).slice(0, 220)}`) },
    forecast,
  };
}

export const differs = (x) => !x.dosesAgree || !x.forecast.startsWith('AGREE');
export const tagOf = (f) => (/— OPEN/.test(f) ? 'OPEN' : /NOT COMPARABLE/.test(f) ? 'NOT COMPARABLE' : /DELIBERATE/.test(f) ? 'DELIBERATE' : /SAME ADVICE/.test(f) ? 'SAME ADVICE' : 'untagged');
export const ORDER = ['OPEN', 'NOT COMPARABLE', 'untagged', 'DELIBERATE', 'SAME ADVICE'];
export const ANSWERS = new URL('./cdc-files/meningo-app-answers.json', import.meta.url);
export const answerOf = (x) => `${x.app.state}${x.app.date ? ' @ ' + x.app.date : ''}; doses ${x.doses.map((d) => (d.agree === null ? '-' : d.app)).join(', ') || 'none'}`;
export { CASES, KNOWN, familyOf };

/**
 * Run every CDC patient through the app and compare.
 * `fresh`  = differing patients in no KNOWN family (NEW).
 * `healed` = patients listed in KNOWN that now agree (the list must be pruned).
 * `moved`  = patients whose app answer differs from the saved answers file.
 * `saved` is null when the saved-answers file is missing.
 */
export function evaluate() {
  const results = CASES.map(run);
  const nowAnswers = Object.fromEntries(results.map((x) => [x.id, answerOf(x)]));
  let saved;
  try { saved = JSON.parse(readFileSync(ANSWERS, 'utf8')); } catch { saved = null; }
  const moved = saved ? results.filter((x) => saved[x.id] !== nowAnswers[x.id]) : [];
  const fresh = results.filter((x) => differs(x) && familyOf(x.id).length === 0);
  const healed = [...new Set(Object.values(KNOWN).flat())]
    .filter((id) => { const x = results.find((y) => y.id === id); return x && !differs(x); });
  return { results, nowAnswers, saved, moved, fresh, healed };
}
