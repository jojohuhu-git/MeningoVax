import React, { useState, useEffect } from 'react';
import { recommend } from '../logic/recommend.js';
import { analyzeHistory } from '../logic/validate.js';
import { fmtAgeMonths, ageGroup, stripAntigen } from '../logic/format.js';
import { RISK_FACTORS } from '../data/riskFactors.js';
import { MENACWY_BRANDS, MENB_BRANDS, PENTAVALENT_BRANDS } from '../data/brands.js';
import RecCard from './RecCard.jsx';
import Disclaimer from './Disclaimer.jsx';
import DoseEditor from './DoseEditor.jsx';
import { Chevron } from './icons.jsx';

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

export default function Results({ state, onReset, onChange, onBack }) {
  const { ageMonths, riskIds, menacwyDoses, menbDoses } = state;
  const [editingAge, setEditingAge] = useState(false);
  const [editingDoses, setEditingDoses] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [activeDoseSection, setActiveDoseSection] = useState('acwy');

  const result = recommend({
    ageMonths: ageMonths ?? 0,
    riskIds,
    menacwyDoses,
    menbDoses,
  });

  const { menacwy, menb, pentavalent } = result;
  // Item 3 (2026-07-23): RecCard zips `doses[i]` against `doseValidations[i]`
  // by array index. analyzeHistory() sorts its perDose chronologically, so
  // the doses prop must come from the same sorted call, not raw entry order
  // (menacwyDoses/menbDoses), or the two arrays drift out of alignment.
  const menacwyHistory = analyzeHistory('MenACWY', menacwyDoses, ageMonths ?? 0, riskIds);
  const menbHistory = analyzeHistory('MenB', menbDoses, ageMonths ?? 0, riskIds);
  const group = ageGroup(ageMonths);
  const riskLabels = riskIds.map(id => RISK_FACTORS.find(r => r.id === id)?.label).filter(Boolean);

  const acwyDueToday = menacwy.some(r => r.dueToday);
  const bDueToday = menb.some(r => r.dueToday);

  // D1: answer-first summary line, composed from the same dueToday/pentavalent
  // flags that already drive the option cards below -- no new logic.
  let summaryLine;
  if (acwyDueToday && bDueToday) {
    summaryLine = pentavalent.eligible
      ? 'Due today: MenACWY and MenB, as two separate shots or one combined pentavalent shot.'
      : 'Due today: MenACWY and MenB.';
  } else if (acwyDueToday) {
    summaryLine = 'Due today: MenACWY.';
  } else if (bDueToday) {
    summaryLine = 'Due today: MenB.';
  } else {
    summaryLine = 'No MenACWY or MenB doses due today.';
  }

  // Inline age editor — recommendations recompute live from state.ageMonths.
  const years = ageMonths != null ? Math.floor(ageMonths / 12) : '';
  const months = ageMonths != null ? Math.round(ageMonths % 12) : '';
  function setAge(y, m) {
    const yy = parseFloat(y);
    const mm = parseFloat(m) || 0;
    if (isNaN(yy) || yy < 0) return;
    const am = yy * 12 + mm;
    onChange?.({ ageMonths: am, ageGroup: ageGroup(am) });
  }

  // ── Recorded-dose editors (live re-render via onChange) ──
  function addAcwy() { onChange?.({ menacwyDoses: [...menacwyDoses, { date: '', brand: '' }] }); }
  function addB() { onChange?.({ menbDoses: [...menbDoses, { date: '', brand: '' }] }); }

  // D6b: Ctrl+A (Cmd+A on Mac) adds a dose row in the Recorded-doses editor,
  // matching StepHistory's shortcut. Two dose lists share the panel, so the
  // shortcut targets whichever section (MenACWY or MenB) the user last
  // interacted with (activeDoseSection, tracked via onFocusCapture below --
  // document.activeElement isn't reliable here since focus can be lost when
  // a row is added and the list re-renders).
  useEffect(() => {
    if (!editingDoses) return;
    function handleKeydown(e) {
      const isAddDoseShortcut = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a';
      if (!isAddDoseShortcut) return;
      e.preventDefault();
      if (activeDoseSection === 'menb') addB(); else addAcwy();
    }
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingDoses, activeDoseSection, menacwyDoses, menbDoses]);

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
              {fmtAgeMonths(ageMonths)}
            </span>
            {group && <span className="meta-chip meta-group">{group}</span>}
            {riskLabels.length > 0
              ? riskLabels.map((l, i) => (
                  <span key={i} className="meta-chip meta-risk">{l}</span>
                ))
              : <span className="meta-chip meta-norisk">No risk factors</span>
            }
          </div>
          <div className="meta-actions">
            {onChange && (
              <button
                type="button"
                className="age-edit-btn"
                onClick={() => { setEditingAge(v => !v); setEditingDoses(false); setShowLegend(false); }}
                aria-expanded={editingAge}
              >
                Adjust age<Chevron open={editingAge} />
              </button>
            )}
            {onChange && (
              <button
                type="button"
                className="age-edit-btn"
                onClick={() => { setEditingDoses(v => !v); setEditingAge(false); setShowLegend(false); setActiveDoseSection('acwy'); }}
                aria-expanded={editingDoses}
              >
                {`Recorded doses${(menacwyDoses.length + menbDoses.length) > 0 ? ` (${menacwyDoses.length + menbDoses.length})` : ''}`}<Chevron open={editingDoses} />
              </button>
            )}
            <button
              type="button"
              className="age-edit-btn"
              onClick={() => { setShowLegend(v => !v); setEditingAge(false); setEditingDoses(false); }}
              aria-expanded={showLegend}
            >
              Color key<Chevron open={showLegend} />
            </button>
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
              <DoseEditor
                vaccine="MenACWY"
                doses={menacwyDoses}
                onChange={list => onChange?.({ menacwyDoses: list })}
                brandOptions={MENACWY_HISTORY_BRANDS}
                addDoseLabel="+ Add MenACWY dose"
                removeLabel={i => `Remove MenACWY dose ${i + 1}`}
                emptyMessage="No MenACWY doses recorded."
                rowClassName="dose-history-row"
                onFocusCapture={() => setActiveDoseSection('acwy')}
              />
            </div>

            {/* MenB doses */}
            <div className="dose-history-block">
              <div className="history-edit-section-title">MenB doses</div>
              <DoseEditor
                vaccine="MenB"
                doses={menbDoses}
                onChange={list => onChange?.({ menbDoses: list })}
                brandOptions={MENB_HISTORY_BRANDS}
                addDoseLabel="+ Add MenB dose"
                removeLabel={i => `Remove MenB dose ${i + 1}`}
                emptyMessage="No MenB doses recorded."
                rowClassName="dose-history-row"
                onFocusCapture={() => setActiveDoseSection('menb')}
              />
            </div>

            <span className="age-edit-hint">Changes update recommendations immediately.</span>
          </div>
        )}
        {/* E6/D6: what the colors used throughout this page mean (colors only;
            keyboard-shortcut hints live at the controls they act on, see D6b). */}
        {showLegend && (
          <div className="age-edit-row legend-panel dose-history-panel" data-testid="legend-panel">
            <div className="dose-history-block">
              <div className="history-edit-section-title">Vaccine box colors</div>
              <div className="legend-row"><span className="legend-swatch legend-swatch-due" /><span>Due today: on schedule, expected now</span></div>
              <div className="legend-row"><span className="legend-swatch legend-swatch-catchup" /><span>Catch-up: behind the routine schedule, needed now to catch up</span></div>
              <div className="legend-row"><span className="legend-swatch legend-swatch-shared" /><span>Shared decision: optional, patient and provider decide together</span></div>
              <div className="legend-row"><span className="legend-swatch legend-swatch-neutral" /><span>Not currently due (complete, not indicated, or deferred)</span></div>
            </div>
            <div className="dose-history-block">
              <div className="history-edit-section-title">Recorded-dose validity colors</div>
              <div className="legend-row"><span className="legend-swatch legend-swatch-valid" /><span>On time</span></div>
              <div className="legend-row"><span className="legend-swatch legend-swatch-offwindow" /><span>Valid (off-window): counted, but outside the routine timing</span></div>
              <div className="legend-row"><span className="legend-swatch legend-swatch-invalid" /><span>Invalid (does not count)</span></div>
              <div className="legend-row"><span className="legend-swatch legend-swatch-unknown" /><span>Unknown (no date recorded)</span></div>
            </div>
          </div>
        )}
      </div>

      {/* B2/B3: when a pentavalent is eligible, present the two ways to give MenACWY +
          MenB today as an explicit choice — separate injections (primary/default) first,
          the single pentavalent shot (alternative that REPLACES both) second. */}
      {pentavalent.eligible && (
        <div className="dose-options-header" data-testid="dose-options-header">
          Both MenACWY and MenB are due today: two ways to give them:
        </div>
      )}

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
            These are two separate vaccines. Both are due today. Within each, choose one brand.
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
              <div className="penta-note">{pentavalent.note}</div>
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
