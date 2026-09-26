import React, { useState, useEffect, useRef } from 'react';
import Stepper from './components/Stepper.jsx';
import StepAge from './components/StepAge.jsx';
import StepRisks from './components/StepRisks.jsx';
import StepHistory from './components/StepHistory.jsx';
import Results from './components/Results.jsx';
import { MENACWY_BRANDS, MENB_BRANDS, PENTAVALENT_BRANDS } from './data/brands.js';
import { hasExclusion } from './data/riskFactors.js';
import { creditPentavalents } from './logic/pentavalentCredit.js';
import { todayISO } from './logic/dateUtils.js';
import { dropBlankDoseRows } from './logic/doseIdentity.js';

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
  const mainRef = useRef(null);

  // K4 (2026-09-26): after Next/Back, nothing was focused, so a keyboard user
  // had to press Tab once before they could type -- that one stray keystroke
  // is what makes people reach for the mouse. Owner decision: always focus
  // the step's first real field, on phones too, even though that opens the
  // on-screen keyboard and hides part of the page there. If that turns out
  // to be annoying in practice, a narrow-screen exception is a one-line
  // change -- not pre-empting it here.
  useEffect(() => {
    if (state.step >= 4) return; // Results is read, not filled in -- don't steal focus.
    const main = mainRef.current;
    if (!main) return;
    const target =
      state.step === 0 ? main.querySelector('#dob-input') :
      state.step === 1 ? main.querySelector('input[type="checkbox"]') :
      main.querySelector('.history-toggle-btn'); // steps 2/3: "No previous doses"
    target?.focus();
  }, [state.step]);

  function update(patch) {
    setState(prev => ({ ...prev, ...patch }));
  }

  // K1 (2026-09-24): a row the clinician added but never typed into is not an
  // injection, and must not follow the patient out of the step. Every blank
  // row goes, not just a trailing one — fill rows 1 and 3, leave row 2 empty,
  // and row 2 is dropped too.
  //
  // The sweep fires when LEAVING a history step, never while the clinician is
  // still in it: every new row starts blank, so clearing on sight would make
  // the row they just asked for vanish as it appeared.
  function sweepBlankDoseRows(prev) {
    const key = prev.step === 2 ? 'menacwyDoses' : prev.step === 3 ? 'menbDoses' : null;
    if (!key) return prev;
    const kept = dropBlankDoseRows(prev[key]);
    return kept.length === prev[key].length ? prev : { ...prev, [key]: kept };
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
    setState(prev => ({ ...sweepBlankDoseRows(prev), step: Math.min(prev.step + 1, STEPS.length - 1) }));
  }

  function goBack() {
    if (state.step === 4 && hasExclusion(state.riskIds)) {
      setState(prev => ({ ...prev, step: 1 }));
      return;
    }
    setState(prev => ({ ...sweepBlankDoseRows(prev), step: Math.max(prev.step - 1, 0) }));
  }

  function reset() {
    setState(INITIAL_STATE);
    setAgeError('');
  }

  // K2 (2026-09-25): Enter used to be a whole-page listener that called
  // goNext() no matter what had focus, which made every button in the wizard
  // an Enter trap (tab onto "No previous doses" and Enter skipped the step
  // instead of answering it). Removed in favor of a real <form> below, whose
  // onSubmit is the only thing that calls goNext() now: the browser presses
  // whatever button you're on, or continues the field you're typing in,
  // exactly the way every other web page already works.

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

      {state.step < 4 ? (
        // K2 (2026-09-25): a real <form> is what makes Enter work like the
        // rest of the web, with no JavaScript key-listening at all. Pressing
        // Enter in a field submits the form (native browser behaviour);
        // pressing Enter on a `type="button"` button never does (also
        // native) — it only clicks that button. Next is the one
        // `type="submit"` button in here, so it's the only thing this
        // onSubmit can mean.
        <form
          className="app-form"
          onSubmit={e => {
            e.preventDefault();
            goNext();
          }}
        >
          <main className="app-main" ref={mainRef}>
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
          </main>

          <div className="app-nav">
            <div className="app-nav-inner">
              {state.step > 0 ? (
                <button type="button" className="btn btn-back" onClick={goBack}>Back</button>
              ) : (
                <span />
              )}
              <span className="app-nav-next">
                <button type="submit" className="btn btn-next">
                  {state.step === 3 ? 'View Results' : 'Next'}
                </button>
                <span className="shortcut-hint">or press Enter</span>
              </span>
            </div>
          </div>
        </form>
      ) : (
        <main className="app-main">
          <Results state={state} onReset={reset} onChange={update}
            onBack={goBack} today={today} />
        </main>
      )}
    </div>
  );
}
