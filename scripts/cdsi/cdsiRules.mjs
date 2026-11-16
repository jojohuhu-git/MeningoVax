// ── CDC's CDSI rule files, read as a list of plain facts (port Phase 2.3, 2026-11-15) ──
//
// CDSI ships each vaccine's rules as an XML file ("Antigen Supporting Data").
// This module reads MeningoVax's two (MenACWY, MenB) and turns every rule in
// them into one FACT: a stable, readable name and the value CDC wrote, e.g.
//
//   ACWY · Meningococcal ACWY risk 2-dose series · Dose 2 · gap from previous dose
//     → "absolute minimum 8 weeks - 4 days; minimum 8 weeks; earliest recommended 8 weeks"
//
// Nothing here is part of the app. The facts are used two ways:
//   1. cdsiRuleMap.mjs holds each row of the app's rule table (doseRules.js)
//      against the facts it corresponds to, and names every difference.
//   2. The facts are saved (cdc-files/meningo-cdsi-rules.json), so a new CDSI
//      release that changes ANY rule turns the test red until someone reads it.
//
// How CDSI words a rule (CDSI Logic Specification; read from the files):
//   "8 weeks - 4 days"  the 4-day grace: a dose up to 4 days early still counts.
//   absMinAge/absMinInt the line below which a dose does NOT count (a floor).
//   absMinInt "0 days"  no floor at all: the gap is timing advice only.
//   minAge/minInt       the minimum without the grace.
//   earliestRec/latestRec  when to give it (advice, not whether it counts).
//   maxAge              a dose given at or after this age does not count for
//                       that dose of that series.
//   allowableInterval   a second chance: a dose that fails the gaps above still
//                       counts if it meets this one.
//   effective/cessation a rule that applies only to doses given in that window.
// ─────────────────────────────────────────────────────────────────────────

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
export const CDSI_VERSION = '4.65';
export const CDSI_FILES = {
  ACWY: join(HERE, 'cdc-files', `AntigenSupportingData-Meningococcal-ACWY-${CDSI_VERSION}.xml`),
  B: join(HERE, 'cdc-files', `AntigenSupportingData-Meningococcal-B-${CDSI_VERSION}.xml`),
};
export const SAVED_FACTS_FILE = join(HERE, 'cdc-files', 'meningo-cdsi-rules.json');

// ── A small XML reader ────────────────────────────────────────────────────
// CDSI's files use plain elements only (no attributes that matter, no mixed
// text), so a 30-line reader is enough and the app gains no dependency.
// It throws on anything it does not understand rather than guess.
export function parseXml(text) {
  const root = { tag: '#root', children: [], text: '' };
  const stack = [root];
  const re = /<(\/?)([A-Za-z_][\w.-]*)([^>]*?)(\/?)>|<\?[\s\S]*?\?>|<!--[\s\S]*?-->|([^<]+)/g;
  let m;
  while ((m = re.exec(text))) {
    const [whole, close, tag, , selfClose, chars] = m;
    if (chars !== undefined) { stack[stack.length - 1].text += chars; continue; }
    if (!tag) continue; // declaration or comment
    if (close) {
      const top = stack.pop();
      if (top.tag !== tag) throw new Error(`CDSI XML: </${tag}> closes <${top.tag}>`);
      continue;
    }
    const node = { tag, children: [], text: '' };
    stack[stack.length - 1].children.push(node);
    if (!selfClose && !whole.endsWith('/>')) stack.push(node);
  }
  if (stack.length !== 1) throw new Error('CDSI XML: unclosed element');
  return root;
}

const kids = (n, tag) => n.children.filter((c) => c.tag === tag);
const kid = (n, tag) => n.children.find((c) => c.tag === tag) ?? null;
const txt = (n, tag) => {
  const k = kid(n, tag);
  if (!k) return '';
  return k.children.length ? '' : k.text.trim();
};
const descendants = (n, tag, out = []) => {
  for (const c of n.children) { if (c.tag === tag) out.push(c); descendants(c, tag, out); }
  return out;
};

// ── CDSI durations ────────────────────────────────────────────────────────
// "8 weeks - 4 days" → { n: 8, unit: 'weeks', graceDays: 4 }. "1 year" and
// "1 years" both appear. Anything more complicated (e.g. "13 years + 4 weeks",
// a recommended age) returns { complex: true } and is never compared.
const UNIT = { day: 'days', days: 'days', week: 'weeks', weeks: 'weeks', month: 'months', months: 'months', year: 'years', years: 'years' };
export function duration(text) {
  if (!text) return null;
  const m = /^(\d+)\s+(days?|weeks?|months?|years?)(?:\s+-\s+(\d+)\s+days?)?$/.exec(text.trim());
  if (!m) return { complex: true, text };
  return { n: Number(m[1]), unit: UNIT[m[2]], graceDays: m[3] ? Number(m[3]) : 0, text };
}

// ── The facts ─────────────────────────────────────────────────────────────
const AGE_FIELDS = ['absMinAge', 'minAge', 'earliestRecAge', 'latestRecAge', 'maxAge'];
const AGE_WORDS = {
  absMinAge: 'absolute minimum age', minAge: 'minimum age', earliestRecAge: 'earliest recommended age',
  latestRecAge: 'latest recommended age', maxAge: 'maximum age',
};

function windowText(n) {
  const ef = txt(n, 'effectiveDate'); const ce = txt(n, 'cessationDate');
  if (!ef && !ce) return '';
  return ` [doses given ${ef ? `from ${ef}` : ''}${ef && ce ? ' ' : ''}${ce ? `until ${ce}` : ''}]`;
}

function fromText(i) {
  if (txt(i, 'fromPrevious') === 'Y') return 'gap from previous dose';
  if (txt(i, 'fromTargetDose')) return `gap from dose ${txt(i, 'fromTargetDose')}`;
  if (txt(i, 'fromMostRecent')) return `gap from most recent CVX ${txt(i, 'fromMostRecent').replace(/\s+/g, '')}`;
  const obs = kid(i, 'fromRelevantObs');
  if (obs && txt(obs, 'code')) return `gap from condition ${txt(obs, 'code')}`;
  return 'gap from (unstated)';
}

function skipText(skip) {
  // One line per condition: what CDSI checks to decide this dose is not needed.
  const out = [];
  const ctx = txt(skip, 'context');
  const setLogic = txt(skip, 'setLogic');
  for (const [si, set] of kids(skip, 'set').entries()) {
    const condLogic = txt(set, 'conditionLogic');
    for (const [ci, c] of kids(set, 'condition').entries()) {
      const parts = ['conditionType', 'startDate', 'endDate', 'beginAge', 'endAge', 'interval', 'doseCount', 'doseType', 'doseCountLogic', 'vaccineTypes', 'seriesGroups']
        .map((k) => [k, txt(c, k)]).filter(([, v]) => v).map(([k, v]) => `${k}=${v.replace(/\s+/g, ' ')}`);
      out.push({ key: `skip (${ctx || 'any'}) set ${si + 1} condition ${ci + 1}`, value: `${parts.join('; ')}${condLogic ? ` | within set: ${condLogic}` : ''}${setLogic ? ` | between sets: ${setLogic}` : ''}` });
    }
  }
  return out;
}

/** Every rule in the two files, as { key, value, … }. Keys are unique. */
export function readCdsiFacts() {
  const facts = new Map();
  const add = (key, value, extra = {}) => {
    if (facts.has(key)) throw new Error(`CDSI fact named twice: ${key}`);
    facts.set(key, { key, value, ...extra });
  };
  for (const [file, path] of Object.entries(CDSI_FILES)) {
    const doc = parseXml(readFileSync(path, 'utf8'));
    for (const s of descendants(doc, 'series')) {
      const name = txt(s, 'seriesName');
      const S = `${file} · ${name}`;
      add(`${S} · series type`, txt(s, 'seriesType'));
      const inds = kids(s, 'indication').map((i) => {
        const code = txt(kid(i, 'observationCode') ?? { children: [] }, 'code');
        return code ? `${code} from ${txt(i, 'beginAge') || 'any age'}${txt(i, 'endAge') ? ` to ${txt(i, 'endAge')}` : ''}` : null;
      }).filter(Boolean);
      add(`${S} · conditions that put a patient on it`, inds.length ? inds.join(', ') : '(none: everyone)');
      for (const d of kids(s, 'seriesDose')) {
        const D = `${S} · ${txt(d, 'doseNumber')}`;
        for (const a of kids(d, 'age')) {
          const w = windowText(a);
          for (const f of AGE_FIELDS) if (txt(a, f)) add(`${D} · ${AGE_WORDS[f]}${w}`, txt(a, f), { file, series: name, dose: txt(d, 'doseNumber'), field: f });
        }
        for (const i of kids(d, 'interval')) {
          const abs = txt(i, 'absMinInt'); const min = txt(i, 'minInt'); const rec = txt(i, 'earliestRecInt');
          if (!abs && !min && !rec) continue;
          add(`${D} · ${fromText(i)}${windowText(i)}`,
            `absolute minimum ${abs || '(none)'}; minimum ${min || '(none)'}; earliest recommended ${rec || '(none)'}`,
            { file, series: name, dose: txt(d, 'doseNumber'), abs: duration(abs), min: duration(min), live: !txt(i, 'cessationDate') });
        }
        for (const i of kids(d, 'allowableInterval')) {
          const abs = txt(i, 'absMinInt');
          if (!abs) continue;
          add(`${D} · allowable ${fromText(i)}${windowText(i)}`, `absolute minimum ${abs}`,
            { file, series: name, dose: txt(d, 'doseNumber'), abs: duration(abs), live: !txt(i, 'cessationDate') });
        }
        for (const v of [...kids(d, 'preferableVaccine'), ...kids(d, 'allowableVaccine')]) {
          const cvx = txt(v, 'cvx');
          if (!cvx) continue;
          const kind = v.tag === 'preferableVaccine' ? 'preferred' : 'allowable';
          add(`${D} · ${kind} CVX ${cvx}${windowText(v)}`, `from ${txt(v, 'beginAge') || 'any age'} to ${txt(v, 'endAge') || 'no upper age'}`,
            { file, series: name, dose: txt(d, 'doseNumber'), cvx, kind, begin: duration(txt(v, 'beginAge')), end: duration(txt(v, 'endAge')) });
        }
        for (const sk of kids(d, 'conditionalSkip')) for (const x of skipText(sk)) add(`${D} · ${x.key}`, x.value);
        if (txt(d, 'recurringDose') === 'Yes') add(`${D} · repeats`, 'Yes');
      }
    }
  }
  return facts;
}

/** The saved facts, as { key: value }, or null when never saved. */
export function readSavedFacts() {
  try { return JSON.parse(readFileSync(SAVED_FACTS_FILE, 'utf8')).facts; } catch { return null; }
}
