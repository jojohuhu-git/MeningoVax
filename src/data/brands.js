// ─────────────────────────────────────────────────────────────────────────
// BRANDS — meningococcal product metadata.
//
// `family` is the MenB antigen family — CRITICAL for the interchangeability
// lock. The two MenB families are NOT interchangeable with each other:
//   • 4C   : Bexsero, Penmenvy (GSK)
//   • FHbp : Trumenba, Penbraya (Pfizer)
// Within a family products may be mixed; across families they may not. This
// lock also spans the two pentavalents (GSK Penmenvy=4C vs Pfizer Penbraya=FHbp).
//
// `minAgeM` / `maxAgeM` are ACIP-usable windows (not FDA labels where ACIP is
// broader). 999 = no hard upper limit (use in any adult when indicated).
//
// `minAgeDays` is the same kind of floor as `minAgeM`, for a product whose
// SOURCE states its minimum age in weeks rather than months or years. A
// product carries one or the other, never both.
//
// MenQuadfi (2026-09-22, WA DOH/AAP alignment) is the only product this
// applies to: its floor is "6 weeks", and there is no whole-number-of-months
// value that means exactly 42 days for every birth month —
//   "6 weeks" in months:  1.367 - 1.452   (varies by birth month)
//   "2 months" in days:      59 - 61      (varies by birth month)
// Picking 1.45 rejects a July-born baby dosed exactly on time; picking 1.37
// wrongly accepts a February baby's early dose. Converting Menveo's "2
// months" the other way, into a fixed day count, is equally wrong — it would
// reject a 15-November baby who reaches 2 months in 59 days. The only floor
// that is exact for every birth month is the one stated in the unit the
// source actually used, so that is what each product stores.
//
// Sources: CDC adult/child schedule notes, ACIP 2020 MMWR, 2023/2025 pentavalent
// MMWRs. See src/data/refs.js.
// ─────────────────────────────────────────────────────────────────────────

// M2 (2026-09-22): the infant-band ceiling comes from ages.js rather than
// being retyped here, for the same reason everything else in this app has
// one home per number. ages.js imports nothing, so this does not create a
// cycle — it is the one exception to this file otherwise having no imports,
// made because the alternative is a second, driftable copy of "24 months".
import { MENACWY_INFANT_SERIES_MAX_AGE_MONTHS } from '../logic/ages.js';

export const VAX = {
  MenACWY: 'MenACWY',
  MenB: 'MenB',
};

// MenACWY standalone products
// D7: Menveo has two formulations — 2-vial (≥2 months) and 1-vial (≥10 years).
// Both are valid per ACIP/CDC when indicated; the 1-vial is convenient for older patients.
export const MENACWY_BRANDS = [
  {
    key: 'Menveo 2-vial',
    label: 'Menveo 2-vial (MenACWY)',
    mfr: 'GSK',
    minAgeM: 2,        // 2-vial is the only Menveo formulation licensed from 2 months
    maxAgeM: 999,
    active: true,
  },
  {
    key: 'Menveo 1-vial',
    label: 'Menveo 1-vial (≥10y) (MenACWY)',
    mfr: 'GSK',
    minAgeM: 120,      // 1-vial approved ≥10 years
    maxAgeM: 999,
    active: true,
  },
  {
    key: 'MenQuadfi',
    label: 'MenQuadfi (MenACWY)',
    mfr: 'Sanofi',
    minAgeDays: 42,    // ≥6 weeks (AAP-aligned, WA DOH 2026-09-22 — see header)
    maxAgeM: 999,
    active: true,
  },
  {
    key: 'Menactra',
    label: 'Menactra (MenACWY, discontinued)',
    mfr: 'Sanofi',
    minAgeM: 9,
    maxAgeM: 999,
    active: false,     // discontinued 2022; selectable only for recording past doses
  },
  {
    // Legacy: brand recorded as plain 'Menveo' (before the 1-vial/2-vial split).
    // Treat as 2-vial (≥2 months) for validation purposes.
    key: 'Menveo',
    label: 'Menveo (MenACWY)',
    mfr: 'GSK',
    minAgeM: 2,
    maxAgeM: 999,
    active: false,     // legacy label only — new entries use 'Menveo 2-vial' or 'Menveo 1-vial'
  },
];

// MenB standalone products
export const MENB_BRANDS = [
  {
    key: 'Bexsero',
    label: 'Bexsero (MenB)',
    mfr: 'GSK',
    family: '4C',
    minAgeM: 120,      // ≥10y
    maxAgeM: 999,
    active: true,
  },
  {
    key: 'Trumenba',
    label: 'Trumenba (MenB)',
    mfr: 'Pfizer',
    family: 'FHbp',
    minAgeM: 120,
    maxAgeM: 999,
    active: true,
  },
];

// Pentavalent (MenABCWY) products — cover BOTH MenACWY and MenB
export const PENTAVALENT_BRANDS = [
  {
    key: 'Penbraya',
    label: 'Penbraya (MenABCWY)',
    mfr: 'Pfizer',
    family: 'FHbp',    // its MenB component is FHbp
    covers: ['MenACWY', 'MenB'],
    minAgeM: 120,      // ≥10y
    maxAgeM: 999,
    active: true,
  },
  {
    key: 'Penmenvy',
    label: 'Penmenvy (MenABCWY)',
    mfr: 'GSK',
    family: '4C',      // its MenB component is 4C
    covers: ['MenACWY', 'MenB'],
    minAgeM: 120,
    maxAgeM: 999,
    active: true,
  },
];

// MenB family of any brand key (standalone or pentavalent). null if not a MenB product.
const FAMILY_BY_KEY = {
  Bexsero: '4C', Penmenvy: '4C',
  Trumenba: 'FHbp', Penbraya: 'FHbp',
};

export function menbFamily(brandKey) {
  if (!brandKey) return null;
  for (const [k, fam] of Object.entries(FAMILY_BY_KEY)) {
    if (brandKey.startsWith(k)) return fam;
  }
  return null;
}

// All brand keys that belong to a given MenB family (for building dose-2/3 options).
export function menbBrandsInFamily(family) {
  return [...MENB_BRANDS, ...PENTAVALENT_BRANDS]
    .filter((b) => b.family === family)
    .map((b) => b.label);
}

export const ALL_BRANDS = [
  ...MENACWY_BRANDS,
  ...MENB_BRANDS,
  ...PENTAVALENT_BRANDS,
];

// ── Product age floors, derived from the table above ─────────────────────
//
// `maxAgeM: 999` is the table's sentinel for "no hard upper limit" (see the
// header), not a real cap at 83 years. Anything reading maxAgeM has to say so
// explicitly, or it will quietly stop offering every vaccine to the oldest
// patients — which is exactly what happened the first time this helper was
// written.
//
// These are LICENCE floors — how young a product may be given — and they are
// not schedule ages. The age at which a dose is DUE, or counts toward a
// series, lives in `src/logic/ages.js`.
//
// They are derived rather than typed because both were previously hand-typed
// somewhere else: validate.js kept its own "most permissive" 2 and 120 under a
// comment explaining that they matched this table, and recommend.js decided
// which MenACWY brands to offer with its own 24 and 120. Those are the same
// numbers as `minAgeM` above, with nothing making them agree.

const NO_MAX_AGE = 999;

/**
 * A product's licence floor, in whichever unit its source states it (see the
 * header for why). Look this up instead of reading `minAgeM` directly on a
 * MENACWY_BRANDS row — MenQuadfi has no `minAgeM` at all.
 *
 * @returns {{unit: 'days'|'months', value: number} | null} null if no brand matches.
 */
export function brandMinAge(brandStr) {
  if (!brandStr) return null;
  for (const b of ALL_BRANDS) {
    if (brandStr.startsWith(b.key)) {
      return b.minAgeDays != null
        ? { unit: 'days', value: b.minAgeDays }
        : { unit: 'months', value: b.minAgeM };
    }
  }
  return null;
}

/**
 * The licence floor: the youngest age ANY MenACWY product may be given.
 *
 * M2 (2026-09-22): this used to be `Math.min(...MENACWY_BRANDS.map(b =>
 * b.minAgeM))` — a single MONTHS number, because every product's floor
 * happened to be stated in months. MenQuadfi's is stated in weeks (see the
 * header), so that reduce would now see `undefined` for it. Rather than
 * convert MenQuadfi's 42 days into an approximate months figure and lose the
 * exactness M1 built, this constant is kept in DAYS — the finer of the two
 * units — and set directly from MenQuadfi's row, since 42 days is
 * unambiguously smaller than every months-stated product's floor (the next
 * youngest, Menveo's 2 months, is 59-61 days; no birth month brings that
 * within reach of 42). A future product with a floor tighter than roughly
 * 8 weeks would need this reasoned through again, not just re-derived.
 *
 * This answers "could a dose of SOME MenACWY product have been given at this
 * age" — e.g. the unknown-brand permissive fallback in validate.js. It is
 * NOT the age the schedule asks for a dose; that is
 * MENACWY_SCHEDULE_MIN_AGE_MONTHS in ages.js, and the two now differ.
 */
export const MENACWY_LICENCE_MIN_AGE_DAYS = MENACWY_BRANDS.find((b) => b.key === 'MenQuadfi').minAgeDays;

/**
 * The youngest age any MenB-containing product may be given (10 years).
 * CDC child & adolescent schedule notes, MenB (fetched live 2026-09-17):
 * "minimum age: 10 years [MenB-4C, Bexsero; MenB-FHbp, Trumenba;
 * MenACWY-TT/MenB-FHbp, Penbraya]".
 */
export const MENB_MIN_AGE_MONTHS = Math.min(
  ...[...MENB_BRANDS, ...PENTAVALENT_BRANDS].map((b) => b.minAgeM),
);

/** The youngest age any pentavalent (MenABCWY) product may be given (10 years). */
export const PENTAVALENT_MIN_AGE_MONTHS = Math.min(
  ...PENTAVALENT_BRANDS.map((b) => b.minAgeM),
);

// Same averaged month length dateUtils.js's DAYS.months() uses. Duplicated
// rather than imported because this file otherwise has no dependency on the
// logic layer's date arithmetic, and one averaged constant is a much smaller
// thing to keep in step than a whole module import. Used ONLY below, for
// comparing a fractional AGE (not a real date) against a days-stated floor —
// a few days' fuzz here changes which brand chip appears on a card, not
// whether a specific recorded dose validates (that check has real dates and
// a date of birth, in validate.js, and never uses this approximation).
const AVG_DAYS_PER_MONTH = 30.4375;

/**
 * The MenACWY brands that may be given at this age, in table order.
 *
 * Discontinued products are excluded: they remain selectable when RECORDING a
 * dose given in the past, but are never offered for a dose to be given now.
 */
export function menacwyBrandLabelsForAge(ageMonths) {
  return MENACWY_BRANDS
    .filter((b) => b.active
      && (b.minAgeDays != null
        ? ageMonths * AVG_DAYS_PER_MONTH >= b.minAgeDays
        : ageMonths >= b.minAgeM)
      && (b.maxAgeM === NO_MAX_AGE || ageMonths <= b.maxAgeM))
    .map((b) => b.label);
}

/**
 * The MenACWY products an INFANT series may use: every product licensed
 * ANYWHERE within the infant/high-risk band (up to the second birthday), not
 * just the one licensed at the single youngest age.
 *
 * M2 (2026-09-22): this used to ask `menacwyBrandLabelsForAge(the single
 * youngest floor)`, which gives the wrong answer as soon as two products
 * have different floors — at MenQuadfi's 42-day floor that question returns
 * MenQuadfi ALONE, silently dropping Menveo from every infant card (caught
 * by regression-d2-d5-d6-d7.test.js). Asking instead "licensed anywhere in
 * the band" gives both: Menveo 2-vial (from 2 months) and MenQuadfi (from 6
 * weeks) are both licensed well before the second birthday; Menveo 1-vial
 * and the discontinued/legacy entries are not.
 *
 * Derived rather than typed so that a product licensed from infancy in future
 * appears on those cards automatically. Note this does NOT re-check the
 * patient's own age: the infant cards state what the SERIES is, and a patient
 * too young for any product is handled by the engine's own age gate.
 */
export const MENACWY_INFANT_SERIES_BRANDS = MENACWY_BRANDS
  .filter((b) => b.active
    && (b.minAgeDays != null
      ? b.minAgeDays <= MENACWY_INFANT_SERIES_MAX_AGE_MONTHS * AVG_DAYS_PER_MONTH
      : b.minAgeM <= MENACWY_INFANT_SERIES_MAX_AGE_MONTHS))
  .map((b) => b.label);
