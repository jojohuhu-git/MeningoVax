// Phase 9.1 of the PneumoVax port (2026-11-27): ordinary patients a WEEK TO A
// MONTH either side of each meningococcal age line, checked against an
// INDEPENDENT reading of CDC's own words. PneumoVax's version is its
// scripts/ageLineAudit/childLines.mjs (#143, 2026-11-08); this one follows it.
//
// Read live 2026-11-27 in the browser pane with "Expand All" clicked: CDC
// Child/Adolescent Schedule Notes (61,564 characters; the closed page is about
// 9,000) and CDC Adult Schedule Notes (42,003). Both carry CDC's notice that,
// under the March 16, 2026 court order (AAP et al. v. Kennedy et al.), the July
// 2, 2025 schedule is the current one.
//
// CDC words this oracle encodes (verbatim fragments):
//   MenACWY "(minimum age: 2 months [MenACWY-CRM, Menveo], 2 years [MenACWY-TT,
//          MenQuadfi]), 10 years [MenACWY-TT/MenB-FHbp, Penbraya])"
//   Routine "2-dose series at age 11–12 years; 16 years"
//   Catch-up "Age 13–15 years: 1 dose now and booster at age 16–18 years (minimum
//          interval: 8 weeks)" / "Age 16–18 years: 1 dose"
//   Asplenia, HIV, complement (Menveo) "Dose 1 at age 2 months: 4-dose series" /
//          "Dose 1 at age 3–6 months: 3- or 4- dose series (dose 2 [and dose 3 if
//          applicable] at least 8 weeks after previous dose until a dose is received
//          at age 7 months or older, followed by an additional dose at least 12 weeks
//          later and after age 12 months)" / "Dose 1 at age 7–23 months: 2-dose
//          series (dose 2 at least 12 weeks after dose 1 and after age 12 months)" /
//          "Dose 1 at age 24 months or older: 2-dose series at least 8 weeks apart"
//   Travel "Children younger than age 24 months: Menveo* (age 2–23 months)" [the
//          same three infant rows] / "Children age 2 years or older: 1 dose Menveo*
//          or MenQuadfi"
//   College "First-year college students who live in residential housing (if not
//          previously vaccinated at age 16 years or older) or military recruits: 1
//          dose Menveo* or MenQuadfi"
//   MenB "(minimum age: 10 years [MenB-4C, Bexsero; MenB-FHbp, Trumenba; …])" /
//          "Adolescents not at increased risk age 16–23 years (preferred age 16–18
//          years) based on shared clinical decision-making." / "2–dose series at
//          least 6 months apart" / asplenia, complement: "3-dose series at 0, 1–2, 6
//          months"
//   Penbraya "Children age 10 years or older may receive a single dose of Penbraya
//          as an alternative to separate administration of MenACWY and MenB when both
//          vaccines would be given on the same clinic day"
//   ACIP 2020 (not on the notes pages; the app quotes it): "Persons aged 19–21
//          years who have not received a dose after their 16th birthday can receive
//          a single MenACWY dose as part of catch-up vaccination"
//
// Owner rulings the oracle takes as given (each named where it is used):
//   - MenQuadfi from 6 weeks (AAP 2026; owner R10/R96 2026-11-20, MQ6 2026-11-21:
//     where AAP and CDC disagree, AAP governs). Brands are therefore not graded
//     for infants.
//   - College: a dose at 16 or older covers for 5 years (D1, 2026-11-17).
//
// Usage: npx vite-node scripts/ageLineAudit/meningoLines.mjs [--rows]
import { recommend } from '../../src/logic/recommend.js';

const T = '2026-11-27';
const addM = (iso, m) => { const [y, mo, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, mo - 1 + m, d)).toISOString().slice(0, 10); };
const addD = (iso, n) => new Date(Date.parse(iso) + n * 864e5).toISOString().slice(0, 10);
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const monthsAt = (dob, iso) => { const [y1, m1, d1] = dob.split('-').map(Number), [y2, m2, d2] = iso.split('-').map(Number); return (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0); };
/** Date of birth that makes the patient `months` old plus `offset` days on T. */
const dobFor = (months, offset) => addD(addM(T, -months), -offset);

const WIDE = [-30, -14, -7, 7, 14, 30];
const NOTHING_OWED = new Set(['complete', 'not-indicated', 'deferred']);

// Each case: { line, offset, dob, risk, acwy:[{date,brand}], b:[…], want: { acwy, b, penta } }
//   want.acwy / want.b: 'NONE' | 'OPTIONAL' | 'DUE' | { later: floor, latest, slack? }
//     plus optional `total` (the "of N" on the card) or `totals` (a set CDC allows)
//   want.penta: true | false | undefined (not graded)
const CASES = [];
const add = (line, offset, c) => CASES.push({ line, offset, acwy: [], b: [], ...c });

// ── MenACWY, healthy ─────────────────────────────────────────────────────
// A1 — 11 years, no doses. Routine is "at age 11–12 years": nothing before 11.
for (const o of WIDE) add('11 years, healthy, no doses', o, { dob: dobFor(132, o), risk: [],
  want: { acwy: o < 0 ? 'NONE' : { due: true, total: 2 }, b: 'NONE', penta: false } });

// A3 — 16 years, no doses. Under 16: "1 dose now and booster at age 16–18 years";
// 16 or older: "Age 16–18 years: 1 dose".
for (const o of WIDE) add('16 years, healthy, no doses', o, { dob: dobFor(192, o), risk: [],
  want: { acwy: { due: true, total: o < 0 ? 2 : 1 }, b: o < 0 ? 'NONE' : 'OPTIONAL' } });

// A4 — 16 years, dose 1 at 11. The booster is at 16: a date before, due after.
for (const o of WIDE) { const dob = dobFor(192, o);
  add('16 years, healthy, dose at 11', o, { dob, risk: [], acwy: [{ date: addM(dob, 132), brand: 'Menveo' }],
    want: { acwy: o < 0 ? { later: addM(dob, 192), latest: addM(dob, 192) } : 'DUE', b: o < 0 ? 'NONE' : 'OPTIONAL' } }); }

// A5 — 19 years, dose at 11 only. Under 19: "Age 16–18 years: 1 dose".
// 19 or older: ACIP 2020's "can receive a single MenACWY dose as part of
// catch-up vaccination" (19–21). MenB 16–23 is shared decision on both sides.
for (const o of WIDE) { const dob = dobFor(228, o);
  add('19 years, healthy, dose at 11 only', o, { dob, risk: [], acwy: [{ date: addM(dob, 132), brand: 'Menveo' }],
    want: { acwy: o < 0 ? 'DUE' : 'OPTIONAL', b: 'OPTIONAL' } }); }

// A6 — 22 years, dose at 11 only. The 19–21 catch-up ends at the 22nd birthday.
for (const o of WIDE) { const dob = dobFor(264, o);
  add('22 years, healthy, dose at 11 only', o, { dob, risk: [], acwy: [{ date: addM(dob, 132), brand: 'Menveo' }],
    want: { acwy: o < 0 ? 'OPTIONAL' : 'NONE', b: 'OPTIONAL' } }); }

// A7 — college, now 18½, one dose either side of 16. "If not previously
// vaccinated at age 16 years or older": a dose before 16 leaves 1 dose owed;
// a dose at 16 or older needs none (owner D1: for 5 years after it).
for (const o of WIDE) { const dob = dobFor(222, 0);
  add('college, dose either side of 16', o, { dob, risk: ['college_dorm'], acwy: [{ date: addD(addM(dob, 192), o), brand: 'MenQuadfi' }],
    want: { acwy: o < 0 ? 'DUE' : 'NONE' } }); }

// ── MenACWY, high risk and travel, infants and toddlers ──────────────────
// The band is the age at dose 1 (today, no doses yet); the oracle reads it off
// the patient's real age rather than the sign of the offset.
const infantAcwy = (dob) => {
  const m = monthsAt(dob, T);
  // Under 6 weeks the card names the age instead of a date, "Not yet due (from 2
  // months)"; the dated card starts at day 42 (owner MQ6, 2026-11-21). Same advice.
  if (m < 2) return { later: addM(dob, 2), latest: addM(dob, 2), slack: 0, namedAge: 'from 2 months' };
  if (m < 3) return { due: true, total: 4 };                 // "Dose 1 at age 2 months: 4-dose series"
  if (m < 7) return { due: true, totals: [3, 4] };           // "3- or 4- dose series"
  if (m < 24) return { due: true, total: 2 };                // "Dose 1 at age 7–23 months: 2-dose series"
  return { due: true, total: 2 };                            // "2-dose series at least 8 weeks apart"
};
for (const [line, months, offs] of [['2 months', 2, [-30, -14, -7, 7, 14]], ['3 months', 3, [-14, -7, 7, 14, 30]],
  ['7 months', 7, WIDE], ['24 months', 24, WIDE]]) {
  for (const o of offs) { const dob = dobFor(months, o);
    add(`${line}, asplenia, no doses`, o, { dob, risk: ['asplenia'], want: { acwy: infantAcwy(dob), b: 'NONE' } }); }
}

// Travel: the same infant rows under 24 months; "1 dose" from 2 years.
const travelAcwy = (dob) => (monthsAt(dob, T) < 24 ? infantAcwy(dob) : { due: true, total: 1 });
for (const [line, months, offs] of [['2 months', 2, [-30, -14, -7, 7, 14]], ['24 months', 24, WIDE]]) {
  for (const o of offs) { const dob = dobFor(months, o);
    add(`${line}, travel, no doses`, o, { dob, risk: ['travel'], want: { acwy: travelAcwy(dob), b: 'NONE' } }); }
}

// H12 — 12 months, asplenia, dose 1 at 8 months: "dose 2 at least 12 weeks after
// dose 1 and after age 12 months". The first birthday is the later line, so the
// card's date must be exactly it (slack 0: PHASE9-D, 2026-11-27).
for (const o of WIDE) { const dob = dobFor(12, o);
  add('12 months, asplenia, dose 1 at 8 months', o, { dob, risk: ['asplenia'],
    acwy: [{ date: addM(dob, 8), brand: 'Menveo 2-vial' }],
    want: { acwy: o < 0 ? { later: addM(dob, 12), latest: addM(dob, 12), slack: 0 } : { due: true, total: 2 }, b: 'NONE' } }); }

// ── MenB ────────────────────────────────────────────────────────────────
// B1 — 10 years, asplenia, nothing yet. MenB "minimum age: 10 years", then the
// 3-dose series; MenACWY's 2-dose series is due on both sides; Penbraya "age 10
// years or older … when both vaccines would be given on the same clinic day".
for (const o of WIDE) add('10 years, asplenia, no doses', o, { dob: dobFor(120, o), risk: ['asplenia'],
  want: { acwy: { due: true, total: 2 }, b: o < 0 ? 'NONE' : { due: true, total: 3 }, penta: o > 0 } });

// B2 — 16 years, healthy, MenACWY at 11: MenB "age 16–23 years … shared
// clinical decision-making", nothing before 16. Penbraya once both are given
// the same day (MenACWY booster due, MenB by shared decision).
for (const o of WIDE) { const dob = dobFor(192, o);
  add('16 years, healthy, MenB', o, { dob, risk: [], acwy: [{ date: addM(dob, 132), brand: 'Menveo' }],
    want: { b: o < 0 ? 'NONE' : { optional: true, total: 2 }, penta: o > 0 } }); }

// B3 — 24 years, healthy, MenACWY at 11 and 16, no MenB: shared decision runs
// "16–23 years", so it ends at the 24th birthday.
for (const o of WIDE) { const dob = dobFor(288, o);
  add('24 years, healthy, MenB', o, { dob, risk: [], acwy: [{ date: addM(dob, 132), brand: 'Menveo' }, { date: addM(dob, 192), brand: 'Menveo' }],
    want: { acwy: 'NONE', b: o < 0 ? 'OPTIONAL' : 'NONE', penta: false } }); }

// ── Reading the app ─────────────────────────────────────────────────────
const ageY = (dob) => monthsAt(dob, T) / 12;
function readCard(cards, dob) {
  const list = [].concat(cards ?? []);
  const c = list.find((x) => !NOTHING_OWED.has(x.status)) ?? list[0];
  if (!c || NOTHING_OWED.has(c.status)) return { cat: 'NONE', label: c?.doseLabel ?? '(none)' };
  // "catchup" is CDC's catch-up (a recommendation) under 19; from 19 it is
  // ACIP's "can receive", an option.
  const optional = c.status === 'shared-decision' || (c.status === 'catchup' && ageY(dob) >= 19);
  return { cat: optional ? 'OPTIONAL' : c.dueToday ? 'DUE' : 'LATER', on: c.dueToday ? T : c.earliestNextDate, total: c.seriesTotal, label: `${c.status}: ${c.doseLabel}${c.dueToday ? ' (due today)' : c.earliestNextDate ? ` (from ${c.earliestNextDate})` : ''}` };
}

const issues = new Map();
const flag = (kind, ex) => { const v = issues.get(kind) ?? { n: 0, ex: [] }; v.n += 1; if (v.ex.length < 3) v.ex.push(ex); issues.set(kind, v); };
function grade(name, want, got, ex) {
  if (want === undefined) return false;
  const w = typeof want === 'string' ? { [want.toLowerCase()]: true } : want;
  const wantCat = w.none ? 'NONE' : w.optional ? 'OPTIONAL' : w.due ? 'DUE' : 'LATER';
  if (w.later && got.cat === 'NONE' && w.namedAge && got.label.includes(w.namedAge)) return false;
  if (got.cat !== wantCat) { flag(`${ex.line}: ${name} — CDC ${wantCat}, app ${got.cat}`, { ...ex, got: got.label }); return true; }
  let bad = false;
  if (w.later) {
    if (!got.on || got.on < w.later) { flag(`${ex.line}: ${name} — date EARLIER than CDC allows (or none)`, { ...ex, floor: w.later, got: got.label }); bad = true; }
    else if (days(w.latest, got.on) > (w.slack ?? 31)) { flag(`${ex.line}: ${name} — date LATER than CDC (${w.slack ?? 31}+ days)`, { ...ex, latest: w.latest, got: got.label }); bad = true; }
  }
  const totals = w.totals ?? (w.total ? [w.total] : null);
  if (totals && !totals.includes(got.total)) { flag(`${ex.line}: ${name} — series total ${totals.join(' or ')} by CDC, card says ${got.total}`, { ...ex, got: got.label }); bad = true; }
  return bad;
}

const rows = [];
let ok = 0;
for (const c of CASES) {
  const out = recommend({ dob: c.dob, today: T, riskIds: c.risk, menacwyDoses: c.acwy, menbDoses: c.b,
    riskAtDoseAnswers: { MenACWY: Object.fromEntries(c.acwy.map((_, i) => [i, 'yes'])), MenB: {} } });
  const ex = { line: c.line, offset: c.offset, dob: c.dob, hist: c.acwy.map((x) => `${x.brand}@${x.date}`).join(' ') };
  const a = readCard(out.menacwy, c.dob), b = readCard(out.menb, c.dob);
  let bad = grade('MenACWY', c.want.acwy, a, ex);
  bad = grade('MenB', c.want.b, b, ex) || bad;
  if (c.want.penta !== undefined && !!out.pentavalent?.eligible !== c.want.penta) {
    flag(`${c.line}: Penbraya/Penmenvy — CDC ${c.want.penta ? 'offered' : 'not offered'}, app ${out.pentavalent?.eligible ? 'offered' : 'not offered'}`, ex); bad = true;
  }
  // "The liquid formulation should not be used before age 10 years."
  const liquid = [].concat(out.menacwy ?? []).some((x) => (x.brands ?? []).some((br) => /Menveo 1-vial/.test(br)));
  if (liquid && ageY(c.dob) < 10) { flag(`${c.line}: Menveo 1-vial (liquid) offered before 10 years`, ex); bad = true; }
  rows.push([c.line, c.offset, bad ? 'PROBLEM' : 'agree', a.label, '|', b.label].join('\t'));
  if (!bad) ok += 1;
}
if (process.argv.includes('--rows')) console.log(rows.join('\n'));
console.log('patients', CASES.length, 'agree', ok, 'problems', CASES.length - ok, 'kinds', issues.size);
for (const [k, v] of [...issues].sort((x, y) => y[1].n - x[1].n)) { console.log(`\n${v.n} × ${k}`); for (const e of v.ex) console.log(`   ${JSON.stringify(e)}`); }
