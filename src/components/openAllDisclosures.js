// Port Phase 1.2 (2026-11-15): a switch that renders every disclosure already
// open — each "Why this" and each collapsed quiet card.
//
// OFF by default, and nothing in the app turns it on, so the app behaves
// exactly as it did. Only `scripts/proseDiff.mjs` turns it on, because it has
// to read every sentence a clinician CAN read, including the ones behind a
// click, and a page rendered on a server cannot be clicked.
//
// Only the two disclosures that hide prose read it. The dose-history and age
// editors are not disclosures of text and are left alone.
import { createContext } from 'react';

export const OpenAllDisclosures = createContext(false);
