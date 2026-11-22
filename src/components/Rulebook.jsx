// ─────────────────────────────────────────────────────────────────────────
// Rulebook.jsx — the "Rulebook" view (port Phase 7.2; owner Q11, 2026-11-19:
// "Yes, like PneumoVax").
//
// The Rulebook reorganization (owner, 2026-11-20; decisions in
// docs/archive/decisions-2026-11-20-rulebook-reorg.md), then "Steps hold their
// sections" (owner, 2026-11-21): "How MeningoVax decides" is one fold of six
// steps; each step is its own fold and holds its section of the page. Below
// them, under "Reference", MeningoVax decisions and Sources. Every fold is
// closed when the screen opens; "Show all" on the "How MeningoVax decides"
// bar opens every one, and turns into "Hide all". Every schedule is a
// Dose | Routine | Minimum interval table, the Minimum interval column grey.
//
// It is a view of the same tab, switched from the header ("Patient |
// Rulebook"); App.jsx keeps the patient part mounted but hidden, so a
// half-entered patient is still there on the way back.
//
// This file renders and decides nothing. Every sentence, age and interval
// comes from src/data/rulebookPage.js, which draws its numbers from the
// engine's constants and pairs each claim with a worked patient; the guard
// (regression-2026-11-19-rulebook-screen-matches-the-engine.test.jsx) runs
// every one of those patients through recommend().
// ─────────────────────────────────────────────────────────────────────────
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  HEADINGS, DECISIONS, DECISION, DECISION_USES, decisionsOf, rowSources, TRANSPLANT_STOP,
  VACCINE_ROWS, FAMILIES, ACWY_GROUPS, MENB_GROUPS, ACWY_ROUTINE, ACWY_BY_AGE, ACWY_HISTORY_NOTES,
  ACWY_HIGHRISK_TABLES, ACWY_HIGHRISK_NOTES, MENB_HEALTHY, MENB_HIGHRISK, MENB_DOSE3_EARLY, MENB_OTHER,
  MENB_PREGNANCY, RISK_RANKING, PENTA_ROWS, CHIP_LEGEND, GRACE, INTERVALS, SOONER_ADDS, NOT_COUNTED,
  SOURCE_GROUPS, PATH_STEPS, riskRankingFor,
} from '../data/rulebookPage.js';

/** Every fold on the page, in order: the path, its six steps, the Reference folds. */
const ALL_FOLDS = ['path', ...PATH_STEPS.map((s) => s.key), 'decisions', 'sources'];

/**
 * "Show all" / "Hide all" reaches the folds the page does not hold itself
 * (the decisions list's own folds): each press bumps n, and says open or not.
 */
const ShowAll = createContext({ n: 0, open: false });

/** A decision's three labelled lines, shared by the chip and the decisions part. */
function DecisionText({ d }) {
  return (
    <>
      <span className="rb-dec-line"><strong>Problem:</strong> {d.problem}</span>
      <span className="rb-dec-line"><strong>CDC and ACIP say:</strong> {d.cdc}</span>
      <span className="rb-dec-line"><strong>MeningoVax decision:</strong> {d.does}</span>
    </>
  );
}

/** A part that starts closed on a phone (PneumoVax, owner 2026-11-01). */
function useFold() {
  const all = useContext(ShowAll);
  const [open, setOpen] = useState(all.n > 0 && all.open);
  useEffect(() => { if (all.n > 0) setOpen(all.open); }, [all]);
  return [open ? ' rb-fold rb-open' : ' rb-fold', open, () => setOpen((v) => !v)];
}
function FoldBar({ name, open, toggle }) {
  return (
    <button type="button" className="rb-fold-btn" aria-expanded={open} onClick={toggle}>
      <span className="rb-fold-text"><strong className="rb-fold-name">{name}</strong></span>
      <span className="rb-fold-mark">{open ? 'Hide' : 'Show'}</span>
    </button>
  );
}

/** "MeningoVax decision: <name>", opening its reason in place. */
function DecisionChip({ k }) {
  const [open, setOpen] = useState(false);
  const d = DECISION[k];
  return (
    <span className="rb-dec">
      <button type="button" className="rb-decision" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        MeningoVax decision: {d.short}
      </button>
      {open && (
        <span className="rb-src-panel rb-dec-panel">
          <DecisionText d={d} />
        </span>
      )}
    </span>
  );
}
function Decisions({ row }) {
  return decisionsOf(row).map((k) => <React.Fragment key={k}> <DecisionChip k={k} /></React.Fragment>);
}

/**
 * "Source": the sentences the app's own cards cite for this row's worked
 * patients (only its own vaccine's card when the row is about one vaccine).
 * A row whose patients' cards quote nothing has no button.
 */
function Source({ row }) {
  const [open, setOpen] = useState(false);
  const quotes = rowSources(row);
  if (!quotes.length) return null;
  return (
    <span className="rb-src">
      {' '}
      <button type="button" className="rb-src-btn" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? 'Hide source' : 'Source'}
      </button>
      {open && (
        <span className="rb-src-panel">
          {quotes.map((q) => (
            <span key={q.key} className="rb-src-quote">
              &ldquo;{q.quote}&rdquo;
              <a href={q.url} target="_blank" rel="noopener noreferrer" className="rb-src-doc">{q.doc}</a>
            </span>
          ))}
        </span>
      )}
    </span>
  );
}

function DoseBox({ children }) {
  return <span className="rb-dose">{children}</span>;
}

function Card({ id, title, children, tone }) {
  return (
    <section className={`rb-card${tone ? ` rb-card-${tone}` : ''}`} aria-labelledby={id}>
      <h4 id={id} className="rb-h3">{title}</h4>
      {children}
    </section>
  );
}

/** A line under a table, with its decision and its Source. */
function Line({ row }) {
  return <p className="rb-small">{row.text}<Decisions row={row} /><Source row={row} /></p>;
}

// ── Group table: Group | Doses | Boosters (item 4) ───────────────────────
// Details sits under the group name and opens the row's short panel; one row
// open at a time, a second tap closes it. Only blue (shared decision) and
// amber (wait) cells are tinted.
const TONE_CLASS = { shared: 'rb-tint-shared', wait: 'rb-tint-wait' };
function GroupTable({ t, label }) {
  const [openKey, setOpenKey] = useState(null);
  return (
    <>
      <table className="rb-table rb-fixed rb-groups-table" aria-label={label}>
        <colgroup><col className="rb-w34" /><col className="rb-w33" /><col /></colgroup>
        <thead><tr><th>Group</th><th>Doses</th><th>Boosters</th></tr></thead>
        <tbody>
          {t.rows.map((r) => {
            const open = openKey === r.key;
            return (
              <React.Fragment key={r.key}>
                <tr className={open ? 'rb-g-on' : undefined}>
                  <th scope="row" className="rb-g-name">
                    {r.group}
                    <button type="button" className="rb-g-details" aria-expanded={open} onClick={() => setOpenKey(open ? null : r.key)}>
                      {open ? 'Close' : 'Details'}
                    </button>
                  </th>
                  <td className={TONE_CLASS[r.tone]}>{r.doses}</td>
                  <td>{r.boosters ?? '—'}</td>
                </tr>
                {open && (
                  <tr className="rb-g-det">
                    <td colSpan={3}>
                      <div className="rb-g-detin">
                        <ul className="rb-bullets">{r.details.map((d) => <li key={d}>{d}</li>)}</ul>
                        <p className="rb-cell-note"><Decisions row={r} /><Source row={r} /></p>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      <Line row={t.note} />
    </>
  );
}

// ── Schedule table: Dose | Routine | Minimum interval (item 6) ───────────
// The Minimum interval column is shaded light grey (owner, 2026-11-20).
function ScheduleTable({ rows, label }) {
  return (
    <table className="rb-table rb-fixed rb-sched" aria-label={label}>
      <colgroup><col className="rb-w22" /><col className="rb-w39" /><col /></colgroup>
      <thead><tr><th>Dose</th><th>Routine</th><th className="rb-min">Minimum interval</th></tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.dose}>
            <th scope="row" className="rb-strong-wrap">{r.dose}</th>
            <td>{r.routine}</td>
            <td className="rb-min">{r.min}<Decisions row={r} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
/**
 * The line under a schedule table, if any, ending in ONE Source for the table
 * and the line together (two Source links in a row read as a mistake).
 */
function TableFoot({ s, note }) {
  const both = { ex: [...(s.ex ?? []), ...(note?.ex ?? [])], vaccine: s.vaccine };
  if (!note) return <p className="rb-cell-note"><Source row={both} /></p>;
  return <p className="rb-small">{note.text}<Decisions row={note} /><Source row={both} /></p>;
}
function Schedule({ s, title }) {
  const note = s.note && (typeof s.note === 'string' ? { text: s.note, decision: s.decision } : s.note);
  return (
    <div className="rb-sched-block">
      <h5 className="rb-h4">{title ?? s.title}</h5>
      <ScheduleTable rows={s.rows} label={title ?? s.title} />
      <TableFoot s={s} note={note} />
    </div>
  );
}

// ── The parts ────────────────────────────────────────────────────────────
function Stop() {
  return (
    <Card id="rb-stop-card" title={TRANSPLANT_STOP.title} tone="stop">
      <p className="rb-body">{TRANSPLANT_STOP.text}<Decisions row={TRANSPLANT_STOP} /></p>
    </Card>
  );
}

function Vaccines() {
  return (
    <>
      <Card id="rb-vaccines-card" title="The vaccines">
        <p className="rb-small">MenACWY and MenB have separate schedules. One MenABCWY injection gives a dose of each.</p>
        <table className="rb-table rb-fixed" aria-label="The vaccines">
          <colgroup><col className="rb-w24" /><col className="rb-w18" /><col /></colgroup>
          <thead><tr><th>Vaccine</th><th>Minimum age</th><th>Use</th></tr></thead>
          <tbody>
            {VACCINE_ROWS.map((g) => (
              <React.Fragment key={g.name}>
                <tr className="rb-grp"><td colSpan={3}><span className="rb-grp-label">{g.name}</span></td></tr>
                {g.rows.map((p) => (
                  <tr key={p.key}>
                    <td className="rb-strong-wrap">{p.name}</td>
                    <td>{p.minAge}</td>
                    <td>{p.use}<Decisions row={p} /></td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </Card>

      <Card id="rb-families" title={FAMILIES.title}>
        {FAMILIES.rows.map((f) => (
          <div key={f.family} className="rb-path rb-family">
            {f.brands.map((b, i) => (
              <React.Fragment key={b}>{i > 0 && <span className="rb-or">or</span>}<DoseBox>{b}</DoseBox></React.Fragment>
            ))}
          </div>
        ))}
        <p className="rb-small">{FAMILIES.note} {FAMILIES.finish}<Source row={FAMILIES} /></p>
      </Card>
    </>
  );
}

function MenACWY() {
  return (
    <>
      <div className="rb-card"><GroupTable t={ACWY_GROUPS} label="MenACWY groups" /></div>

      <Card id="rb-acwy-routine" title={ACWY_ROUTINE.title}>
        <ScheduleTable rows={ACWY_ROUTINE.rows} label={ACWY_ROUTINE.title} />
        <TableFoot s={ACWY_ROUTINE} />
        <table className="rb-table">
          <thead><tr><th className="rb-w30">Age today, no doses</th><th>Next step</th></tr></thead>
          <tbody>
            {ACWY_BY_AGE.map((r) => (
              <tr key={r.age}><td className="rb-strong">{r.age}</td><td>{r.next}<Source row={r} /></td></tr>
            ))}
          </tbody>
        </table>
        {ACWY_HISTORY_NOTES.map((n) => <Line key={n.text} row={n} />)}
      </Card>

      <Card id="rb-acwy-highrisk" title="High risk: asplenia, complement deficiency, HIV">
        <p className="rb-small">{ACWY_HIGHRISK_NOTES.lead}</p>
        {ACWY_HIGHRISK_TABLES.map((t) => (
          <Schedule key={t.start} s={t} title={`Dose 1 at ${t.start}`} />
        ))}
        <p className="rb-small">{ACWY_HIGHRISK_NOTES.boosters}<Source row={ACWY_HIGHRISK_NOTES.boostersRow} /></p>
      </Card>

      <Multi vaccine="MenACWY" />
    </>
  );
}

function MenB() {
  return (
    <>
      <div className="rb-card"><GroupTable t={MENB_GROUPS} label="MenB groups" /></div>

      <Card id="rb-menb-healthy" title={MENB_HEALTHY.title}>
        <ScheduleTable rows={MENB_HEALTHY.rows} label={MENB_HEALTHY.title} />
        <TableFoot s={MENB_HEALTHY} note={MENB_HEALTHY.note} />
      </Card>

      <Card id="rb-menb-highrisk" title={MENB_HIGHRISK.title}>
        <ScheduleTable rows={MENB_HIGHRISK.rows} label={MENB_HIGHRISK.title} />
        <TableFoot s={MENB_HIGHRISK} note={MENB_HIGHRISK.note} />

        <h5 className="rb-h4">{MENB_DOSE3_EARLY.title}</h5>
        <table className="rb-table rb-fixed" aria-label={MENB_DOSE3_EARLY.title}>
          <colgroup><col className="rb-w55" /><col /></colgroup>
          <thead><tr><th>Dose 3 was given</th><th>Result</th></tr></thead>
          <tbody>
            {MENB_DOSE3_EARLY.rows.map((r) => (
              <tr key={r.given}><td>{r.given}</td><td>{r.result}<Decisions row={r} /><Source row={r} /></td></tr>
            ))}
          </tbody>
        </table>
        {MENB_OTHER.map((r) => <Line key={r.text} row={r} />)}
      </Card>

      <Card id="rb-menb-pregnancy" title="Pregnancy">
        <Line row={MENB_PREGNANCY} />
      </Card>

      <Multi vaccine="MenB" />
    </>
  );
}

/** "More than one condition" for one vaccine (owner, 2026-11-21: split by vaccine). */
function Multi({ vaccine }) {
  const label = `More than one condition, ${vaccine}`;
  return (
    <Card id={`rb-multi-${vaccine.toLowerCase()}`} title="More than one condition">
      <p className="rb-small">{RISK_RANKING.lead}</p>
      <table className="rb-table rb-fixed" aria-label={label}>
        <colgroup><col className="rb-w40" /><col /></colgroup>
        <thead><tr><th>If the patient has</th><th>Give</th></tr></thead>
        <tbody>
          {riskRankingFor(vaccine).map((s) => (
            <tr key={s.name}>
              <td className="rb-strong-wrap">{s.name}</td>
              <td>{s.text}<Decisions row={s} /><Source row={s} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function Penta() {
  return (
    <div className="rb-card">
      <ul className="rb-bullets">
        {PENTA_ROWS.map((r) => <li key={r.text}>{r.text}<Source row={r} /></li>)}
      </ul>
    </div>
  );
}

const CHIP_CLASS = { valid: 'dose-val-valid', invalid: 'dose-val-invalid', extra: 'dose-val-offwindow', unknown: 'dose-val-unknown', input: 'dose-val-needs-input' };
const Chip = ({ tone, children }) => <span className={`dose-val-chip ${CHIP_CLASS[tone]}`}>{children}</span>;

function Record() {
  return (
    <>
      {/* R74's lead was dropped (owner, 2026-11-21: it repeated step 2's summary). */}
      <Vaccines />

      <Card id="rb-labels" title="What the label on a dose means">
        <div className="rb-legend">
          {CHIP_LEGEND.map((c) => (
            <div key={`${c.chip}|${c.text}`} className="rb-legend-item">
              <span className="rb-chips"><Chip tone={c.tone}>{c.chip}</Chip></span>
              <span className="rb-small">{c.text}<Decisions row={c} /><Source row={c} /></span>
            </div>
          ))}
        </div>
      </Card>

      <Card id="rb-not-counted" title="A dose that does not count">
        <h5 className="rb-h4">General rules</h5>
        <ul className="rb-bullets">
          {NOT_COUNTED.general.map((r) => <li key={r.text}>{r.text}<Decisions row={r} /><Source row={r} /></li>)}
        </ul>
        <h5 className="rb-h4">Special cases</h5>
        <ul className="rb-bullets">
          {NOT_COUNTED.special.map((r) => <li key={r.text}>{r.text}<Decisions row={r} /><Source row={r} /></li>)}
        </ul>
      </Card>
    </>
  );
}

/** Step 5, Set the dates: minimum intervals and the grace period. */
function Dates() {
  return (
    <Card id="rb-intervals" title="Minimum intervals: a dose given sooner does not count">
      <p className="rb-band rb-band-green">{GRACE.text}<Decisions row={GRACE} /></p>
      <table className="rb-table rb-fixed">
        <colgroup><col className="rb-w40" /><col /></colgroup>
        <thead><tr><th>Doses</th><th className="rb-min">Minimum interval</th></tr></thead>
        <tbody>
          {INTERVALS.map((r) => (
            <tr key={r.doses}>
              <td>{r.doses}</td>
              <td className="rb-min"><strong>{r.gap}</strong><Decisions row={r} /><Source row={r} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <h5 className="rb-h4">{SOONER_ADDS.title}</h5>
      <ul className="rb-bullets">
        {SOONER_ADDS.rows.map((r) => <li key={r.text}>{r.text}<Source row={r} /></li>)}
      </ul>
    </Card>
  );
}

function DecisionItem({ d }) {
  const [cls, open, toggle] = useFold();
  return (
    <li id={`rb-decision-${d.key}`} className={`rb-declist-item${cls}`}>
      <FoldBar name={d.short} open={open} toggle={toggle} />
      <h4 className="rb-h4 rb-fold-title">{d.short}</h4>
      <span className="rb-dec-body"><DecisionText d={d} /></span>
      <span className="rb-cell-note">Applies in: {DECISION_USES[d.key].join(', ')}</span>
    </li>
  );
}
function DecisionList() {
  return (
    <>
      <p className="rb-lead">Where CDC and ACIP give no answer, MeningoVax chose one. Each is listed here once, and its name marks it wherever it applies on this page.</p>
      <div className="rb-card">
        <ol className="rb-declist">{DECISIONS.map((d) => <DecisionItem key={d.key} d={d} />)}</ol>
      </div>
    </>
  );
}

// Item 10: grouped, with no count of quoted sentences and no read date.
function Sources() {
  return (
    <div className="rb-card">
      {SOURCE_GROUPS.filter((g) => g.docs.length).map((g) => (
        <div key={g.name} className="rb-src-group">
          <h4 className="rb-h4">{g.name}</h4>
          {g.docs.map((d) => (
            <div key={d.url} className="rb-doc">
              <a href={d.url} target="_blank" rel="noopener noreferrer">{d.name}</a>
              {d.title && d.title !== d.name && <span className="rb-cell-note">{d.title}</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Each step's section (owner, 2026-11-21: each section sits under its step). */
const STEP_BODY = {
  stop: Stop, record: Record, acwy: MenACWY, menb: MenB, dates: Dates, penta: Penta,
};

/** The words on a fold's bar: its name, and a summary line for a step. */
function FoldButton({ id, name, sum, open, toggle, className }) {
  return (
    <button type="button" className={className} aria-expanded={open} aria-controls={`${id}-body`} onClick={toggle}>
      <span className="rb-fold-words">
        <span className="rb-fold-label">{name}</span>
        {sum && <span className="rb-step-sum">{sum}</span>}
      </span>
      <span className="rb-fold-mark">{open ? 'Hide' : 'Show'}</span>
    </button>
  );
}

/** A Reference fold: a heading that is a button, and the body once it is open. */
function Fold({ id, name, open, toggle, children }) {
  return (
    <section id={id} className="rb-section rb-part" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="rb-h2">
        <FoldButton id={id} name={name} open={open} toggle={toggle} className="rb-full-btn" />
      </h2>
      {open && <div id={`${id}-body`} className="rb-part-body">{children}</div>}
    </section>
  );
}

/** One step: its number, a bar that opens it, and its section. */
function Step({ n, step, open, toggle }) {
  const id = `rb-${step.key}`;
  const Body = STEP_BODY[step.key];
  return (
    <li className="rb-step">
      <span className="rb-step-num" aria-hidden="true">{n}</span>
      <section id={id} className="rb-step-body" aria-labelledby={`${id}-h`}>
        <h3 id={`${id}-h`} className="rb-h3 rb-step-h">
          <FoldButton id={id} name={step.title} sum={step.sum} open={open} toggle={toggle} className="rb-full-btn rb-step-btn" />
        </h3>
        {open && <div id={`${id}-body`} className="rb-part-body">{Body && <Body />}</div>}
      </section>
    </li>
  );
}

export default function Rulebook() {
  // Every fold closed when the screen opens (owner, 2026-11-21: "keep
  // everything collapsed"; as "All nine closed", 2026-11-20).
  const [open, setOpen] = useState(() => new Set());
  const [all, setAll] = useState({ n: 0, open: false });
  const toggle = (key) => setOpen((s) => {
    const next = new Set(s);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  // "Show all opens everything" (owner, 2026-11-21); once all are open it says "Hide all".
  const allOpen = ALL_FOLDS.every((k) => open.has(k));
  const showAll = () => {
    const next = !allOpen;
    setOpen(next ? new Set(ALL_FOLDS) : new Set());
    setAll((a) => ({ n: a.n + 1, open: next }));
  };

  return (
    <ShowAll.Provider value={all}>
      <div className="rb">
        <div className="rb-top">
          <h1 className="rb-title">Rulebook</h1>
          {/* R1: the owner's own sentence (2026-11-20). */}
          <p className="rb-intro">Recommendations are based on age, risk conditions and dated vaccine history.</p>
        </div>

        <section id="rb-how" className="rb-section rb-part" aria-labelledby="rb-how-h">
          <div className="rb-how-head">
            <h2 id="rb-how-h" className="rb-h2">
              <FoldButton id="rb-how" name="How MeningoVax decides" open={open.has('path')} toggle={() => toggle('path')} className="rb-full-btn" />
            </h2>
            <button type="button" className="rb-tap rb-show-all" onClick={showAll}>{allOpen ? 'Hide all' : 'Show all'}</button>
          </div>
          {open.has('path') && (
            <div id="rb-how-body" className="rb-part-body">
              <p className="rb-small">Six steps, always in this order.</p>
              <ol className="rb-steps">
                {PATH_STEPS.map((s, i) => (
                  <Step key={s.key} n={i + 1} step={s} open={open.has(s.key)} toggle={() => toggle(s.key)} />
                ))}
              </ol>
            </div>
          )}
        </section>

        <p className="rb-ref-label">Reference</p>
        <Fold id="rb-decisions" name={HEADINGS.decisions} open={open.has('decisions')} toggle={() => toggle('decisions')}>
          <DecisionList />
        </Fold>
        <Fold id="rb-sources" name={HEADINGS.sources} open={open.has('sources')} toggle={() => toggle('sources')}>
          <Sources />
        </Fold>

        <p className="rb-foot">
          This page is a guide to the app&rsquo;s reasoning, not a clinical reference. Where it and a
          CDC or ACIP document disagree, the document is right and this is a bug. Please report it.
        </p>
      </div>
    </ShowAll.Provider>
  );
}
