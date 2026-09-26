import React, { useState, useEffect } from 'react';
import { recommend } from '../logic/recommend.js';
import { fmtAgeMonths, ageGroup, stripAntigen } from '../logic/format.js';
import { patientAgeMonths } from '../logic/patientAge.js';
import { todayISO, daysBetween } from '../logic/dateUtils.js';
import { RISK_FACTORS } from '../data/riskFactors.js';
import { MENACWY_BRANDS, MENB_BRANDS, PENTAVALENT_BRANDS } from '../data/brands.js';
import RecCard, { RecNote, RiskAgeNote } from './RecCard.jsx';
import Disclaimer from './Disclaimer.jsx';
import DoseEditor, { PentavalentCreditNote } from './DoseEditor.jsx';
import { Chevron } from './icons.jsx';
import { isBlankDoseRow, dropBlankDoseRows } from '../logic/doseIdentity.js';

const MENACWY_HISTORY_BRANDS = [
  ...MENACWY_BRANDS,
  ...PENTAVALENT_BRANDS,
  { key: '', label: 'Unknown brand' },
];

const MENB_HISTORY_BRANDS = [
  ...MENB_BRANDS,
  ...PENTAVALENT_BRANDS,
  { key: '', label: 'Unknown brand' },
];

export default function Results({ state, onReset, onChange, onBack, today }) {
  const { riskIds, menacwyDoses, menbDoses, riskAtDoseAnswers, dob } = state;
  // Calendar P1-3/P2-1: derived at render from the date of birth when there is
  // one, so the patient goes on ageing while the tab is open instead of being
  // frozen at the moment the Age step was filled in.
  const ageMonths = patientAgeMonths(state, today);
  // Exact day count for the weeks band (fmtAgeMonths' exactDays param) --
  // same dob + reference date patientAgeMonths already used above.
  const ageDays = dob ? daysBetween(dob, today || todayISO()) : null;
  const acwyRiskAnswers = riskAtDoseAnswers?.MenACWY ?? {};
  const bRiskAnswers = riskAtDoseAnswers?.MenB ?? {};
  const [editingAge, setEditingAge] = useState(false);
  const [editingDoses, setEditingDoses] = useState(false);

  const result = recommend({
    ageMonths: ageMonths ?? 0,
    dob,
    riskIds,
    menacwyDoses,
    menbDoses,
    riskAtDoseAnswers,
    today,
  });

  const { menacwy, menb, pentavalent, hct, history, excluded, exclusionMessage, exclusionCitations,
          riskAgeNote, riskAgeNoteCites, meta } = result;
  // calendar P2-1: recommend() is the one place that resolves "no today
  // passed" to the real clock (`meta.today`); everything below that draws a
  // "today" reads it from here, so the card text and the editors below agree
  // with the engine even when App.jsx isn't the caller (e.g. a test render).
  const resolvedToday = meta.today;

  if (excluded) {
    return (
      <div>
        <div className="advisory-banner advisory-banner-exclude" data-testid="exclusion-stop">
          <div className="advisory-banner-title">Does not apply to this patient</div>
          <div className="advisory-note">{exclusionMessage}</div>
          {exclusionCitations && exclusionCitations.length > 0 && (
            <div className="rec-citations">
              {exclusionCitations.map((c, i) => (
                <a key={i} href={c.url} target="_blank" rel="noopener noreferrer"
                  className="citation-chip" title={c.label}>{c.short || c.label}</a>
              ))}
            </div>
          )}
        </div>
        <Disclaimer />
        <div className="results-actions">
          {onBack && (
            <button className="btn btn-outline" onClick={onBack}>Edit risk factors</button>
          )}
          <button className="btn btn-outline" onClick={onReset}>Start Over</button>
        </div>
      </div>
    );
  }
  // Item 3 (2026-07-23): RecCard zips `doses[i]` against `doseValidations[i]`
  // by array index. analyzeHistory() sorts its perDose chronologically, so
  // the doses prop must come from the same sorted call, not raw entry order
  // (menacwyDoses/menbDoses), or the two arrays drift out of alignment.
  //
  // G1 (2026-09-16): that sorted call is now the engine's own. This screen used
  // to re-run analyzeHistory() on the raw lists, which meant the panel and the
  // recommendation above it each decided for themselves what the record said —
  // and after G1 they would have disagreed outright, because only the engine
  // credited a pentavalent to both families. One walk, read twice.
  const menacwyHistory = history.MenACWY;
  const menbHistory = history.MenB;
  // G1: the doses each list is being credited from the other (pentavalents),
  // read back off the engine's merged record rather than recomputed here.
  const creditedAcwy = menacwyHistory.sortedDoses.filter((d) => d.creditedFrom);
  const creditedB = menbHistory.sortedDoses.filter((d) => d.creditedFrom);

  // Provider answered the risk-at-dose "Needs input" prompt on a specific
  // dose. Recompute happens live via the normal onChange -> state -> re-render
  // cycle, same as every other editable field on this screen.
  // G2: `answerKey` is the dose's own id (see doseIdentity.js), NOT its
  // position — deleting or re-dating another dose must not hand this answer
  // to a different injection. An answer left behind by a deleted dose is
  // inert: its id is never looked up again.
  function handleRiskAtDoseAnswer(vaccine, answerKey, answer) {
    const key = vaccine === 'MenB' ? 'MenB' : 'MenACWY';
    const prevForVaccine = riskAtDoseAnswers?.[key] ?? {};
    onChange?.({
      riskAtDoseAnswers: {
        ...riskAtDoseAnswers,
        [key]: { ...prevForVaccine, [answerKey]: answer },
      },
    });
  }
  const group = ageGroup(ageMonths);
  const riskLabels = riskIds.map(id => RISK_FACTORS.find(r => r.id === id)?.label).filter(Boolean);

  const acwyDueRec = menacwy.find(r => r.dueToday);
  const bDueRec = menb.find(r => r.dueToday);
  const acwyDueToday = !!acwyDueRec;
  const bDueToday = !!bDueRec;
  // Item 4 (2026-07-23): a shared-decision rec (MenB 16-23y) can be dueToday
  // AND optional at the same time -- "due" alone reads as mandatory. Split
  // "due today" into required (must happen) vs. optional (shared clinical
  // decision) so the summary/banners/header never call an optional dose
  // flatly "due."
  const acwyRequiredToday = acwyDueToday && acwyDueRec.status !== 'shared-decision';
  const bRequiredToday = bDueToday && bDueRec.status !== 'shared-decision';

  // D1: answer-first summary line, composed from the same required/optional
  // flags that drive the option cards below -- no new engine logic.
  const requiredDue = [];
  const optionalDue = [];
  if (acwyRequiredToday) requiredDue.push('MenACWY');
  else if (acwyDueToday) optionalDue.push('MenACWY');
  if (bRequiredToday) requiredDue.push('MenB');
  else if (bDueToday) optionalDue.push('MenB');

  let summaryLine;
  if (requiredDue.length === 2) {
    summaryLine = pentavalent.eligible
      ? 'Due today: MenACWY and MenB, as two separate shots or one combined pentavalent shot.'
      : 'Due today: MenACWY and MenB.';
  } else if (requiredDue.length === 1) {
    summaryLine = `Due today: ${requiredDue[0]}.`;
    if (optionalDue.length === 1) {
      summaryLine += ` ${optionalDue[0]} is optional (shared clinical decision).`;
    }
  } else if (optionalDue.length === 2) {
    summaryLine = 'MenACWY and MenB are optional today (shared clinical decision).';
  } else if (optionalDue.length === 1) {
    summaryLine = `${optionalDue[0]} is optional today (shared clinical decision). No other MenACWY or MenB doses due today.`;
  } else {
    summaryLine = 'No MenACWY or MenB doses due today.';
  }
  if (hct) {
    summaryLine = 'Post-HCT advisory applies. See details below.';
  }

  // P1-4 (2026-09-15, owner decision): while any recorded dose is still waiting
  // on its risk-timing answer, this headline must not assert a recommendation.
  // The conservative maths (a pending dose does not count) is right; announcing
  // it as "Due today: MenACWY" is how a clinician ends up vaccinating an
  // already fully vaccinated child. The reported case read "Due today:
  // MenACWY" for a child with FIVE doses on record, with five unanswered
  // questions further down the page.
  //
  // This narrows an earlier decision (2026-07-23), which set how pending doses
  // are COUNTED. That maths is untouched — only the claim made above it.
  const pendingAnswers = [...menacwyHistory.perDose, ...menbHistory.perDose]
    .filter((d) => d?.status === 'pending').length;
  if (pendingAnswers > 0 && !hct) {
    summaryLine = pendingAnswers === 1
      ? 'One recorded dose needs an answer below before a recommendation can be made.'
      : `${pendingAnswers} recorded doses need an answer below before a recommendation can be made.`;
  }

  // Inline age editor — recommendations recompute live from state.ageMonths.
  const years = ageMonths != null ? Math.floor(ageMonths / 12) : '';
  const months = ageMonths != null ? Math.round(ageMonths % 12) : '';
  function setAge(y, m) {
    const yy = parseFloat(y);
    const mm = parseFloat(m) || 0;
    if (isNaN(yy) || yy < 0) return;
    const am = yy * 12 + mm;
    // Typing an age here OVERRIDES the date of birth, so the date of birth has
    // to go: leaving it would mean this edit was silently ignored, because
    // patientAgeMonths() lets the date of birth win.
    onChange?.({ ageMonths: am, ageGroup: ageGroup(am), dob: null });
  }

  // K1 (2026-09-24): rows the clinician added but never typed into are swept
  // when this panel CLOSES — while it is open they are rows waiting to be
  // filled in, and clearing them on sight would delete the row the user just
  // asked for. The engine ignores blank rows in the meantime (validate.js),
  // which is what stops the answer on screen moving the moment one appears.
  function closeDosePanelAndSweep() {
    setEditingDoses(false);
    const acwy = dropBlankDoseRows(menacwyDoses);
    const b = dropBlankDoseRows(menbDoses);
    if (acwy.length !== menacwyDoses.length || b.length !== menbDoses.length) {
      onChange?.({ menacwyDoses: acwy, menbDoses: b });
    }
  }

  // K7 (2026-09-26): Escape closes whichever of the two panels is open --
  // the dose panel first (it's the more specific, more nested edit surface),
  // otherwise the age panel. Depends on menacwyDoses/menbDoses (read inside
  // closeDosePanelAndSweep) so the listener never closes over a stale dose
  // list from before the clinician's most recent edit.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key !== 'Escape') return;
      if (editingDoses) {
        closeDosePanelAndSweep();
      } else if (editingAge) {
        setEditingAge(false);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [editingAge, editingDoses, menacwyDoses, menbDoses]);

  // K1: the count is of doses, not of rows — an empty row is not an injection.
  const recordedDoseCount =
    menacwyDoses.filter(d => !isBlankDoseRow(d)).length
    + menbDoses.filter(d => !isBlankDoseRow(d)).length;

  return (
    <div>
      {/* D1: answer-first verdict, before any detail. */}
      <div className="results-summary-line" data-testid="results-summary-line">
        {summaryLine}
      </div>

      {/* Summary header */}
      <div className="results-header">
        <div className="results-title">Vaccine Recommendation</div>
        <div className="results-meta">
          <div className="meta-chips">
            <span className="meta-chip meta-age">
              {fmtAgeMonths(ageMonths, ageDays)}
            </span>
            {group && <span className="meta-chip meta-group">{group}</span>}
            {riskLabels.length > 0
              ? riskLabels.map((l, i) => (
                  <span key={i} className="meta-chip meta-risk">{l}</span>
                ))
              : <span className="meta-chip meta-norisk">No risk factors</span>
            }
          </div>
          {/* impossible P1-2: sits directly under the risk chips it doubts,
              because it is a question about the ticks, not about the answer.
              Quiet by design: no banner, no icon, nothing withheld. */}
          <RiskAgeNote note={riskAgeNote} noteCites={riskAgeNoteCites} />
          <div className="meta-actions">
            {onChange && (
              <button
                type="button"
                className="age-edit-btn"
                onClick={() => { setEditingAge(v => !v); closeDosePanelAndSweep(); }}
                aria-expanded={editingAge}
              >
                Adjust age<Chevron open={editingAge} />
              </button>
            )}
            {onChange && (
              <button
                type="button"
                className="age-edit-btn"
                onClick={() => {
                  if (editingDoses) closeDosePanelAndSweep(); else setEditingDoses(true);
                  setEditingAge(false);
                }}
                aria-expanded={editingDoses}
              >
                {`Recorded doses${recordedDoseCount > 0 ? ` (${recordedDoseCount})` : ''}`}<Chevron open={editingDoses} />
              </button>
            )}
          </div>
        </div>
        {editingAge && (
          <div className="age-edit-row" data-testid="age-edit-row">
            <div className="age-field">
              <label htmlFor="results-years">Years</label>
              <input
                id="results-years" type="number" min="0" max="120"
                value={years}
                onChange={e => setAge(e.target.value, months)}
              />
            </div>
            <div className="age-field">
              <label htmlFor="results-months">Months</label>
              <input
                id="results-months" type="number" min="0" max="11"
                value={months}
                onChange={e => setAge(years, e.target.value)}
              />
            </div>
            <span className="age-edit-hint">Recommendations update as you change the age.</span>
          </div>
        )}
        {editingDoses && (
          <div className="age-edit-row dose-history-panel" data-testid="recorded-doses-panel">

            {/* MenACWY doses */}
            <div className="dose-history-block">
              <div className="history-edit-section-title">MenACWY doses</div>
              <PentavalentCreditNote vaccine="MenACWY" creditedDoses={creditedAcwy} />
              <DoseEditor
                vaccine="MenACWY"
                doses={menacwyDoses}
                creditedDoses={creditedAcwy}
                onChange={list => onChange?.({ menacwyDoses: list })}
                brandOptions={MENACWY_HISTORY_BRANDS}
                addDoseLabel="+ Add MenACWY dose"
                removeLabel={i => `Remove MenACWY dose ${i + 1}`}
                emptyMessage="No MenACWY doses recorded."
                rowClassName="dose-history-row"
                today={resolvedToday}
              />
            </div>

            {/* MenB doses */}
            <div className="dose-history-block">
              <div className="history-edit-section-title">MenB doses</div>
              <PentavalentCreditNote vaccine="MenB" creditedDoses={creditedB} />
              <DoseEditor
                vaccine="MenB"
                doses={menbDoses}
                creditedDoses={creditedB}
                onChange={list => onChange?.({ menbDoses: list })}
                brandOptions={MENB_HISTORY_BRANDS}
                addDoseLabel="+ Add MenB dose"
                removeLabel={i => `Remove MenB dose ${i + 1}`}
                emptyMessage="No MenB doses recorded."
                rowClassName="dose-history-row"
                today={resolvedToday}
              />
            </div>

            <span className="age-edit-hint">Changes update recommendations immediately.</span>
          </div>
        )}
      </div>

      {/* HCT advisory block — alert banner, prominent at top */}
      {hct && (
        <div className="advisory-banner advisory-banner-hct" data-testid="hct-card">
          <div className="advisory-banner-title">
            Advisory: {hct.title}
          </div>
          <div className="advisory-banner-flag">{hct.coordinateFlag}</div>
          {hct.lines.map((l, i) => (
            <div key={i}>
              {l.label && <div className="advisory-dose-line">{l.label}: {l.text}</div>}
              {!l.label && <div className="advisory-note">{l.text}</div>}
              {l.citations && l.citations.length > 0 && (
                <div className="rec-citations">
                  {l.citations.map((c, j) => (
                    <a key={j} href={c.url} target="_blank" rel="noopener noreferrer"
                      className="citation-chip" title={c.label}>{c.short || c.label}</a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* B2/B3: when a pentavalent is eligible, present the two ways to give MenACWY +
          MenB today as an explicit choice — separate injections (primary/default) first,
          the single pentavalent shot (alternative that REPLACES both) second.
          Parked UX item #2 (2026-07-23, owner-approved via before/after preview):
          the dose-options-header that used to sit here restated due/optional
          status the results-summary-line above and each RecCard's own status
          badge below already state -- 3-4x redundancy. Deleted; the "Option 1 /
          Option 2" labels below are enough to introduce the choice. */}

      {/* Option 1: two separate injections — grouped visually when both are due.
          D9: header bar sits INSIDE the box (matches Option 2's own header-bar
          treatment below) instead of as a label floating above it. */}
      <div className={acwyDueToday && bDueToday && pentavalent.eligible ? 'separate-vaccines-group' : undefined}>
        {pentavalent.eligible && (
          <div className="dose-option-label" data-testid="option-separate-label">
            Option 1: Two separate injections (MenACWY + MenB)
          </div>
        )}
        <div className={acwyDueToday && bDueToday && pentavalent.eligible ? 'separate-vaccines-group-body' : undefined}>
        {acwyDueToday && bDueToday && !pentavalent.eligible && (
          <div className="dual-due-banner" data-testid="dual-due-banner">
            These are two separate vaccines.{' '}
            {bRequiredToday
              ? 'Both are due today.'
              : 'MenACWY is due today; MenB is optional (shared clinical decision).'}{' '}
            Within each, choose one brand.
            {/* P1-4: say WHY the combined shot is missing when the 6-month
                Penbraya rule is what removed it, rather than dropping the
                option with no explanation. */}
            {pentavalent.unavailableReason && (
              <div data-testid="pentavalent-unavailable-reason">
                {pentavalent.unavailableReason}
              </div>
            )}
          </div>
        )}

        {/* MenACWY recs */}
        <div className="rec-section">
          {!pentavalent.eligible && <div className="rec-section-title">MenACWY</div>}
          {menacwy.map((r, i) => (
            <RecCard
              key={i}
              rec={r}
              doses={menacwyHistory.sortedDoses}
              doseValidations={menacwyHistory.perDose}
              ageMonths={ageMonths ?? 0}
              dob={dob ?? null}
              onRiskAtDoseAnswer={handleRiskAtDoseAnswer}
              riskAtDoseAnswers={acwyRiskAnswers}
              today={resolvedToday}
            />
          ))}
        </div>

        {/* MenB recs */}
        <div className="rec-section">
          {!pentavalent.eligible && <div className="rec-section-title">MenB</div>}
          {menb.map((r, i) => (
            <RecCard
              key={i}
              rec={r}
              doses={menbHistory.sortedDoses}
              doseValidations={menbHistory.perDose}
              ageMonths={ageMonths ?? 0}
              dob={dob ?? null}
              onRiskAtDoseAnswer={handleRiskAtDoseAnswer}
              riskAtDoseAnswers={bRiskAnswers}
              today={resolvedToday}
            />
          ))}
        </div>
        </div>
      </div>

      {/* Option 2: single pentavalent injection — replaces both shots above.
          D9: the "Option 2: ..." label is now the card's own header bar
          (matches Option 1's header-bar treatment above), and the "replaces
          both shots" caution moved into the body as its lead line. */}
      {pentavalent.eligible && (
        <>
          <div className="penta-card" data-testid="penta-card">
            <div className="penta-header" data-testid="option-penta-label">
              Option 2: One combined injection (pentavalent, MenABCWY)
            </div>
            <div className="penta-body">
              <div className="penta-replaces">Replaces both shots above: do not give both.</div>
              <RecNote note={pentavalent.note} className="penta-note" />
              <div className="penta-brands">
                {(pentavalent.brands || []).map((b, i) => (
                  <div key={i} className="penta-brand">
                    <span className="rec-brand-dot" />
                    {stripAntigen(b)}
                  </div>
                ))}
              </div>
              {pentavalent.citations && pentavalent.citations.length > 0 && (
                <div className="rec-citations">
                  {pentavalent.citations.map((c, i) => (
                    <a
                      key={i}
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="citation-chip"
                      title={c.label}
                    >
                      {c.short || c.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <Disclaimer />

      <div className="results-actions">
        {onBack && (
          <button className="btn btn-outline" onClick={onBack}>Edit history</button>
        )}
        <button className="btn btn-outline" onClick={onReset}>
          Start Over
        </button>
      </div>
    </div>
  );
}
