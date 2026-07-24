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

  // Ctrl/Cmd+Y answers "Yes, record doses"; Alt/Cmd+N answers "No previous
  // doses" -- lets the whole history question be answered from the keyboard
  // without reaching for the mouse.
  useEffect(() => {
    function handleKeydown(e) {
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === 'y') {
        e.preventDefault();
        handleYes();
      } else if ((e.altKey || e.metaKey) && key === 'n') {
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
          <span className="shortcut-hint history-toggle-hint">Alt/Cmd+N</span>
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
          addAccessKey="a"
          addDoseLabel={
            // E7: one child span, not three sibling nodes — the button is
            // display:flex with a gap, which was inserting extra space
            // between every child, including the anonymous text nodes
            // around <u>, visually splitting "Add" into "A" + gap + "dd".
            <span>+ <u>A</u>dd dose</span>
          }
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
