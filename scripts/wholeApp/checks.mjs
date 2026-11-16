// ─────────────────────────────────────────────────────────────────────────
// checks.mjs — the seven whole-app checks, adapted to meningococcal
// (port Phase 1.4, 2026-11-15; idea from PneumoVax scripts/wholeApp/checks.mjs).
//
// Each asks whether the app agrees with ITSELF, over every patient. None can
// tell you the app agrees with CDC: an app that was consistently wrong would
// pass all seven. That is what CDC's own test patients (Phase 1.5) are for.
//
//   1  Advice is accepted       a dose given on the date the app advised is
//                               never rejected, discounted, or called extra,
//                               and is not asked for again that same day.
//   2  The plan holds           a card that said the series ends there is not
//                               followed by another dose; a series does not grow.
//   3  Complete means complete  no later visit asks for another dose of that
//                               vaccine. Owner rule (PneumoVax, 2026-11-01):
//                               "Complete should only be used if no additional
//                               doses/boosters are needed."
//   4  Options agree            one pentavalent dose and the two separate shots
//                               it replaces leave the patient in the same place.
//   5  Card and chip agree      a dose chip that says "repeat this dose" has a
//                               card asking for it; the card's dose number
//                               matches the doses the chips count; a "Booster
//                               not yet due" date is the day the booster is asked.
//   6  Age lines are clean      on the birthday matches just past it; a dose a
//                               day either side of a line, and inside CDC's
//                               4-day grace, is read the same.
//   7  Stable over time         looking at the same record on a later date does
//                               not change whether a recorded dose counted, and
//                               a dated card still stands on its date.
//
// FINDINGS ARE LISTED, NOT FIXED (plan Phase 1.4). Every flag is counted by
// distinct patient, sorted into grid vs typical, and labelled with a clinical
// family so the owner can see each kind with one worked patient.
// ─────────────────────────────────────────────────────────────────────────
import { addCalendarMonths, addDays } from '../../src/logic/dateUtils.js';
import { recommend } from '../../src/logic/recommend.js';
import { SWEEPABLE_RISK_FACTORS } from '../../src/test-grid.js';
import {
  AGE_LINES, NOTHING_OWED, VACCINES, brandKey, cardText, cardsOf, familyOf, firstState, give,
  mayDecline, optionsOn, readCard, road, view,
} from './replay.mjs';

export const CHECK_NAMES = {
  1: 'Advice is accepted',
  2: 'The plan holds',
  3: 'Complete means complete',
  4: 'Options agree',
  5: 'Card and chip agree',
  6: 'Age lines are clean',
  7: 'Stable over time',
};

// ── Counting ─────────────────────────────────────────────────────────────

/** Rows that are a list for the owner, not a fault. */
// 'asks-risk-at-dose-about-its-own-advice': the app asks "was this patient at
// high risk when this dose was given?" about any dose before 10 (MenACWY) or
// 16 (MenB) for a patient high-risk now, its own advised doses included.
// Owner-confirmed design, 2026-07-23; counted so the owner sees how often.
export const INFORMATIONAL = new Set([
  'grace-edge-changes (listed, not judged)', 'line-changes-the-cards', 'line-changes-a-dose-given-today',
  'asks-risk-at-dose-about-its-own-advice', 'old-dose-at-a-grace-edge (method artefact)',
]);

const ageMonthsOn = (dob, date) => {
  const [y, m, d] = dob.split('-').map(Number);
  const [Y, M, D] = date.split('-').map(Number);
  return (Y - y) * 12 + (M - m) - (D < d ? 1 : 0);
};
const ageBand = (m) => (m < 24 ? 'under 2' : m < 120 ? '2–9y' : m < 192 ? '10–15y' : m < 228 ? '16–18y' : m < 288 ? '19–23y' : '24y+');

/** The clinical family a patient belongs to: what put them on a schedule, and their age today. */
export const familyOfPatient = (p) => `${p.input.riskIds.length ? p.input.riskIds.join('+') : 'healthy'}, ${ageBand(p.input.ageMonths ?? ageMonthsOn(p.input.dob, p.input.today))}`;

/** One tally per (check, kind, group). A patient counts once per group however many roads reach it. */
export function newTally() {
  const groups = new Map();
  const distinct = new Map();
  let current = null;
  const once = (k) => {
    let d = distinct.get(k);
    if (!d) { d = { key: k, grid: 0, typical: 0, last: null }; distinct.set(k, d); }
    if (d.last !== current.key) { d.last = current.key; d[current.group] += 1; }
  };
  return {
    setPatient(p) { current = p; },
    add(check, kind, group, detail) {
      once(`${check}\t${kind}`);
      if (!INFORMATIONAL.has(kind)) once(`${check}\t!`);
      const k = `${check}\t${kind}\t${group}`;
      let g = groups.get(k);
      if (!g) { g = { check, kind, group, flags: 0, grid: 0, typical: 0, families: {}, last: null, examples: [] }; groups.set(k, g); }
      g.flags += 1;
      if (g.last === current.key) return;
      g.last = current.key;
      g[current.group] += 1;
      const fam = familyOfPatient(current);
      g.families[fam] = (g.families[fam] ?? 0) + 1;
      if (g.examples.length < 3) g.examples.push({ key: current.key, dob: current.input.dob, today: current.input.today, detail });
    },
    rows() { return [...groups.values()].map(({ last, ...g }) => g); },
    /** Distinct patients per check (kind '*') and per check and kind. */
    distinct() { return [...distinct.values()].map(({ last, ...d }) => d); },
  };
}

const plain = (t) => String(t ?? '')
  .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '<date>')
  .replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}, \d{4}/g, '<date>')
  .replace(/\s+/g, ' ')
  .trim();
const listOf = (o) => (o.list === 'MenB' ? 'MenB' : 'MenACWY');
const asksOn = (result, list) => cardsOf(result).filter((r) => r.list === list && !NOTHING_OWED.has(r.status));
const labels = (result) => cardsOf(result).map((r) => `${r.list}: ${r.doseLabel}`).join(' + ');

// ── 1. Advice is accepted ────────────────────────────────────────────────

/** Why a recorded dose is not taken as given, or null if it is. */
export function notAccepted(d) {
  if (d.status !== 'valid') return d.needsInput ? 'still-asks-risk-at-dose' : `rejected-${d.status}`;
  if (d.doesNotCount) return 'does-not-count';
  if (d.extraDose || d.extraDoseUnverified) return 'called-extra';
  if (d.notAdolescentCount) return 'not-counted-as-adolescent-dose';
  return null;
}

function adviceAccepted(tally) {
  return {
    visit({ s, result, trail }) {
      for (const v of VACCINES) {
        const h = result.history?.[v];
        (h?.perDose ?? []).forEach((d, i) => {
          const dose = h.sortedDoses[i];
          if (!dose?.advised) return;
          const kind = notAccepted(d);
          if (!kind) return;
          const given = trail.find((t) => t.date === dose.date && brandKey(t.brand) === brandKey(dose.brand));
          tally.add(1, kind, `${given?.card?.doseLabel ?? '?'} [${v}${dose.creditedFrom ? ', credited' : ''}]`, {
            road: road(trail), advised: `${dose.brand} on ${dose.date}`, viewed: s.today,
            why: plain((d.reasons ?? []).join(' ')).slice(0, 300),
          });
        });
      }
      if (result.askedAboutAdvised) {
        tally.add(1, 'asks-risk-at-dose-about-its-own-advice', labels(result), { road: road(trail), on: s.today });
      }
    },
    repeat({ s, result, trail, option }) {
      tally.add(1, 'asked-again-the-day-it-was-given', `${option.rec.doseLabel} [${listOf(option)}]`, {
        road: road(trail), on: s.today, screen: labels(result),
      });
    },
  };
}

/**
 * Check 1, first screen only: EVERY brand a card lists (the walk gives only
 * the first MenACWY brand and one per MenB family), given on its date, is
 * taken. A pentavalent is given on the MenACWY list, as a clinician types it.
 */
export function firstScreenBrands(tally, patient) {
  const s = firstState(patient);
  const first = view(patient, s);
  if (first.excluded) return;
  const tries = [];
  for (const r of cardsOf(first)) {
    const read = readCard(r, s.today);
    if (!read.date) continue;
    for (const b of r.brands ?? []) tries.push({ rec: r, list: r.list, brand: brandKey(b), date: read.date });
  }
  if (first.pentavalent?.eligible) {
    for (const b of first.pentavalent.brands ?? []) tries.push({ rec: { doseLabel: 'Pentavalent' }, list: 'Penta', brand: brandKey(b), date: s.today });
  }
  for (const o of tries) {
    const after = view(patient, give(s, o));
    for (const v of (o.list === 'Penta' ? VACCINES : [listOf(o)])) {
      const h = after.history?.[v];
      const i = (h?.sortedDoses ?? []).findIndex((d) => d.advised);
      if (i < 0) continue;
      const kind = notAccepted(h.perDose[i]);
      if (kind) {
        tally.add(1, `listed-brand-${kind}`, `${o.rec.doseLabel} → ${o.brand} [${v}]`, {
          given: `${o.brand} on ${o.date}`, why: plain((h.perDose[i].reasons ?? []).join(' ')).slice(0, 300),
        });
      }
    }
  }
}

// ── 2. The plan holds ────────────────────────────────────────────────────
const doseOf = (label) => {
  const m = /Dose (\d+) of (\d+)/i.exec(label ?? '');
  return m ? { k: Number(m[1]), n: Number(m[2]) } : null;
};
const SAYS_FINAL = /\bfinal dose\b|\bcompletes? the (primary )?series\b/i;
const MENTIONS_BOOSTER = /\bboosters?\b/i;

function planHolds(tally) {
  return {
    visit({ s, trail, patient }) {
      if (trail.length < 2) return;
      const last = trail[trail.length - 1];
      if (last.date !== s.today || last.quietSince || last.list === 'Penta') return;
      const same = trail.slice(0, -1).filter((t) => listOf(t) === listOf(last) && t.list !== 'Penta');
      if (!same.length) return;
      const age = ageBand(ageMonthsOn(patient.input.dob, last.date));
      // A series total that grows partway through: "Dose 2 of 2", then "Dose 3 of 3".
      const was = doseOf(same.at(-1).card.doseLabel);
      const now = doseOf(last.card.doseLabel);
      if (was && now && now.n > was.n && !last.quietSince) {
        tally.add(2, 'series-grew-partway', `${listOf(last)}: ${same.at(-1).card.doseLabel} ⇒ ${last.card.doseLabel} (age ${age})`, { road: road(trail) });
      }
      // A card that said this dose finishes the series, then another dose in sequence.
      const finisher = same.find((t) => {
        const d = doseOf(t.card.doseLabel);
        return (d && d.k === d.n) || SAYS_FINAL.test(t.card.doseLabel ?? '');
      });
      if (!finisher || last.quietSince) return;
      const isBooster = /booster/i.test(last.card.doseLabel ?? '');
      if (isBooster && MENTIONS_BOOSTER.test(cardText(finisher.card))) return;
      tally.add(2, isBooster ? 'final-dose-then-unmentioned-booster' : 'final-dose-then-another-dose',
        `${listOf(last)}: ${finisher.card.doseLabel} ⇒ ${last.card.doseLabel} (age ${age})`, {
          road: road(trail), finisherSaid: plain(cardText(finisher.card)).slice(0, 300),
        });
    },
  };
}

// ── 3. Complete means complete ───────────────────────────────────────────
const WARNS = /\bboosters?\b|further dose|another dose|additional dose|\bat 16\b|16 years|16th birthday/i;

function completeMeansComplete(tally, lines) {
  return {
    visit({ s, result, trail, quietSince, patient }) {
      for (const v of VACCINES) {
        const cards = cardsOf(result).filter((r) => r.list === v);
        const asks = cards.filter((r) => !NOTHING_OWED.has(r.status));
        if (asks.length && cards.some((r) => r.status === 'complete')) {
          tally.add(3, 'complete-beside-an-ask', `${v}: ${cards.map((r) => r.doseLabel).join(' + ')}`, { road: road(trail), on: s.today });
        }
        if (!quietSince?.complete?.[v] || !asks.length) continue;
        const was = quietSince.cards[v];
        const from = ageMonthsOn(patient.input.dob, quietSince.date);
        const to = ageMonthsOn(patient.input.dob, s.today);
        const crossed = [...lines].reverse().find((l) => from < l && to >= l);
        const when = crossed != null ? `at age line ${crossed}m` : 'on a clock, no age line';
        const warned = was.some((r) => r.boosterDueDate) ? 'card showed a booster date'
          : was.some((r) => WARNS.test(cardText(r))) ? 'card text warned' : 'card silent';
        const optional = asks.every(mayDecline) ? 'optional' : 'asks';
        tally.add(3, `${optional}, ${warned}`, `${v}: ${was.map((r) => r.doseLabel).join(' + ')} ⇒ ${asks[0].doseLabel} (${when})`, {
          road: road(trail), completeOn: quietSince.date, askOn: s.today, said: plain(was.map(cardText).join(' ')).slice(0, 300),
        });
      }
    },
  };
}

// ── 4. Options agree ─────────────────────────────────────────────────────
// What the next screen says about each vaccine, without the pentavalent card
// (whose 6-month repeat rule is meant to differ between the two roads).
const nextScreen = (result) => cardsOf(result).map((r) => [r.list, r.status, r.doseLabel, !!r.dueToday, r.earliestNextDate ?? '-', r.boosterDueDate ?? '-'].join('|')).join(' ¦ ');

function optionsAgree(tally) {
  return {
    visit({ s, result, trail, patient }) {
      if (!result.pentavalent?.eligible) return;
      const acwyCard = asksOn(result, 'MenACWY').find((r) => r.dueToday);
      const menbCard = asksOn(result, 'MenB').find((r) => r.dueToday);
      if (!acwyCard || !menbCard) return;
      for (const p of result.pentavalent.brands ?? []) {
        const penta = brandKey(p);
        const fam = familyOf(penta);
        const menbBrand = (menbCard.brands ?? []).map(brandKey).find((b) => familyOf(b) === fam);
        const acwyBrand = brandKey((acwyCard.brands ?? [])[0]);
        if (!menbBrand || !acwyBrand) {
          tally.add(4, 'no-separate-shot-of-the-same-family', `${penta} vs ${menbCard.doseLabel}`, { on: s.today, road: road(trail) });
          continue;
        }
        const one = view(patient, give(s, { list: 'Penta', brand: penta, date: s.today }));
        const two = view(patient, give(give(s, { list: 'MenACWY', brand: acwyBrand, date: s.today }), { list: 'MenB', brand: menbBrand, date: s.today }));
        const a = nextScreen(one);
        const b = nextScreen(two);
        if (a === b) continue;
        const ca = cardsOf(one);
        const cb = cardsOf(two);
        const diff = VACCINES.filter((v) => ca.filter((r) => r.list === v).map((r) => `${r.status}|${r.doseLabel}|${r.earliestNextDate}|${r.dueToday}`).join() !== cb.filter((r) => r.list === v).map((r) => `${r.status}|${r.doseLabel}|${r.earliestNextDate}|${r.dueToday}`).join());
        tally.add(4, 'pentavalent-and-two-shots-lead-to-different-screens',
          `${penta} vs ${acwyBrand}+${menbBrand}: differs on ${diff.join('+') || 'boosters'} (after ${acwyCard.doseLabel} + ${menbCard.doseLabel})`, {
            on: s.today, road: road(trail), afterPentavalent: plain(a).slice(0, 300), afterTwoShots: plain(b).slice(0, 300),
          });
      }
    },
  };
}

// ── 5. Card and chip agree ───────────────────────────────────────────────
const SAYS_REPEAT = /\brepeat this dose\b|\bshould be repeated\b|\bmust be repeated\b|\brepeat the dose\b/i;

function cardAndChipAgree(tally) {
  return {
    visit({ s, result, trail, quietSince }) {
      for (const v of VACCINES) {
        const h = result.history?.[v];
        const asks = asksOn(result, v);
        // (a) a chip says repeat, and no card asks for that vaccine
        const repeats = (h?.perDose ?? []).filter((d) => d.doesNotCount && SAYS_REPEAT.test((d.reasons ?? []).join(' ')));
        if (repeats.length && !asks.length) {
          tally.add(5, 'chip-says-repeat-no-card-asks', `${v}: ${cardsOf(result).filter((r) => r.list === v).map((r) => r.doseLabel).join(' + ')}`, {
            road: road(trail), on: s.today, chip: plain(repeats[0].reasons.join(' ')).slice(0, 240),
          });
        }
        // (b) "Dose k of N" when the chips count a different number of doses before it
        const counted = (h?.perDose ?? []).filter((d) => !notAccepted(d)).length;
        for (const r of asks) {
          const d = doseOf(r.doseLabel);
          if (d && d.k !== counted + 1) {
            tally.add(5, 'card-dose-number-not-what-chips-count', `${v}: ${r.doseLabel} with ${counted} counted`, { road: road(trail), on: s.today });
          }
        }
        // (c) the booster date a complete card showed is the day the booster is asked
        if (quietSince?.complete?.[v] && asks.length) {
          const promised = quietSince.cards[v].find((r) => r.boosterDueDate);
          if (!promised) continue;
          const read = readCard(asks[0], s.today);
          const asked = asks[0].dueToday ? s.today : read.date;
          const exact = promised.boosterDueDateExact;
          const off = Math.abs((Date.parse(asked) - Date.parse(promised.boosterDueDate)) / 864e5);
          if (exact ? off > 0 : off > 31) {
            tally.add(5, `booster-asked-on-another-day${exact ? '' : ' (date shown as ~approximate)'}`, `${v}: ${promised.doseLabel} ⇒ ${asks[0].doseLabel}`, {
              road: road(trail), shown: promised.boosterDueDate, asked, daysOff: Math.round(off),
            });
          }
        }
      }
    },
  };
}

// ── 7's replay half: a dated card still stands on its date ───────────────
function adviceStillStands(tally, lines) {
  return {
    arrive({ s, option, onTheDay, patient, trail }) {
      const { options } = optionsOn(onTheDay, option.date, s.declined);
      // On its day the card must say DUE TODAY. A card still reading "Next dose
      // not yet due - eligible <today>" is not advice a clinician acts on
      // (found by breaking the app on purpose, 2026-11-15: the first version
      // of this check accepted it).
      if (options.some((o) => o.list === option.list && o.date === option.date && o.kind === 'now')) return;
      if (options.some((o) => o.list === option.list && o.date === option.date)) {
        tally.add(7, 'advised-day-arrives-card-still-says-not-yet-due', `${option.rec.doseLabel} [${option.list}]`,
          { road: road(trail), seenOn: s.today, advised: option.date });
        return;
      }
      const from = ageMonthsOn(patient.input.dob, s.today);
      const to = ageMonthsOn(patient.input.dob, option.date);
      const crossed = [...lines].reverse().find((l) => from < l && to >= l);
      const later = options.find((o) => o.list === option.list);
      tally.add(7, later ? 'advice-moved-on-its-day' : 'advice-gone-on-its-day',
        `${option.rec.doseLabel} [${option.list}]${crossed != null ? ` crossed ${crossed}m` : ''} ⇒ ${asksOn(onTheDay, option.list).map((r) => r.doseLabel).join(' + ') || '(asks nothing)'}`,
        { road: road(trail), seenOn: s.today, advised: option.date, movedTo: later?.date ?? null });
    },
  };
}

/** The checks that follow the advice forward, combined into one walk. */
export function replayChecks(tally, wanted, lines = AGE_LINES) {
  const list = [];
  if (wanted.has(1)) list.push(adviceAccepted(tally));
  if (wanted.has(2)) list.push(planHolds(tally));
  if (wanted.has(3)) list.push(completeMeansComplete(tally, lines));
  if (wanted.has(4)) list.push(optionsAgree(tally));
  if (wanted.has(5)) list.push(cardAndChipAgree(tally));
  if (wanted.has(7)) list.push(adviceStillStands(tally, lines));
  return {
    visit: (ctx) => list.forEach((v) => v.visit?.(ctx)),
    arrive: (ctx) => list.forEach((v) => v.arrive?.(ctx)),
    repeat: (ctx) => list.forEach((v) => v.repeat?.(ctx)),
    gap: (ctx) => ctx.gaps.forEach((g) => tally.add('harness', 'unreadable-card', g.doseLabel, { on: ctx.s.today })),
    endless: (ctx) => tally.add('harness', 'dose-cap-reached', ctx.trail.at(-1)?.card?.doseLabel ?? '-', { road: road(ctx.trail) }),
  };
}

// ── 6. Age lines are clean ───────────────────────────────────────────────
// Only the AGE moves: the date of birth shifts a day each way while today and
// every dose date stay put, so no interval changes.
const CARD_FIELDS = ['status', 'doseLabel', 'dueToday', 'doseNum', 'seriesTotal', 'primaryTotal', 'family'];
const DOSE_FIELDS = ['status', 'effectiveDoseNum', 'doesNotCount', 'notAdolescentCount', 'extraDose', 'extraDoseUnverified', 'needsInput'];

export function signature(result) {
  const cards = cardsOf(result).map((r) => ({
    list: r.list,
    ...Object.fromEntries(CARD_FIELDS.map((f) => [f, r[f] ?? null])),
    dated: !!r.earliestNextDate,
    booster: !!r.boosterDueDate,
    brands: (r.brands ?? []).map(brandKey).join('/'),
  }));
  const doses = Object.fromEntries(VACCINES.map((v) => [v, (result.history?.[v]?.perDose ?? []).map((d) => Object.fromEntries(DOSE_FIELDS.map((f) => [f, d[f] ?? null])))]));
  return { excluded: !!result.excluded, penta: (result.pentavalent?.brands ?? []).map(brandKey).join('/'), cards, doses };
}

export function differences(a, b) {
  const out = [];
  const lab = (x) => x.cards.map((c) => `${c.list}: ${c.doseLabel}`).join(' + ');
  if (a.cards.length !== b.cards.length || a.cards.some((c, i) => c.doseLabel !== b.cards[i].doseLabel || c.list !== b.cards[i].list)) {
    out.push(`cards: ${lab(a) || '(none)'} → ${lab(b) || '(none)'}`);
  } else {
    a.cards.forEach((c, i) => {
      for (const f of Object.keys(c)) if (c[f] !== b.cards[i][f]) out.push(`card ${c.list} ${c.doseLabel}: ${f} ${c[f]} → ${b.cards[i][f]}`);
    });
  }
  if (a.penta !== b.penta) out.push(`pentavalent: ${a.penta || '(none)'} → ${b.penta || '(none)'}`);
  for (const v of VACCINES) {
    a.doses[v].forEach((d, i) => {
      for (const f of DOSE_FIELDS) if (d[f] !== b.doses[v][i]?.[f]) out.push(`${v} dose ${i + 1}: ${f} ${d[f]} → ${b.doses[v][i]?.[f]}`);
    });
  }
  return out;
}

const seeOn = (patient, dob) => recommend({ ...patient.input, ageMonths: undefined, dob });

export function ageLineCheck(tally, patient, lines = AGE_LINES) {
  const { dob, today } = patient.input;
  const L = ageMonthsOn(dob, today);
  if (!lines.includes(L) || addCalendarMonths(dob, L) !== today) return;
  const short = addDays(dob, 1);
  const inside = addDays(dob, -1);
  const dates = [...patient.input.menacwyDoses, ...patient.input.menbDoses].map((d) => d.date);
  if (dates.some((d) => d < short)) return;
  const seen = [short, dob, inside].map((x) => seeOn(patient, x));
  const [a, b, c] = seen.map(signature);
  // Moving the date of birth a day also moves the age at every OLD dose by a
  // day. A dose sitting exactly on the edge of the 4-day grace then reads
  // differently for a reason that has nothing to do with today's birthday, so
  // those are named apart as the method's own artefact (found 2026-11-15:
  // MenB doses 5 days before the 10th birthday, 280 grid patients).
  const newest = dates.reduce((x, y) => (x > y ? x : y), '');
  const onVsInside = differences(b, c);
  const oldDose = (d) => /^(MenACWY|MenB) dose/.test(d) && newest !== today;
  const real = onVsInside.filter((d) => !oldDose(d));
  if (real.length) {
    tally.add(6, 'on-the-birthday-differs-from-a-day-after', `${L}m: ${plain(real[0])}`, { all: real.slice(0, 6) });
  } else if (onVsInside.length) {
    tally.add(6, 'old-dose-at-a-grace-edge (method artefact)', `${L}m: ${plain(onVsInside[0])}`, { all: onVsInside.slice(0, 6) });
  }
  for (const d of differences(a, b)) {
    const aboutADose = /^(MenACWY|MenB) dose/.test(d);
    const kind = !aboutADose ? 'line-changes-the-cards'
      : newest === today ? 'line-changes-a-dose-given-today'
        : 'line-changes-a-dose-given-before-today';
    tally.add(6, kind, `${L}m: ${plain(d)}`, { today });
  }
}

/**
 * Doses given a day either side of an age line, viewed 90 days later. The
 * dose ON the line must read like a dose a day after it; a dose up to 4 days
 * early must read like one on the line (CDC's 4-day grace for ages); the step
 * from 4 to 5 days early is where the grace ends, listed, not judged.
 */
export const DOSE_LINES = [
  { brand: 'Menveo 2-vial', list: 'acwy', atM: [2, 7, 12, 24] },
  { brand: 'MenQuadfi', list: 'acwy', atM: [24, 84, 120, 132, 192, 228] },
  { brand: 'Bexsero', list: 'menb', atM: [120, 192, 288] },
  { brand: 'Trumenba', list: 'menb', atM: [120, 192, 288] },
];
const DOSE_LINE_PRIORS = [
  { name: 'nothing before', acwy: [] },
  { name: 'MenACWY at 11', acwy: [['MenQuadfi', 132]] },
];
const DOSE_LINE_DOB = '2000-03-10';

export function doseLineCases(riskProfiles = [[], ...SWEEPABLE_RISK_FACTORS.map((r) => [r.id])]) {
  const cases = [];
  for (const { brand, list, atM } of DOSE_LINES) {
    for (const L of atM) {
      for (const prior of DOSE_LINE_PRIORS) {
        if (prior.acwy.some(([, at]) => at >= L)) continue;
        for (const riskIds of riskProfiles) cases.push({ brand, list, L, prior, riskIds });
      }
    }
  }
  return cases;
}

export function doseLineCheck(tally, c) {
  const { brand, list, L, prior, riskIds } = c;
  const line = addCalendarMonths(DOSE_LINE_DOB, L);
  const today = addDays(line, 90);
  const base = prior.acwy.map(([b, at]) => ({ brand: b, date: addCalendarMonths(DOSE_LINE_DOB, at) }));
  const see = (shift) => {
    const dose = { brand, date: addDays(line, shift) };
    return signature(recommend({
      dob: DOSE_LINE_DOB, riskIds, today,
      menacwyDoses: list === 'acwy' ? [...base, dose] : base,
      menbDoses: list === 'menb' ? [dose] : [],
      riskAtDoseAnswers: { MenACWY: {}, MenB: {} },
    }));
  };
  const on = see(0);
  const where = `${brand} at ${L}m, ${prior.name}`;
  const onVsAfter = differences(on, see(1));
  if (onVsAfter.length) tally.add(6, 'dose-on-the-line-differs-from-a-day-after', `${brand} at ${L}m: ${plain(onVsAfter[0])}`, { where, riskIds, all: onVsAfter.slice(0, 6) });
  const graced = differences(see(-4), on);
  if (graced.length) tally.add(6, 'dose-inside-the-4-day-grace-differs-from-on-the-line', `${brand} at ${L}m: ${plain(graced[0])}`, { where, riskIds, all: graced.slice(0, 6) });
  for (const d of differences(see(-5), see(-4))) tally.add(6, 'grace-edge-changes (listed, not judged)', `${brand} at ${L}m: ${plain(d)}`, { where, riskIds });
}

// ── 7. Stable over time ──────────────────────────────────────────────────
export const LATER_VIEWS = [1, 7, 28, 90, 365, 1827];
const DOSE_STABLE_FIELDS = ['status', 'effectiveDoseNum', 'doesNotCount', 'notAdolescentCount', 'extraDose', 'extraDoseUnverified', 'recordProblem'];

export function stableOverTime(tally, patient, lines = AGE_LINES) {
  const s = firstState(patient);
  const base = view(patient, s);
  if (base.excluded) return;
  const { dob, today } = patient.input;
  for (const k of LATER_VIEWS) {
    const later = addDays(today, k);
    const r = view(patient, { ...s, today: later });
    const crossed = lines.filter((m) => { const d = addCalendarMonths(dob, m); return d > today && d <= later; });
    // A recorded dose was given when it was given. Looking at it later must
    // not change whether it counted — across an age line or not.
    for (const v of VACCINES) {
      (base.history?.[v]?.perDose ?? []).forEach((d, i) => {
        const e = r.history?.[v]?.perDose?.[i];
        for (const f of DOSE_STABLE_FIELDS) {
          if ((d[f] ?? null) !== (e?.[f] ?? null)) {
            tally.add(7, 'recorded-dose-verdict-changed', `${v} ${f}: ${d[f] ?? '-'} → ${e?.[f] ?? '-'}${crossed.length ? ` (crossing ${crossed.join(',')}m)` : ''}`, { viewedLater: later, dose: base.history[v].sortedDoses[i] });
          }
        }
      });
    }
    if (crossed.length) continue;
    for (const c of cardsOf(base)) {
      const same = cardsOf(r).find((x) => x.list === c.list && x.doseLabel === c.doseLabel);
      if (!same) {
        tally.add(7, 'card-changed-with-no-age-line', `${c.list}: ${c.doseLabel} ⇒ ${cardsOf(r).filter((x) => x.list === c.list).map((x) => x.doseLabel).join(' + ') || '(none)'}`, { viewedLater: later });
        continue;
      }
      if (c.earliestNextDate) {
        const expectDue = later >= c.earliestNextDate;
        if (expectDue ? !same.dueToday : same.earliestNextDate !== c.earliestNextDate) {
          tally.add(7, 'advised-date-moved', `${c.list}: ${c.doseLabel}`, { viewedLater: later, was: c.earliestNextDate, now: same.earliestNextDate ?? (same.dueToday ? 'due' : same.status) });
        }
      } else if (c.dueToday && !same.dueToday) {
        tally.add(7, 'due-today-stopped-being-due', `${c.list}: ${c.doseLabel}`, { viewedLater: later, now: same.earliestNextDate ?? same.status });
      } else if (c.status !== same.status) {
        tally.add(7, 'status-changed-with-no-age-line', `${c.list}: ${c.doseLabel}: ${c.status} → ${same.status}`, { viewedLater: later });
      }
    }
  }
}

