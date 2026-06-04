import React from 'react';
import { recommend } from '../logic/recommend.js';
import { fmtAgeMonths, ageGroup } from '../logic/format.js';
import { RISK_FACTORS } from '../data/riskFactors.js';
import RecCard from './RecCard.jsx';
import Disclaimer from './Disclaimer.jsx';

export default function Results({ state, onReset }) {
  const { ageMonths, riskIds, menacwyDoses, menbDoses } = state;

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
          {riskLabels.length > 0
            ? riskLabels.map((l, i) => (
                <span key={i} className="meta-chip meta-risk">{l}</span>
              ))
            : <span className="meta-chip meta-norisk">No risk factors</span>
          }
        </div>
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
                  {b}
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
                    {c.label.length > 55 ? c.label.slice(0, 54) + '…' : c.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Connective banner when both vaccines are due */}
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
        {menacwy.map((r, i) => <RecCard key={i} rec={r} />)}
      </div>

      {/* MenB recs */}
      <div className="rec-section">
        <div className="rec-section-title">MenB</div>
        {menb.map((r, i) => <RecCard key={i} rec={r} />)}
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
