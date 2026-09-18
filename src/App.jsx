import React, { useState, useEffect } from 'react';
import Stepper from './components/Stepper.jsx';
import StepAge from './components/StepAge.jsx';
import StepRisks from './components/StepRisks.jsx';
import StepHistory from './components/StepHistory.jsx';
import Results from './components/Results.jsx';
import { MENACWY_BRANDS, MENB_BRANDS, PENTAVALENT_BRANDS } from './data/brands.js';
import { hasExclusion } from './data/riskFactors.js';
import { creditPentavalents } from './logic/pentavalentCredit.js';
import { todayISO } from './logic/dateUtils.js';

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
  // Calendar P1-3 (2026-09-17): the date of birth is kept, not converted to a
  // number of months and thrown away. ageMonths is still stored -- it is the
  // only thing a years/months patient has -- but where there is a dob it is a
  // snapshot, and patientAgeMonths() treats it as one.
  dob: null,
  riskIds: [],
  menacwyDoses: [],
  menbDoses: [],
  // Provider answers to the risk-at-dose "Needs input" prompt (2026-07-23
  // handoff §2-§3), keyed by vaccine then by the dose's post-sort index.
  // Memory-only by design — this app has no URL/link serialization at all,
  // so nothing extra is needed to keep a clinical judgment out of a shared link.
  riskAtDoseAnswers: { MenACWY: {}, MenB: {} },
};

export default function App() {
  const [state, setState] = useState(INITIAL_STATE);
  const [ageError, setAgeError] = useState('');
  // calendar P2-1: "now" is read from the clock exactly once per render, here,
  // and handed down as a prop — StepAge, StepHistory/DoseEditor and Results
  // (which hands it to recommend() and to RecCard/DoseEditor) all get the same
  // value instead of each reading todayISO() for itself. Previously the picker
  // max, the age derivation, the record-panel editors and the engine were four
  // independent clock reads that happened to agree because they ran within the
  // same millisecond, not because anything made them agree.
  const today = todayISO();

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
    // The hard-stop exclusion (CAR-T/B-cell) needs no vaccination history to
    // show its stop message, so skip both history steps straight to Results.
    if (state.step === 1 && hasExclusion(state.riskIds)) {
      setState(prev => ({ ...prev, step: 4 }));
      return;
    }
    setState(prev => ({ ...prev, step: Math.min(prev.step + 1, STEPS.length - 1) }));
  }

  function goBack() {
    if (state.step === 4 && hasExclusion(state.riskIds)) {
      setState(prev => ({ ...prev, step: 1 }));
      return;
    }
    setState(prev => ({ ...prev, step: Math.max(prev.step - 1, 0) }));
  }

  function reset() {
    setState(INITIAL_STATE);
    setAgeError('');
  }

  // B7: Enter advances to the next step, without submitting a partial form or
  // triggering a destructive action. Guarded against firing while focus is in
  // a free-text field where the user may still be typing (this app has no
  // free-text inputs today — only date/select/checkbox/button — but the guard
  // future-proofs against one being added).
  useEffect(() => {
    if (state.step >= 4) return; // no Next button on Results
    function handleKeydown(e) {
      if (e.key !== 'Enter') return;
      const tag = document.activeElement?.tagName;
      const type = document.activeElement?.type;
      if (tag === 'TEXTAREA' || (tag === 'INPUT' && type === 'text')) return;
      e.preventDefault();
      goNext();
    }
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step, state.ageMonths]);

  // G1 (2026-09-16): a pentavalent typed on one history step already counts on
  // the other. Each step is told which doses it is being credited, so it can say
  // so instead of letting the clinician record the same injection twice.
  const merged = creditPentavalents(state.menacwyDoses, state.menbDoses);
  const credited = {
    menacwy: merged.menacwy.filter((d) => d.creditedFrom),
    menb: merged.menb.filter((d) => d.creditedFrom),
  };

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
            today={today}
            onChange={({ ageMonths, ageGroup, dob }) => {
              update({ ageMonths, ageGroup, dob: dob ?? null });
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
            creditedDoses={credited.menacwy}
            today={today}
          />
        )}
        {state.step === 3 && (
          <StepHistory
            vaccine="MenB"
            doses={state.menbDoses}
            onChange={menbDoses => update({ menbDoses })}
            brandOptions={MENB_HISTORY_BRANDS}
            creditedDoses={credited.menb}
            today={today}
          />
        )}
        {state.step === 4 && (
          <Results state={state} onReset={reset} onChange={update}
            onBack={goBack} today={today} />
        )}
      </main>

      {state.step < 4 && (
        <div className="app-nav">
          <div className="app-nav-inner">
            {state.step > 0 ? (
              <button className="btn btn-back" onClick={goBack}>Back</button>
            ) : (
              <span />
            )}
            <span className="app-nav-next">
              <button className="btn btn-next" onClick={goNext}>
                {state.step === 3 ? 'View Results' : 'Next'}
              </button>
              <span className="shortcut-hint">or press Enter</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
