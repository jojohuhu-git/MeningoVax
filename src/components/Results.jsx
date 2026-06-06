import React, { useState } from 'react';
import { recommend } from '../logic/recommend.js';
import { analyzeHistory } from '../logic/validate.js';
import { fmtAgeMonths, ageGroup, stripAntigen } from '../logic/format.js';
import { RISK_FACTORS } from '../data/riskFactors.js';
import RecCard from './RecCard.jsx';
import Disclaimer from './Disclaimer.jsx';

export default function Results({ state, onReset, onChange }) {
  const { ageMonths, riskIds, menacwyDoses, menbDoses } = state;
  const [editingAge, setEditingAge] = useState(false);

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
              onClick={() => setEditingAge(v => !v)}
              aria-expanded={editingAge}
            >
              {editingAge ? 'Done' : 'Adjust age ▾'}
            </button>
          )}
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
      </div>

      {/* Pentavalent option — show prominently when both antigens due */}
      {pentavalent.eligible && (
        <div className="penta-card" data-testid="penta-card">
          <div className="penta-header">
            <span>Pentavalent Option (MenABCWY)</span>
            <span style={{ fontWeight: 400, fontSize: '0.8rem' }}>One injection instead of two</span>
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
      )}

      {/* Two separate vaccines — grouped visually when both are due */}
      <div className={acwyDueToday && bDueToday && pentavalent.eligible ? 'separate-vaccines-group' : undefined}>
        {acwyDueToday && bDueToday && (
          <div className="dual-due-banner" data-testid="dual-due-banner">
            These are two separate vaccines — both are due today. Within each, choose one brand.
            {pentavalent.eligible && (
              <span> (Or give the single pentavalent above instead of both.)</span>
            )}
          </div>
        )}

        {/* MenACWY recs */}
        <div className="rec-section">
          <div className="rec-section-title">MenACWY</div>
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
          <div className="rec-section-title">MenB</div>
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

      <Disclaimer />

      <div className="results-actions">
        <button className="btn btn-outline" onClick={onReset}>
          Start Over
        </button>
      </div>
    </div>
  );
}
