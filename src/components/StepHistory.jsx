import React, { useState, useEffect } from 'react';
import DoseEditor from './DoseEditor.jsx';

export default function StepHistory({ vaccine, doses, onChange, brandOptions }) {
  const [hasHistory, setHasHistory] = useState(doses.length > 0 ? true : null);

  // B7: Ctrl+A (Cmd+A on Mac) adds a dose row, overriding the browser's
  // default "select all" while this step is recording history.
  useEffect(() => {
    if (hasHistory !== true) return;
    function handleKeydown(e) {
      const isAddDoseShortcut = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a';
      if (isAddDoseShortcut) {
        e.preventDefault();
        onChange([...doses, { date: '', brand: '' }]);
      }
    }
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [hasHistory, doses, onChange]);

  // Ctrl/Cmd+Y answers "Yes, record doses"; Ctrl/Cmd+E answers "No previous
  // doses" ("E" for Empty) -- lets the whole history question be answered
  // from the keyboard without reaching for the mouse. Not Ctrl/Cmd+N: the
  // browser claims Cmd+N (Mac) / Ctrl+N (Win) for "new window" before the
  // page ever sees the keydown, so it can't be caught here.
  useEffect(() => {
    function handleKeydown(e) {
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === 'y') {
        e.preventDefault();
        handleYes();
      } else if ((e.ctrlKey || e.metaKey) && key === 'e') {
        e.preventDefault();
        handleNo();
      }
    }
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      <div className="history-toggle">
        <button
          className={`history-toggle-btn${hasHistory === false ? ' selected' : ''}`}
          onClick={handleNo}
        >
          No previous doses
          <span className="shortcut-hint history-toggle-hint">Ctrl/Cmd+E</span>
        </button>
        <button
          className={`history-toggle-btn${hasHistory === true ? ' selected' : ''}`}
          onClick={handleYes}
        >
          Yes, record doses
          <span className="shortcut-hint history-toggle-hint">Ctrl/Cmd+Y</span>
        </button>
      </div>

      {hasHistory === true && (
        <DoseEditor
          vaccine={vaccine}
          doses={doses}
          onChange={onChange}
          brandOptions={brandOptions}
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
