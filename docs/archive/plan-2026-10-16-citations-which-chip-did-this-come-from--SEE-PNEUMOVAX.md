# POINTER — the citations plan lives in PneumoVax

**This file is not the plan.** It is signposting so a MeningoVax session can find the real
document instead of working from a second copy that has drifted.

**The plan:** `~/Downloads/PneumoVax/docs/archive/plan-2026-10-16-citations-which-chip-did-this-come-from.md`

**Why a pointer and not a copy:** owner decision 2026-10-16 — see the reasoning in the
companion transplant pointer in this folder.

## What it is about

A recommendation card shows sources two ways that don't know about each other: the small
raised `[1]` in a sentence names the **document** that sentence was quoted from, while the
grey buttons along the bottom belong to the **whole card** and carry no numbers. So there
is no way to match a `[1]` to a button. The plan numbers the buttons, makes hovering name
the document, and gives every statement a quote that actually supports it.

## What this repo's half is

Two faults that are **MeningoVax's alone** — neither exists in PneumoVax:

- **C4 — six buttons that jump to one sentence while claiming to be the whole document.**
  Six `refs.js` entries have a "jump to this sentence" tag buried inside the stored URL.
  The note beside that code says buttons are *"always the whole-page URL"*, which is untrue
  for those six. Separate the two the way PneumoVax already does, and correct the note.
  Guarded afterwards by check **G6**.
- **C5 — five buttons that all print the same words.** Five entries are different tables
  inside the same 2020 ACIP report and every button reads *"ACIP 2020 MMWR."* On 37 of 264
  cards sampled, two identical-looking buttons sit side by side pointing at different tables.
  Each should name its table.

MeningoVax also has **23 quoted sources** (PneumoVax has 25, dropping to 22) that each need
a live re-read plus a note recording **which patients the quoted sentence was written
about** — the plan's C6/C7, and the part that actually prevents a right-sounding quote being
shown to the wrong patient.

⚠ **The trap, per the plan:** match a button to a quote by *which document it is*, never by
comparing the stored URLs as text — those six jump-tags make the same document look like two.

## Order

**Do not start this until the transplant hard-stop plan has merged in both repos** (see the
companion pointer). The two are open on the same files, and the transplant work changes
every count in the citations plan.
