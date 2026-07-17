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
// Sources: CDC adult/child schedule notes, ACIP 2020 MMWR, 2023/2025 pentavalent
// MMWRs. See src/data/refs.js.
// ─────────────────────────────────────────────────────────────────────────

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
    minAgeM: 24,       // ≥2 years
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
