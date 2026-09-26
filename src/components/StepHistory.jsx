import React, { useState } from 'react';
import DoseEditor, { PentavalentCreditNote } from './DoseEditor.jsx';

export default function StepHistory({ vaccine, doses, onChange, brandOptions, creditedDoses = [], today }) {
  const [hasHistory, setHasHistory] = useState(doses.length > 0 ? true : null);

  function handleYes() {
    setHasHistory(true);
  }

  function handleNo() {
    setHasHistory(false);
    onChange([]);
  }

  return (
    <div className="step-card">
      <div className="step-title">
        {vaccine === 'MenACWY' ? 'MenACWY History' : 'MenB History'}
      </div>
      <div className="step-sub">
        Has the patient received any {vaccine} vaccine?
      </div>

      <PentavalentCreditNote vaccine={vaccine} creditedDoses={creditedDoses} />

      <div className="history-toggle">
        <button
          type="button"
          className={`history-toggle-btn${hasHistory === false ? ' selected' : ''}`}
          onClick={handleNo}
        >
          No previous doses
        </button>
        <button
          type="button"
          className={`history-toggle-btn${hasHistory === true ? ' selected' : ''}`}
          onClick={handleYes}
        >
          Yes, record doses
        </button>
      </div>

      {hasHistory === true && (
        <DoseEditor
          vaccine={vaccine}
          doses={doses}
          onChange={onChange}
          brandOptions={brandOptions}
          creditedDoses={creditedDoses}
          today={today}
        />
      )}

      {hasHistory === null && (
        <div style={{ color: 'var(--gy4)', fontSize: '0.9rem', fontStyle: 'italic', marginTop: 4 }}>
          Select yes or no above
        </div>
      )}
    </div>
  );
}
