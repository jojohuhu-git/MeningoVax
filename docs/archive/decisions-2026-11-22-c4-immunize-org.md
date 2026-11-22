# Owner decision — C4, immunize.org "Ask the Experts" buttons (2026-11-22)

Port Phase 8, C4, the last two documents: immunize.org's Ask the Experts topic pages for MenACWY
(https://www.immunize.org/ask-experts/topic/menacwy/) and MenB
(https://www.immunize.org/ask-experts/topic/menb/). Both read live 2026-11-22 in the browser pane.

## Measured first

`scripts/uncitedByDocument.mjs` over the saved-answers grid (35,056 cards):

| Page | Cards with the button uncited | Which card |
|---|---|---|
| MenACWY | 888 | Healthy adult 22 or older, MenACWY "Not routinely indicated" |
| MenB | 492 | Healthy MenB, dose 2 under 6 months after dose 1: "Dose 3 of 3 (dose 2 given early)" |

A third card listed the MenACWY page (college, a recorded dose whose date is unknown), but it never
shows: an undated dose does not count (owner C1), so that patient gets the plain "1 dose" card.

What the live pages say (each answer has its own "Last reviewed" date, here November 15, 2024):

- MenACWY: "MenACWY may be administered through age 21 years as a catch-up vaccination for those who
  have not received a dose after their 16th birthday." The card already cites ACIP 2020's own
  sentence for this (`acwyCatchup1921`).
- MenB: "If the second dose is given at an interval of less than 6 months, a third dose should be
  given at least 4 months after the 2nd dose." The card already cites ACIP Oct 2024's own sentence
  (`menbRescueDoseRule`).

## The question and the answer

Asked: quote and number immunize.org's matching sentence beside ACIP's; remove the buttons; or leave
them unnumbered. Doses unchanged under every option.

**Owner answer: "Remove the buttons."**

Built: neither card lists an immunize.org topic-page button; the undated-college branch lost its
button too. `immMenB` is deleted from `refs.js`. `immMenACWY` stays only as the page's title: the
numbered age-10 quote (`acwyAge10CountsAsDose1`, which quotes one answer on that page and is a
different source) takes its button's full name from it. It is listed in `KNOWN_UNCITED` in
`citation-integrity.test.js` with that reason.

Measured after: uncited buttons on 0 cards (was 1,380). Wording (`npm run prose`): 1,503 of 24,600
patients read differently, and in every one the only difference is the removed button; 0 sentences,
0 answers moved. Guard: `regression-2026-11-22-c4-immunize-org-buttons-removed.test.js`.

## Seen, not acted on

immunize.org's MenB page answers the same question two ways. One answer gives the card's rule (dose 3
at least 4 months after dose 2). Two other answers add "at least 6 months after dose 1"
("Under the current Bexsero and Trumenba schedules, any MenB vaccine recipient whose second dose is
administered less than 6 months after dose 1 should receive a third dose at least 6 months after
dose 1 and 4 months after dose 2"). The app follows ACIP Oct 2024, which gives only the 4-month line.
Example: Bexsero 1 May and 1 Jun 2026 — the app says dose 3 from 1 Oct 2026; that second
immunize.org answer would say from 1 Nov 2026. No change made; an owner question if wanted.
