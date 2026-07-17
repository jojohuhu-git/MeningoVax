import React, { useState } from 'react';
import { recommend } from '../logic/recommend.js';
import { analyzeHistory } from '../logic/validate.js';
import { fmtAgeMonths, ageGroup, stripAntigen } from '../logic/format.js';
import { RISK_FACTORS } from '../data/riskFactors.js';
import { MENACWY_BRANDS, MENB_BRANDS, PENTAVALENT_BRANDS } from '../data/brands.js';
import RecCard from './RecCard.jsx';
import Disclaimer from './Disclaimer.jsx';

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

  const result = recommend({
    ageMonths: ageMonths ?? 0,
    riskIds,
    menacwyDoses,
    menbDoses,
  });

  const { menacwy, menb, pentavalent } = result;
  const group = ageGroup(ageMonths);
  const riskLabels = riskIds.map(id => RISK_FACTORS.find(r => r.id === id)?.label).filter(Boolean);

  const acwyDueToday = menacwy.some(r => r.dueToday);
  const bDueToday = menb.some(r => r.dueToday);

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
  function removeAcwy(i) { onChange?.({ menacwyDoses: menacwyDoses.filter((_, idx) => idx !== i) }); }
  function updateAcwy(i, field, val) {
    onChange?.({ menacwyDoses: menacwyDoses.map((d, idx) => idx === i ? { ...d, [field]: val } : d) });
  }
  function addB() { onChange?.({ menbDoses: [...menbDoses, { date: '', brand: '' }] }); }
  function removeB(i) { onChange?.({ menbDoses: menbDoses.filter((_, idx) => idx !== i) }); }
  function updateB(i, field, val) {
    onChange?.({ menbDoses: menbDoses.map((d, idx) => idx === i ? { ...d, [field]: val } : d) });
  }
  function brandSelect(brandOptions, dose, onSet) {
    return (
      <select value={dose.brand || ''} onChange={e => onSet(e.target.value)}>
        <option value="">Unknown brand</option>
        {brandOptions
          .filter(b => b.key !== undefined && b.key !== '')
          .map(b => <option key={b.key} value={b.key}>{b.label}</option>)}
      </select>
    );
  }

  return (
    <div>
      {/* Summary header */}
      <div className="results-header">
        <div className="results-title">Vaccine Recommendation</div>
        <div className="results-meta">
          <span className="meta-chip meta-age">
            {fmtAgeMonths(ageMonths)}
          </span>
          {group && <span className="meta-chip meta-group">{group}</span>}
          {onChange && (
            <button
              type="button"
              className="age-edit-btn"
              onClick={() => { setEditingAge(v => !v); setEditingDoses(false); setShowLegend(false); }}
              aria-expanded={editingAge}
            >
              {editingAge ? 'Done' : 'Adjust age ▾'}
            </button>
          )}
          {onChange && (
            <button
              type="button"
              className="age-edit-btn"
              onClick={() => { setEditingDoses(v => !v); setEditingAge(false); setShowLegend(false); }}
              aria-expanded={editingDoses}
            >
              {editingDoses ? 'Done'
                : `Recorded doses${(menacwyDoses.length + menbDoses.length) > 0 ? ` (${menacwyDoses.length + menbDoses.length})` : ''} ▾`}
            </button>
          )}
          <button
            type="button"
            className="age-edit-btn"
            onClick={() => { setShowLegend(v => !v); setEditingAge(false); setEditingDoses(false); }}
            aria-expanded={showLegend}
          >
            {showLegend ? 'Done' : 'Legend & shortcuts ▾'}
          </button>
          {riskLabels.length > 0
            ? riskLabels.map((l, i) => (
                <span key={i} className="meta-chip meta-risk">{l}</span>
              ))
            : <span className="meta-chip meta-norisk">No risk factors</span>
          }
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
          <div className="age-edit-row" data-testid="recorded-doses-panel"
            style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>

            {/* MenACWY doses */}
            <div style={{ width: '100%' }}>
              <div className="history-edit-section-title">MenACWY doses</div>
              {menacwyDoses.length === 0 && (
                <div style={{ fontSize: '0.82rem', color: 'var(--gy4)', marginBottom: 4 }}>
                  No MenACWY doses recorded.
                </div>
              )}
              {menacwyDoses.map((dose, i) => (
                <div key={i} className="dose-row" style={{ marginBottom: 4 }}>
                  <div className="dose-field">
                    <label>Date (optional)</label>
                    <input type="date" value={dose.date || ''}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={e => updateAcwy(i, 'date', e.target.value)} />
                  </div>
                  <div className="dose-field">
                    <label>Brand (optional)</label>
                    {brandSelect(MENACWY_HISTORY_BRANDS, dose, v => updateAcwy(i, 'brand', v))}
                  </div>
                  <button className="dose-remove" onClick={() => removeAcwy(i)}
                    aria-label={`Remove MenACWY dose ${i + 1}`}>×</button>
                </div>
              ))}
              <button className="add-dose-btn" onClick={addAcwy}>+ Add MenACWY dose</button>
            </div>

            {/* MenB doses */}
            <div style={{ width: '100%' }}>
              <div className="history-edit-section-title">MenB doses</div>
              {menbDoses.length === 0 && (
                <div style={{ fontSize: '0.82rem', color: 'var(--gy4)', marginBottom: 4 }}>
                  No MenB doses recorded.
                </div>
              )}
              {menbDoses.map((dose, i) => (
                <div key={i} className="dose-row" style={{ marginBottom: 4 }}>
                  <div className="dose-field">
                    <label>Date (optional)</label>
                    <input type="date" value={dose.date || ''}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={e => updateB(i, 'date', e.target.value)} />
                  </div>
                  <div className="dose-field">
                    <label>Brand (optional)</label>
                    {brandSelect(MENB_HISTORY_BRANDS, dose, v => updateB(i, 'brand', v))}
                  </div>
                  <button className="dose-remove" onClick={() => removeB(i)}
                    aria-label={`Remove MenB dose ${i + 1}`}>×</button>
                </div>
              ))}
              <button className="add-dose-btn" onClick={addB}>+ Add MenB dose</button>
            </div>

            <span className="age-edit-hint">Changes update recommendations immediately.</span>
          </div>
        )}
        {/* E6: what the colors and keyboard shortcuts used throughout this page mean. */}
        {showLegend && (
          <div className="age-edit-row legend-panel" data-testid="legend-panel"
            style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: '100%' }}>
              <div className="history-edit-section-title">Vaccine box colors</div>
              <div className="legend-row"><span className="legend-swatch legend-swatch-due" /><span>Due today</span></div>
              <div className="legend-row"><span className="legend-swatch legend-swatch-catchup" /><span>Catch-up</span></div>
              <div className="legend-row"><span className="legend-swatch legend-swatch-shared" /><span>Shared decision (optional)</span></div>
              <div className="legend-row"><span className="legend-swatch legend-swatch-neutral" /><span>Not currently due (complete, not indicated, or deferred)</span></div>
            </div>
            <div style={{ width: '100%' }}>
              <div className="history-edit-section-title">Recorded-dose validity colors</div>
              <div className="legend-row"><span className="legend-swatch legend-swatch-valid" /><span>On time</span></div>
              <div className="legend-row"><span className="legend-swatch legend-swatch-offwindow" /><span>Valid — off-window (counted, but outside the routine timing)</span></div>
              <div className="legend-row"><span className="legend-swatch legend-swatch-invalid" /><span>Invalid (does not count)</span></div>
              <div className="legend-row"><span className="legend-swatch legend-swatch-unknown" /><span>Unknown (no date recorded)</span></div>
            </div>
            <div style={{ width: '100%' }}>
              <div className="history-edit-section-title">Keyboard shortcuts</div>
              <div className="legend-row"><kbd>Ctrl/Cmd + A</kbd><span>Add a dose row</span></div>
              <div className="legend-row"><kbd>Enter</kbd><span>Advance to the next step</span></div>
            </div>
          </div>
        )}
      </div>

      {/* B2/B3: when a pentavalent is eligible, present the two ways to give MenACWY +
          MenB today as an explicit choice — separate injections (primary/default) first,
          the single pentavalent shot (alternative that REPLACES both) second. */}
      {pentavalent.eligible && (
        <div className="dose-options-header" data-testid="dose-options-header">
          Both MenACWY and MenB are due today — two ways to give them:
        </div>
      )}

      {/* Option 1: two separate injections — grouped visually when both are due */}
      <div className={acwyDueToday && bDueToday && pentavalent.eligible ? 'separate-vaccines-group' : undefined}>
        {pentavalent.eligible && (
          <div className="dose-option-label" data-testid="option-separate-label">
            Option 1: Two separate injections (MenACWY + MenB)
          </div>
        )}
        {acwyDueToday && bDueToday && !pentavalent.eligible && (
          <div className="dual-due-banner" data-testid="dual-due-banner">
            These are two separate vaccines — both are due today. Within each, choose one brand.
          </div>
        )}

        {/* MenACWY recs */}
        <div className="rec-section">
          {!pentavalent.eligible && <div className="rec-section-title">MenACWY</div>}
          {menacwy.map((r, i) => (
            <RecCard
              key={i}
              rec={r}
              doses={menacwyDoses}
              doseValidations={analyzeHistory('MenACWY', menacwyDoses, ageMonths ?? 0, riskIds).perDose}
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
              doses={menbDoses}
              doseValidations={analyzeHistory('MenB', menbDoses, ageMonths ?? 0, riskIds).perDose}
            />
          ))}
        </div>
      </div>

      {/* Option 2: single pentavalent injection — replaces both shots above.
          E4: one consolidated title (previously repeated "pentavalent (MenABCWY)"
          in both the option label and the card header). D2: label moved outside
          .penta-card — the card has overflow:hidden with no padding of its own,
          so a label rendered inside it clipped against the rounded corner. */}
      {pentavalent.eligible && (
        <>
          <div className="dose-option-label" data-testid="option-penta-label">
            Option 2: One combined injection (pentavalent, MenABCWY)
          </div>
          <div className="penta-card" data-testid="penta-card">
            <div className="penta-header">
              <span>Replaces both shots above — do not give both</span>
            </div>
            <div className="penta-body">
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
          <button className="btn btn-outline" onClick={onBack}>← Edit history</button>
        )}
        <button className="btn btn-outline" onClick={onReset}>
          Start Over
        </button>
      </div>
    </div>
  );
}
