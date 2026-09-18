// P2-1 (fix queue 2026-09-17): intervals get the same treatment dose TOTALS got.
//
// seriesTotals.js exists because a series length was hand-typed in several
// places and they drifted apart. Intervals never got that module, and P0-1 is
// what it cost: the MenACWY infant primary gap was written as `DAYS.weeks(4)`
// in four places AND, separately, as the English words ">=4 weeks" inside the
// card sentence. Every one of them was wrong, and fixing only the constant
// would have left the sentence lying to the clinician.
//
// intervals.js is the sibling module. This file is its drift guard, and it
// tests two different things:
//
//   1. STRUCTURAL — the number is written down once. A source scan, because
//      the whole failure mode is a second copy somewhere else that happens to
//      agree today.
//   2. BEHAVIOURAL — the engine, the validator and the CARD SENTENCE all come
//      from that one number. The sentence matters as much as the constant: a
//      card that enforces 8 weeks while its own text says 4 misleads twice.
//
// Groups are migrated one at a time, suite green in between, and each group
// adds its constants to the scan below as it lands.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { recommend } from '../recommend.js';
import { analyzeHistory } from '../validate.js';
import { MENACWY_HIGHRISK_PRIMARY_GAP, weeksLabel } from '../intervals.js';
import { noteText } from '../../test-note-text.js';

const TODAY = '2026-09-15';
const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));
const acwy = (ageMonths, dates, riskIds) => recommend({
  today: TODAY, ageMonths, riskIds,
  menacwyDoses: dates.map((d) => ({ date: d })), menbDoses: [],
  riskAtDoseAnswers: { MenACWY: allYes(dates.length) },
}).menacwy[0];

const readSrc = (name) => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

// Strip comments before scanning: the comments in these files QUOTE the old
// hand-typed constants on purpose, explaining what went wrong and why the
// number moved. That history is worth keeping and is not a second copy.
function code(name) {
  return readSrc(name)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.replace(/(^|[^:])\/\/.*$/, '$1'))
    .join('\n');
}

// Each entry: the literal no file outside intervals.js may contain any more,
// and the export that owns it now.
const MIGRATED = [
  ['DAYS.weeks(8)', 'MENACWY_HIGHRISK_PRIMARY_GAP'],
];

describe('P2-1 · a migrated interval is written down once', () => {
  for (const file of ['recommend.js', 'validate.js']) {
    for (const [literal, owner] of MIGRATED) {
      it(`${file} does not hand-type ${literal} (${owner} owns it)`, () => {
        const hits = code(file).split(literal).length - 1;
        expect(
          hits,
          `${file} still writes ${literal} ${hits} time(s). Import ${owner} from `
          + 'intervals.js instead — a second copy is how P0-1 happened.',
        ).toBe(0);
      });
    }
  }
});

describe('P2-1 · the MenACWY >=2y high-risk primary gap', () => {
  // Dose 1 given 8 weeks ago exactly, to a 5-year-old with asplenia.
  const DOSE_1 = '2026-07-21'; // 56 days before TODAY
  const card = () => acwy(60, [DOSE_1], ['asplenia']);

  it('the card advertises the module\'s number', () => {
    expect(card().minIntervalDays).toBe(MENACWY_HIGHRISK_PRIMARY_GAP);
  });

  it('the card SENTENCE states that same number, not a restatement of it', () => {
    // The point of P2-1: if the constant ever changes, this sentence has to
    // change with it, because it is interpolated rather than typed out.
    expect(noteText(card())).toContain(weeksLabel(MENACWY_HIGHRISK_PRIMARY_GAP));
  });

  it('the validator enforces the same number the card advertises', () => {
    // A second dose exactly at the gap counts...
    const atGap = analyzeHistory(
      'MenACWY',
      [{ date: DOSE_1 }, { date: TODAY }],
      60, ['asplenia'], TODAY, allYes(2),
    ).perDose;
    expect(atGap[1].status).toBe('valid');

    // ...and one a clear week early (well past CDC's 4-day grace) does not.
    const tooSoon = analyzeHistory(
      'MenACWY',
      [{ date: DOSE_1 }, { date: '2026-09-08' }],
      60, ['asplenia'], TODAY, allYes(2),
    ).perDose;
    expect(tooSoon[1].status).not.toBe('valid');
  });
});
