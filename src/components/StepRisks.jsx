import React from 'react';
import { RISK_FACTORS } from '../data/riskFactors.js';

export default function StepRisks({ riskIds, onChange }) {
  const noneSelected = riskIds.length === 0;

  function toggle(id) {
    if (riskIds.includes(id)) {
      onChange(riskIds.filter(r => r !== id));
    } else {
      onChange([...riskIds, id]);
    }
  }

  function clearAll() {
    onChange([]);
  }

  return (
    <div className="step-card">
      <div className="step-title">Risk Factors</div>
      <div className="step-sub">
        Select all that apply: these drive vaccine class and booster schedule
      </div>

      <div className="risk-list" role="group" aria-label="Risk factors">
        {RISK_FACTORS.map(rf => {
          const selected = riskIds.includes(rf.id);
          return (
            <label
              key={rf.id}
              className={`risk-item${selected ? ' selected' : ''}`}
            >
              <input
                type="checkbox"
                className="risk-checkbox"
                checked={selected}
                onChange={() => toggle(rf.id)}
              />
              <div className="risk-text">
                <div className="risk-label">{rf.label}</div>
                {rf.sublabel && (
                  <div className="risk-sublabel">{rf.sublabel}</div>
                )}
              </div>
            </label>
          );
        })}
      </div>

      <button
        type="button"
        className={`risk-none${noneSelected ? ' selected' : ''}`}
        onClick={clearAll}
        aria-pressed={noneSelected}
      >
        <span className="risk-none-check" aria-hidden="true" />
        <span>None of these risk factors apply</span>
      </button>
    </div>
  );
}
