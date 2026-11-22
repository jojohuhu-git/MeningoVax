# MeningoVax — Phase 8 opening: Q12 answered, citations measured (2026-11-21)

Port plan: `docs/archive/plan-2026-11-08-meningovax-port.md`, Phase 8 and table C. Nothing in the
app changed in this step. It records one owner answer and measures where each citation item
stands, so the Phase 8 work starts from numbers rather than from the plan's 2026-11-08 column.

## Q12 — answered by the owner, 2026-11-21: "Yes, same as PneumoVax"

PneumoVax's citation delegation of 2026-10-18 carries over to MeningoVax. When every candidate
document gives the **same dose** and the only question is which one goes on the card, the agent
decides alone. Three cases still go to the owner, as worked patients:

- (a) no document has a row for the patient's history;
- (b) two documents give different doses;
- (c) the change would move a verdict, not just wording.

Two conditions come with it, as in PneumoVax: a **test that fails the suite** if the rule is
broken, and **every judgement call listed in the PR body**, grouped, so she can audit them in one
place. Each document is still read whole, tables included, before anything comes off a card
(FINDING F).

## How the measuring was done

`node scripts/citationMapping.mjs` (new, ported from PneumoVax's script of the same name). It runs
all **18,780** patients of the saved-answers grid (`src/test-grid.js`), **35,056** cards, through
the engine. For each card it compares the documents its sentences cite (raised numbers: booster
line, recorded-dose verdicts, note) with the documents its grey buttons link to. A link's `#…` part
is dropped first, because one document is often linked at several sentences.

It does not cover the combined-shot (pentavalent) card or the age-doubt note at the top of the
results; they are rendered by other code and are still to measure.

## What was found

| Count (cards) | What it means |
|---|---|
| **2,730** | A raised number names a document that has **no button** on the card (C3). |
| **21,180** | A button names a document that **no sentence** on the card cites (C4). |
| **6,206** | The same quoted sentence is cited more than once on one card (C7, see below). |
| **2,245** | One document carries **two different numbers** on the same card. A link that jumps to a sentence (`…htm#:~:text=…`) is counted as a different document from the plain link (`…htm`), so ACIP 2020 can be both `[1]` and `[2]`. The owner's rule of 2026-07-24 is that the number names the document, so this is a defect, fixed with C2 (number by the document, `#…` dropped). |

**Checked in the running app**, a healthy 11-year-old with no doses, MenACWY card, "Why this"
open (dev server, 2026-11-21):

- The sentences carry `[2]`, `[3]` inside "Why this" and `[1]` on the booster line at the bottom.
  The reader meets them as 2, 3, 1. That is because the numbers are handed out booster line
  first, but since L4 (2026-11-20) "Why this" sits above the booster line.
- `[3]` is the 2026 Penmenvy MMWR (mm7501a2). The card has **no button** for it. The one button
  is "ACIP 2020 MMWR", and it carries **no number**, so nothing says it is `[1]` and `[2]`.

## Where each item stands

| # | Item | Plan said (2026-11-08) | Measured 2026-11-21 |
|---|---|---|---|
| C1 | Hovering a number names the document | Done | Done (seen live: the hover text starts with the document name). |
| C2 | Numbered buttons under "Sources", one computation, order of first mention | Not done | **Not done.** Buttons carry no numbers; numbers and buttons are two lists (`cardCiteNumberer` in `RecCard.jsx`; `resolveRefs` in `refs.js`). The order is also off on "Why this first" cards (2, 3, 1 above). |
| C3 | Every number has a button | Not done | **Not done: 2,730 cards.** |
| C4 | A card credits only documents that speak for it | Not done | **Not done: 21,180 cards** have a button no sentence cites. This is the per-document reading (one PR per document). In PneumoVax these buttons were kept, numbered and last, until each was given a quote or taken off; never dropped to tidy a list. |
| C5 | Every quote names its patient group (`population`) | Not done | **Not done**: no entry in `refs.js` has a `population` field. |
| C6 | Cite CDC first | Not done | To measure per document. |
| C7 | One number per sentence a document states; never the same sentence twice | Not done | 6,206 cards cite one sentence more than once. Every example seen is one rule cited on **several recorded doses** (for example three MenACWY doses before age 10, each citing the same age sentence). Whether that counts as "twice" is to check against PneumoVax's own C7 before calling it a defect. |
| C8 | Sources row inside "Why this" | Not done | **Done** by Phase 6.3 Q10 (2026-11-19): `RecNote` in `RecCard.jsx` puts the buttons inside the disclosure, and a card with no explanation titles it "Sources". Plan table out of date. |
| C9 | A CDC link opens the closed section that holds the sentence | To measure | Still to measure (links use `#:~:text=`). |
| C10 | A button comes off when its row does not fit the patient | Not done | Per document. |
| C11 | Each number sits on the exact claim | Not done | Per document. |
| C12 | Clicking or hovering a number shows the quote in a pop-up | To measure | **Not done**: the quote shows as the browser's plain hover text (`title`), not a pop-up. |
| C13 | A quote never says the opposite of its card | Not done | Per document. |

## The order question (for the owner, with C2)

Her PneumoVax ruling: the first document a sentence cites is `[1]`. Since L4 (2026-11-20), an open
MeningoVax card shows "Why this" **above** its booster line and its recorded doses, but the
numbers are still handed out booster line first, then recorded doses, then "Why this". Of the
19,635 cards that open by default, **2,491** would number differently if numbers followed the order
the reader meets them (measured with a one-off script over the same grid, 2026-11-21).

Worked patient: a 10-year-old (born 2016-09-15, seen 2026-09-15) with complement deficiency and
one Bexsero at 9 years. Today "Why this" says "…at 0, 1–2 and 6 months [2]" and the recorded dose
below says "Minimum age not met (10 years for Bexsero). [1]" — the reader meets [2] first.

## Next

C2 and C3 together are one change, a port of PneumoVax's `cardSources()`: the buttons get the
numbers the sentences use, a sentence's document always gets a button, and a button no sentence
cites stays, numbered and last. It changes what the card looks like, so the owner sees a
before/after first (memory: "show layout changes before building"). The order question on
"Why this first" cards goes to her with it, because her 2026-10-17 ruling ("the sentences dictate
the order") was made on PneumoVax cards, where "Why this" is not above the other lines.
