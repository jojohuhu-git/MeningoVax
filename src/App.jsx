import React, { useState } from 'react';
import Stepper from './components/Stepper.jsx';
import StepAge from './components/StepAge.jsx';
import StepRisks from './components/StepRisks.jsx';
import StepHistory from './components/StepHistory.jsx';
import Results from './components/Results.jsx';
import { MENACWY_BRANDS, MENB_BRANDS, PENTAVALENT_BRANDS } from './data/brands.js';

const STEPS = ['Age', 'Risks', 'MenACWY', 'MenB', 'Results'];

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

const INITIAL_STATE = {
  step: 0,
  ageMonths: null,
  ageGroup: null,
  riskIds: [],
  menacwyDoses: [],
  menbDoses: [],
};

export default function App() {
  const [state, setState] = useState(INITIAL_STATE);
  const [ageError, setAgeError] = useState('');

  function update(patch) {
    setState(prev => ({ ...prev, ...patch }));
  }

  function goNext() {
    if (state.step === 0) {
      if (state.ageMonths == null || state.ageMonths < 0) {
        setAgeError('Please enter a valid age before continuing.');
        return;
      }
      setAgeError('');
    }
    setState(prev => ({ ...prev, step: Math.min(prev.step + 1, STEPS.length - 1) }));
  }

  function goBack() {
    setState(prev => ({ ...prev, step: Math.max(prev.step - 1, 0) }));
  }

  function reset() {
    setState(INITIAL_STATE);
    setAgeError('');
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-logo">
            <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="MeningoVax" className="app-logo-icon" />
            <div>
              <div className="app-logo-title">MeningoVax</div>
              <div className="app-logo-sub">Meningococcal Vaccine Advisor</div>
            </div>
          </div>
          <Stepper steps={STEPS} current={state.step} />
        </div>
      </header>

      <main className="app-main">
        {state.step === 0 && (
          <StepAge
            ageMonths={state.ageMonths}
            ageGroup={state.ageGroup}
            error={ageError}
            onChange={({ ageMonths, ageGroup }) => {
              update({ ageMonths, ageGroup });
              if (ageMonths != null) setAgeError('');
            }}
          />
        )}
        {state.step === 1 && (
          <StepRisks
            riskIds={state.riskIds}
            onChange={riskIds => update({ riskIds })}
          />
        )}
        {state.step === 2 && (
          <StepHistory
            vaccine="MenACWY"
            doses={state.menacwyDoses}
            onChange={menacwyDoses => update({ menacwyDoses })}
            brandOptions={MENACWY_HISTORY_BRANDS}
          />
        )}
        {state.step === 3 && (
          <StepHistory
            vaccine="MenB"
            doses={state.menbDoses}
            onChange={menbDoses => update({ menbDoses })}
            brandOptions={MENB_HISTORY_BRANDS}
          />
        )}
        {state.step === 4 && (
          <Results state={state} onReset={reset} onChange={update} />
        )}
      </main>

      {state.step < 4 && (
        <div className="app-nav">
          <div className="app-nav-inner">
            {state.step > 0 ? (
              <button className="btn btn-back" onClick={goBack}>← Back</button>
            ) : (
              <span />
            )}
            <button className="btn btn-next" onClick={goNext}>
              {state.step === 3 ? 'View Results →' : 'Next →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
