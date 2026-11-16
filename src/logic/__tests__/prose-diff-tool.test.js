// Port Phase 1.2 (2026-11-15): the prose tool still reads what it is for.
//
// `scripts/proseDiff.mjs` is a tool, not a gate: nothing fails when wording
// changes. What CAN silently break is the tool itself — if it stopped opening
// "Why this", or stopped reading hover text, every diff it printed would
// undercount and nobody would know. Checked on two saved patients, taken from
// the saved-answer grid rather than typed here.
//
// It also holds the app's side of the bargain: the switch that opens every
// disclosure is OFF unless the tool turns it on, so the app a clinician uses
// still opens with "Why this" closed and quiet cards collapsed.
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Results from '../../components/Results.jsx';
import { proseOf, renderScreen, textOf } from '../../../scripts/proseDiff.mjs';
import { buildSavedAnswerCases } from '../../test-grid.js';
import { recommend } from '../recommend.js';

const cases = buildSavedAnswerCases();
const patient = (key) => {
  const c = cases.find((x) => x.key === key);
  if (!c) throw new Error(`no saved patient ${key} — has the grid changed?`);
  return c.input;
};
// The words of a note up to its first source marker, as they appear on screen.
const opening = (text) => text.split('[c]')[0].trim().slice(0, 60);

describe('prose tool: reads every sentence a clinician can read', () => {
  // N5's patient: healthy, 16, MenQuadfi 40 days ago. The card's "Why this"
  // explains the 8-week wait.
  const n5 = patient('a192|r:|A:MenQuadfi@40|B:');
  const whyThis = opening(recommend(n5).menacwy[0].note.detail);

  it('the text behind "Why this" is read', () => {
    expect(whyThis.length).toBeGreaterThan(20);
    expect(proseOf(n5)).toContain(whyThis);
  });

  it('…and only because the tool opens it: the app\'s own screen keeps it closed', () => {
    expect(textOf(renderScreen(n5, { openAll: false }))).not.toContain(whyThis);
    // The app's real path: Results drawn with NO switch around it, as App.jsx
    // does, so the switch's own default is what decides. (renderScreen always
    // sets the switch, so it cannot see a default that was flipped to open.)
    const appScreen = renderToStaticMarkup(React.createElement(Results, {
      state: { ...n5 }, today: n5.today, onReset() {}, onChange() {}, onBack() {},
    }));
    expect(textOf(appScreen)).toContain('Why this');
    expect(textOf(appScreen)).not.toContain(whyThis);
  });

  it('a collapsed quiet card is read open', () => {
    // A healthy 50-year-old with nothing recorded: both cards are quiet and
    // start collapsed in the app.
    const adult = patient('a600|r:|A:|B:');
    const r = recommend(adult);
    const quiet = [...r.menacwy, ...r.menb].find((c) => (
      ['complete', 'not-indicated', 'deferred'].includes(c.status) && !c.boosterDueDate && c.note?.lead
    ));
    expect(quiet, 'the grid no longer has a collapsed card here').toBeTruthy();
    const lead = opening(quiet.note.lead);
    expect(proseOf(adult)).toContain(lead);
    expect(textOf(renderScreen(adult, { openAll: false }))).not.toContain(lead);
  });

  it('hover text on a source number is read', () => {
    expect(proseOf(n5)).toMatch(/\{hover: ACIP 2020 MMWR/);
  });

  it('the line has no tabs or line breaks (one patient, one line)', () => {
    expect(proseOf(n5)).not.toMatch(/[\t\n]/);
  });
});
