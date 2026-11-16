// ─────────────────────────────────────────────────────────────────────────
// replay.mjs — reading a card the way a clinician reads it, and following it.
//
// Port Phase 1.4 (2026-11-15). The idea comes from PneumoVax's
// scripts/wholeApp/replay.mjs; the code is MeningoVax's own, because the two
// engines answer in different shapes (port plan: "port the rule, not the
// code"). Everything here is a question about the app's OWN answers. Nothing
// here knows a clinical rule. `checks.mjs` holds the checks; `run.mjs` runs them.
//
// ── What a MeningoVax card can ask ────────────────────────────────────────
// Measured over all 31,680 saved and typical patients on 2026-11-15: every card
// that asks for a dose is either "due today" or carries `earliestNextDate`.
// The cards with no date are the ones that ask for nothing: complete, not
// indicated, deferred in pregnancy. So `readCard()` sorts into a closed list,
// and anything else is reported as a HARNESS GAP — never defaulted to today
// (PneumoVax's first replay took 924 false flags from that one shortcut).
//
// ── Which brand the walk gives ───────────────────────────────────────────
// A card names several brands. Walking every one multiplies the roads by
// three or four per dose for no gain on MenACWY (its brands differ only by
// the age they start at, and the card already lists only those that fit), so
// the walk gives the FIRST MenACWY brand listed. MenB is different: its two
// antigen families are not interchangeable and finish on different schedules,
// so the walk follows the first brand of EACH family offered. Every pentavalent
// offered is its own road. `firstScreenBrands` in checks.mjs gives every
// brand on the first screen once, so no listed brand goes untried.
// ─────────────────────────────────────────────────────────────────────────
import { recommend } from '../../src/logic/recommend.js';
import { addCalendarMonths, addDays } from '../../src/logic/dateUtils.js';
import * as AGES from '../../src/logic/ages.js';
import { buildSavedAnswerCases, buildTypicalCases } from '../../src/test-grid.js';

/** Every patient the checks run over: the real saved-answer patients and the typical ones. */
export function allPatients({ only } = {}) {
  const grid = buildSavedAnswerCases().map((c) => ({ ...c, group: 'grid' }));
  const typical = buildTypicalCases().map((c) => ({ ...c, group: 'typical' }));
  if (only === 'grid') return grid;
  if (only === 'typical') return typical;
  return [...grid, ...typical];
}

export const VACCINES = ['MenACWY', 'MenB'];
export const brandKey = (b) => String(typeof b === 'string' ? b : b?.key ?? b?.label ?? '').split(' (')[0];
export const noteText = (r) => (typeof r.note === 'string' ? r.note : `${r.note?.lead ?? ''} ${r.note?.detail ?? ''}`);
export const cardText = (r) => `${r.doseLabel ?? ''} ${noteText(r)} ${r.boosterSummary ?? ''}`;
export const NOTHING_OWED = new Set(['complete', 'not-indicated', 'deferred']);
const PENTAVALENTS = new Set(['Penbraya', 'Penmenvy']);
const FAMILY_OF = { Bexsero: '4C', Penmenvy: '4C', Trumenba: 'FHbp', Penbraya: 'FHbp' };
export const familyOf = (brand) => FAMILY_OF[brandKey(brand)] ?? null;

/** Both card lists, each card tagged with the list it came from. */
export const cardsOf = (result) => [
  ...(result.menacwy ?? []).map((r) => ({ ...r, list: 'MenACWY' })),
  ...(result.menb ?? []).map((r) => ({ ...r, list: 'MenB' })),
];

/**
 * What a card is asking. A closed list, on purpose:
 *   nothing     complete / not indicated / deferred — asks for no dose
 *   now         due today
 *   dated       due on `earliestNextDate`
 *   unreadable  anything else: reported, never guessed at
 */
export function readCard(r, today) {
  if (NOTHING_OWED.has(r.status)) return { kind: 'nothing' };
  if (r.dueToday) return { kind: 'now', date: today };
  if (r.earliestNextDate) return { kind: 'dated', date: r.earliestNextDate > today ? r.earliestNextDate : today };
  return { kind: 'unreadable' };
}

/** A card a clinician may pass on and stay in step with the app. */
export const mayDecline = (r) => r.status === 'shared-decision';

/** Ages at which an answer can turn, in months, read from the engine's own table. */
export const AGE_LINES = [...new Set(Object.entries(AGES)
  .filter(([k, v]) => /_MONTHS$/.test(k) && typeof v === 'number' && v > 0)
  .map(([, v]) => v))].sort((a, b) => a - b);

// ── One screen ───────────────────────────────────────────────────────────

/** A walk state: today, both dose lists (each dose `{date, brand, advised?}`). */
export function firstState(patient) {
  return {
    today: patient.input.today,
    acwy: patient.input.menacwyDoses.map((d) => ({ ...d })),
    menb: patient.input.menbDoses.map((d) => ({ ...d })),
    declined: [],
  };
}

const inputOf = (patient, s, answers) => ({
  ...patient.input,
  ageMonths: undefined, // the engine works age out from dob and today
  today: s.today,
  menacwyDoses: s.acwy,
  menbDoses: s.menb,
  riskAtDoseAnswers: answers,
});

/**
 * The screen for one patient on one day. When the app asks "was this patient
 * at high risk when this dose was given?" about a dose IT advised, the walk
 * answers yes (the risk box is ticked; the app chose the dose for that risk)
 * and the question is counted in `askedAboutAdvised`, so a check can report it.
 * Questions about doses the patient arrived with keep the patient's own answers.
 */
export function view(patient, s) {
  const answers = {
    MenACWY: { ...(patient.input.riskAtDoseAnswers?.MenACWY ?? {}) },
    MenB: { ...(patient.input.riskAtDoseAnswers?.MenB ?? {}) },
  };
  let result = recommend(inputOf(patient, s, answers));
  let askedAboutAdvised = 0;
  for (let round = 0; round < 3 && !result.excluded; round += 1) {
    let changed = false;
    for (const v of VACCINES) {
      const h = result.history?.[v];
      (h?.perDose ?? []).forEach((d, i) => {
        if (d.needsInput && h.sortedDoses[i]?.advised && answers[v][i] !== 'yes') {
          answers[v][i] = 'yes';
          askedAboutAdvised += 1;
          changed = true;
        }
      });
    }
    if (!changed) break;
    result = recommend(inputOf(patient, s, answers));
  }
  return Object.assign(result, { askedAboutAdvised });
}

/**
 * Every dose a screen offers, as roads to follow. MenACWY: the first brand.
 * MenB: the first brand of each antigen family offered. Pentavalent: every
 * brand the pentavalent card offers (it is always due today).
 */
export function optionsOn(result, today, declined = []) {
  const options = [];
  const gaps = [];
  for (const r of cardsOf(result)) {
    const read = readCard(r, today);
    if (read.kind === 'unreadable') gaps.push(r);
    if (!read.date) continue;
    if (mayDecline(r) && declined.includes(r.list)) continue;
    const brands = (r.brands ?? []).map(brandKey).filter((b) => b && !PENTAVALENTS.has(b));
    if (!brands.length) { gaps.push(r); continue; }
    const picked = r.list === 'MenB'
      ? [...new Set(brands.map((b) => familyOf(b) ?? b))].map((f) => brands.find((b) => (familyOf(b) ?? b) === f))
      : [brands[0]];
    for (const brand of picked) options.push({ rec: r, list: r.list, brand, date: read.date, kind: read.kind });
  }
  if (result.pentavalent?.eligible) {
    for (const b of result.pentavalent.brands ?? []) {
      options.push({ rec: { doseLabel: `Pentavalent (${brandKey(b)})`, status: 'pentavalent', list: 'Penta' }, list: 'Penta', brand: brandKey(b), date: today, kind: 'now' });
    }
  }
  return { options, gaps };
}

/**
 * The doses a clinician acts on next: those on the EARLIEST date the screen
 * names. A dose dated later is not lost — it is on the next screen too — but
 * following it now would skip the earlier one, and walking every interleaving
 * of two separately dated vaccines multiplied the roads past a million screens
 * for 1 patient in 100 (measured 2026-11-15).
 */
export function nextOptions(options) {
  if (!options.length) return options;
  const first = options.reduce((m, o) => (o.date < m ? o.date : m), options[0].date);
  return options.filter((o) => o.date === first);
}

const byDate = (a, b) => ((a.date ?? '') < (b.date ?? '') ? -1 : (a.date ?? '') > (b.date ?? '') ? 1 : 0);

/** Record one dose. A pentavalent is typed on the MenACWY list; the engine credits it to MenB. */
export function give(s, option) {
  const dose = { date: option.date, brand: option.brand, advised: true };
  const onAcwy = option.list !== 'MenB';
  return {
    today: option.date,
    acwy: onAcwy ? [...s.acwy, dose].sort(byDate) : s.acwy,
    menb: onAcwy ? s.menb : [...s.menb, dose].sort(byDate),
    declined: s.declined ?? [],
  };
}

// ── Following the advice forward ─────────────────────────────────────────

/** Clocks that run from a dose: 4, 8 and 12 weeks; 4 and 6 months; 1, 2, 3 and 5 years. */
const DOSE_CLOCKS = [
  (d) => addDays(d, 28), (d) => addDays(d, 56), (d) => addDays(d, 84),
  (d) => addCalendarMonths(d, 4), (d) => addCalendarMonths(d, 6),
  (d) => addCalendarMonths(d, 12), (d) => addCalendarMonths(d, 24),
  (d) => addCalendarMonths(d, 36), (d) => addCalendarMonths(d, 60),
];

/** The walk stops at 25 years of age (a year past the last line) or 6 years from today, whichever is later. */
export const horizonOf = (patient) => {
  const a = addCalendarMonths(patient.input.dob, 300);
  const b = addCalendarMonths(patient.input.today, 72);
  return a > b ? a : b;
};

/**
 * The next days anything could change for a patient given nothing: each age
 * line, each dose clock, and every date the screen itself names (a complete
 * card's "Booster not yet due" date), so a promise can be checked on its day.
 */
export function checkpoints(patient, s, result = null) {
  const out = new Set();
  for (const m of AGE_LINES) out.add(addCalendarMonths(patient.input.dob, m));
  for (const d of [...s.acwy, ...s.menb]) if (d.date) for (const f of DOSE_CLOCKS) out.add(f(d.date));
  for (const r of result ? cardsOf(result) : []) for (const d of [r.boosterDueDate, r.earliestNextDate]) if (d) out.add(d);
  const end = horizonOf(patient);
  return [...out].filter((d) => d > s.today && d <= end).sort();
}

const quietFrom = (result, date) => {
  const cards = cardsOf(result);
  return {
    date,
    complete: Object.fromEntries(VACCINES.map((v) => [v, cards.some((r) => r.list === v && r.status === 'complete')])),
    cards: Object.fromEntries(VACCINES.map((v) => [v, cards.filter((r) => r.list === v)])),
  };
};

const stateKey = (s) => `${s.today}|${s.acwy.map((d) => `${d.brand}@${d.date}`).join(',')}|${s.menb.map((d) => `${d.brand}@${d.date}`).join(',')}|x${(s.declined ?? []).join('')}`;
export const MAX_ADVISED_DOSES = 24;

/**
 * Follow one patient down every road the app offers.
 *
 * At each screen: every offered dose is a branch, given on the date its card
 * says. A screen that asks for nothing (or only for what may be declined)
 * also walks forward to the next checkpoint with nothing given. The walk ends
 * at the horizon. A road that passes MAX_ADVISED_DOSES is reported.
 *
 * visitor (all optional): visit(ctx), arrive(ctx), gap(ctx), endless(ctx),
 * repeat(ctx) — the same vaccine asked for again on the day it was given.
 * ctx = { patient, s, result, trail, first, quietSince }.
 */
export function walk(patient, visitor) {
  const seen = new Set();
  const root = firstState(patient);
  const first = view(patient, root);
  if (first.excluded) return { states: 0 };
  const stack = [{ s: root, trail: [], quietSince: null }];
  while (stack.length) {
    const { s, trail, quietSince } = stack.pop();
    const k = `${stateKey(s)}|${quietSince ? `q${VACCINES.map((v) => (quietSince.complete[v] ? 'c' : '-')).join('')}` : ''}`;
    if (seen.has(k)) continue;
    seen.add(k);
    const result = view(patient, s);
    const ctx = { patient, s, result, trail, first, quietSince };
    visitor.visit?.(ctx);
    const { options: all, gaps } = optionsOn(result, s.today, s.declined);
    if (gaps.length) visitor.gap?.({ ...ctx, gaps });
    // Lifelong boosters (every 2–5 years for high-risk patients) would carry a
    // road on for ever, so a dose dated past the horizon ends the road.
    const options = nextOptions(all).filter((o) => o.date <= horizonOf(patient));
    if (options.length && trail.length >= MAX_ADVISED_DOSES) {
      visitor.endless?.(ctx);
      continue;
    }
    for (const o of options) {
      // The same vaccine asked for again on the day it was just given: the app
      // is not accepting its own dose. Reported once, not followed round again.
      const sameList = (t) => (t.list === 'MenB' ? 'MenB' : 'MenACWY') === (o.list === 'MenB' ? 'MenB' : 'MenACWY');
      if (trail.some((t) => t.date === o.date && sameList(t) && t.list !== 'Penta' && o.list !== 'Penta')) {
        visitor.repeat?.({ ...ctx, option: o });
        continue;
      }
      if (o.date !== s.today) visitor.arrive?.({ ...ctx, option: o, onTheDay: view(patient, { ...s, today: o.date }) });
      stack.push({
        s: give(s, o),
        trail: [...trail, { ...o, card: o.rec, seenOn: s.today, quietSince, screen: result }],
        quietSince: null,
      });
    }
    // Passing on an optional dose is a road of its own: once declined, it stays
    // declined while it stays optional (a card that turns required is offered again).
    const asksNothing = cardsOf(result).every((r) => mayDecline(r) || NOTHING_OWED.has(r.status));
    if (asksNothing) {
      const next = checkpoints(patient, s, result)[0];
      const declined = [...new Set([...(s.declined ?? []), ...cardsOf(result).filter(mayDecline).map((r) => r.list)])].sort();
      if (next) stack.push({ s: { ...s, today: next, declined }, trail, quietSince: quietSince ?? quietFrom(result, s.today) });
    }
  }
  return { states: seen.size };
}

export const road = (trail) => trail.map((d) => `${d.brand || d.list} ${d.date}`).join(' → ') || '(nothing given yet)';
