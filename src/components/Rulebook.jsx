// ─────────────────────────────────────────────────────────────────────────
// Rulebook.jsx — the "Rulebook" view (port Phase 7.2; owner Q11, 2026-11-19:
// "Yes, like PneumoVax").
//
// PneumoVax's screen, brought here: the parts follow the order the app
// decides in (the transplant stop, the vaccines, age and risk group, MenACWY,
// MenB, the combined shot, doses on the record, then MeningoVax's own
// decisions and the sources). It is a view of the same tab, switched from the
// header ("Patient | Rulebook"); App.jsx keeps the patient part mounted but
// hidden, so a half-entered patient is still there on the way back.
//
// This file renders and decides nothing. Every sentence, age and interval
// comes from src/data/rulebookPage.js, which draws its numbers from the
// engine's constants and pairs each claim with a worked patient; the guard
// (regression-2026-11-19-rulebook-screen-matches-the-engine.test.jsx) runs
// every one of those patients through recommend().
// ─────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  HEADINGS, DECISIONS, DECISION, DECISION_USES, decisionsOf, sourcesFor, TRANSPLANT_STOP,
  VACCINE_ROWS, FAMILIES, AGE_LINES, RISK_ROWS, RISK_RANKING, ACWY_ROUTINE, ACWY_BY_AGE,
  ACWY_HISTORY_NOTES, ACWY_HIGHRISK_LANES, ACWY_HIGHRISK_NOTES, ACWY_OTHER, ACWY_OTHER_NOTE,
  MENB_HEALTHY, MENB_HIGHRISK, MENB_PREGNANCY, PENTA_ROWS, CHIP_LEGEND, GRACE, INTERVALS,
  NOT_COUNTED, SOURCE_DOCS,
} from '../data/rulebookPage.js';

const SECTIONS = [
  ['rb-vaccines', HEADINGS.vaccines],
  ['rb-who', HEADINGS.who],
  ['rb-acwy', HEADINGS.acwy],
  ['rb-menb', HEADINGS.menb],
  ['rb-penta', HEADINGS.penta],
  ['rb-record', HEADINGS.record],
  ['rb-decisions', HEADINGS.decisions],
  ['rb-sources', HEADINGS.sources],
];

/** A decision's three labelled lines, shared by the chip and part 7. */
function DecisionText({ d }) {
  return (
    <>
      <span className="rb-dec-line"><strong>Problem:</strong> {d.problem}</span>
      <span className="rb-dec-line"><strong>CDC and ACIP:</strong> {d.cdc}</span>
      <span className="rb-dec-line"><strong>MeningoVax decision:</strong> {d.does}</span>
    </>
  );
}

/** A part that starts closed on a phone (PneumoVax, owner 2026-11-01). */
function useFold() {
  const [open, setOpen] = useState(false);
  return [open ? ' rb-fold rb-open' : ' rb-fold', open, () => setOpen((v) => !v)];
}
function FoldBar({ name, summary, open, toggle }) {
  return (
    <button type="button" className="rb-fold-btn" aria-expanded={open} onClick={toggle}>
      <span className="rb-fold-text">
        <strong className="rb-fold-name">{name}</strong>
        {summary && <span className="rb-fold-sum">{summary}</span>}
      </span>
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
 * patients. A row whose patients' cards quote nothing has no button.
 */
function Source({ row, keys }) {
  const [open, setOpen] = useState(false);
  const quotes = row?.ex?.length ? sourcesFor(row.ex, keys) : [];
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

function DoseBox({ children, done }) {
  const cls = ['rb-dose', done && 'rb-dose-done'].filter(Boolean).join(' ');
  return <span className={cls}>{children}</span>;
}
const Arrow = () => <span className="rb-arrow" aria-hidden="true">&rarr;</span>;
/**
 * Dose boxes joined by arrows, ending in Complete unless told otherwise.
 * When the doses carry ages, the ages sit on a second row of the same grid,
 * each under its own box, so every box and arrow stays on one line (owner,
 * 2026-11-19: the Complete box was misaligned).
 */
function Series({ doses, end = 'Complete' }) {
  const items = [];
  doses.forEach((d, i) => {
    if (i > 0) items.push({ arrow: true });
    items.push(typeof d === 'string' ? { text: d } : d);
  });
  if (end) items.push({ arrow: true }, { text: end, done: true });
  const timed = doses.some((d) => typeof d !== 'string');
  const top = items.map((it, i) => (it.arrow
    ? <Arrow key={`a${i}`} />
    : <DoseBox key={`d${i}`} done={it.done}>{it.text}</DoseBox>));
  if (!timed) return <div className="rb-pattern-doses">{top}</div>;
  return (
    <div className="rb-pattern-doses rb-timed" style={{ gridTemplateColumns: `repeat(${items.length}, auto)` }}>
      {top}
      {items.map((it, i) => <span key={`t${i}`} className="rb-tick-age">{it.age ?? ''}</span>)}
    </div>
  );
}

function Card({ id, title, children, tone }) {
  return (
    <section className={`rb-card${tone ? ` rb-card-${tone}` : ''}`} aria-labelledby={id}>
      <h3 id={id} className="rb-h3">{title}</h3>
      {children}
    </section>
  );
}

// ── The stop: the first thing the app checks ─────────────────────────────
function Stop() {
  return (
    <Card id="rb-stop" title={TRANSPLANT_STOP.title} tone="stop">
      <p className="rb-body">{TRANSPLANT_STOP.text}<Decisions row={TRANSPLANT_STOP} /></p>
    </Card>
  );
}

// ── 1. The vaccines ──────────────────────────────────────────────────────
function Vaccines() {
  return (
    <>
      <p className="rb-lead">MenACWY and MenB are separate vaccines with separate schedules. The combined shot gives one dose of each at the same visit.</p>
      <div className="rb-card"><div className="rb-scroll">
        <table className="rb-table rb-fixed rb-freeze">
          <colgroup><col className="rb-w18" /><col className="rb-w12" /><col className="rb-w12" /><col /></colgroup>
          <thead><tr><th className="rb-freeze-col">Vaccine</th><th>Minimum age</th><th>MenB family</th><th>Use</th></tr></thead>
          <tbody>
            {VACCINE_ROWS.map((g) => (
              <React.Fragment key={g.name}>
                <tr className="rb-grp"><td colSpan={4}><span className="rb-grp-label">{g.name}</span></td></tr>
                {g.rows.map((p) => (
                  <tr key={p.key}>
                    <td className="rb-freeze-col rb-strong" data-label="Vaccine">{p.name}</td>
                    <td data-label="Minimum age">{p.minAge}</td>
                    <td data-label="MenB family">{p.family}</td>
                    <td data-label="Use">{p.use}<Decisions row={p} /></td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div></div>

      <Card id="rb-families" title="The two MenB families">
        {FAMILIES.rows.map((f) => (
          <div key={f.family} className="rb-path rb-family">
            <span className="rb-path-name">{f.family}</span>
            {f.brands.map((b, i) => (
              <React.Fragment key={b}>{i > 0 && <span className="rb-or">or</span>}<DoseBox>{b}</DoseBox></React.Fragment>
            ))}
          </div>
        ))}
        <p className="rb-small">{FAMILIES.note}<Source row={FAMILIES} /></p>
      </Card>
    </>
  );
}

// ── 2. Age and risk group ────────────────────────────────────────────────
/** What to give, then (if any) when boosters are due, on its own line. */
function GiveCell({ cell }) {
  return (
    <>
      <span className={cell.boosters === null && /^As for/.test(cell.give) ? 'rb-any' : undefined}>{cell.give}</span>
      {cell.boosters && <span className="rb-cell-text"><strong>Boosters:</strong> {cell.boosters}</span>}
    </>
  );
}
function RiskRow({ r }) {
  return (
    <tr>
      <td className="rb-freeze-col rb-strong-wrap" data-label="Condition">{r.name}</td>
      <td data-label="MenACWY"><GiveCell cell={r.acwy} /></td>
      <td data-label="MenB"><GiveCell cell={r.menb} /><Source row={r} /></td>
    </tr>
  );
}

function Who() {
  return (
    <>
      <Card id="rb-ages" title="Age lines, youngest first">
        <ol className="rb-agetrack">
          {AGE_LINES.map((a) => (
            <li key={a.age} className="rb-agestop">
              <strong className="rb-agestop-age">{a.age}</strong>
              <span className="rb-agestop-text">{a.text}</span>
            </li>
          ))}
        </ol>
      </Card>

      <Card id="rb-groups" title="Risk groups">
        <p className="rb-small">Each condition the app asks about: what to give, and when boosters are due.</p>
        <div className="rb-scroll">
          <table className="rb-table rb-freeze">
            <thead><tr><th className="rb-w24 rb-freeze-col">Condition</th><th>MenACWY</th><th>MenB</th></tr></thead>
            <tbody>{RISK_ROWS.map((r) => <RiskRow key={r.id} r={r} />)}</tbody>
          </table>
        </div>
      </Card>

      <Card id="rb-multi" title="When a patient has more than one condition">
        <p className="rb-small">{RISK_RANKING.lead}</p>
        <div className="rb-scroll">
          <table className="rb-table">
            <thead><tr><th className="rb-w40">If the patient has</th><th>Give</th></tr></thead>
            <tbody>
              {RISK_RANKING.steps.map((s) => (
                <tr key={s.name}>
                  <td className="rb-strong-wrap" data-label="If the patient has">{s.name}</td>
                  <td data-label="Give">{s.text}<Decisions row={s} /><Source row={s} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

// ── 3. MenACWY ───────────────────────────────────────────────────────────
function HighRiskLane({ lane }) {
  const [cls, open, toggle] = useFold();
  return (
    <div className={`rb-lane${cls}`}>
      <FoldBar name={`Dose 1 at ${lane.start}`} summary={lane.doses.join(' → ')} open={open} toggle={toggle} />
      <strong className="rb-lane-name rb-fold-title">Dose 1 at {lane.start}</strong>
      <Series doses={lane.doses} end="Boosters" />
      {lane.note && <p className="rb-cell-note">{lane.note}<Decisions row={lane} /></p>}
      <p className="rb-cell-note"><Source row={lane} /></p>
    </div>
  );
}

function MenACWY() {
  return (
    <>
      <Card id="rb-acwy-routine" title="Routine, no risk factor">
        <Series doses={ACWY_ROUTINE.doses} />
        <p className="rb-small">{ACWY_ROUTINE.note}<Source row={ACWY_ROUTINE} /></p>
        <div className="rb-scroll">
          <table className="rb-table">
            <thead><tr><th className="rb-w30">Age today, no doses</th><th>Next step</th></tr></thead>
            <tbody>
              {ACWY_BY_AGE.map((r) => (
                <tr key={r.age}><td className="rb-strong" data-label="Age today">{r.age}</td><td data-label="Next step">{r.next}<Source row={r} /></td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="rb-bullets">
          {ACWY_HISTORY_NOTES.map((n) => <li key={n.text}>{n.text}<Source row={n} /></li>)}
        </ul>
      </Card>

      <Card id="rb-acwy-highrisk" title="High risk: asplenia, complement deficiency, HIV">
        <p className="rb-small">The series is set by the age at dose 1. Travel and an outbreak give the same infant series.</p>
        <div className="rb-lanes">{ACWY_HIGHRISK_LANES.map((l) => <HighRiskLane key={l.start} lane={l} />)}</div>
        <p className="rb-small">{ACWY_HIGHRISK_NOTES.spacing}</p>
        <p className="rb-small"><strong>Boosters.</strong> {ACWY_HIGHRISK_NOTES.boosters}<Source row={{ ex: ACWY_HIGHRISK_NOTES.boostersEx }} /></p>
      </Card>

      <Card id="rb-acwy-other" title="Other indications">
        <div className="rb-scroll">
          <table className="rb-table rb-freeze">
            <thead><tr><th className="rb-w30 rb-freeze-col">Indication</th><th className="rb-w24">Primary</th><th>Boosters</th></tr></thead>
            <tbody>
              {ACWY_OTHER.map((r) => (
                <tr key={r.name}>
                  <td className="rb-freeze-col rb-strong-wrap" data-label="Indication">{r.name}</td>
                  <td data-label="Primary">{r.primary}</td>
                  <td data-label="Boosters">{r.boosters}<Decisions row={r} /><Source row={r} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="rb-small">{ACWY_OTHER_NOTE.text}<Decisions row={ACWY_OTHER_NOTE} /><Source row={ACWY_OTHER_NOTE} /></p>
      </Card>
    </>
  );
}

// ── 4. MenB ──────────────────────────────────────────────────────────────
function MenB() {
  return (
    <>
      <Card id="rb-menb-healthy" title="Healthy: shared clinical decision-making">
        <p className="rb-small">{MENB_HEALTHY.lead}<Source row={MENB_HEALTHY} /></p>
        <Series doses={MENB_HEALTHY.doses} />
        <ul className="rb-bullets">
          {MENB_HEALTHY.rows.map((r) => <li key={r.text}>{r.text}<Decisions row={r} /><Source row={r} /></li>)}
        </ul>
      </Card>

      <Card id="rb-menb-highrisk" title="High risk">
        <p className="rb-small">{MENB_HIGHRISK.lead}<Source row={MENB_HIGHRISK} /></p>
        <Series doses={MENB_HIGHRISK.doses} end="Boosters" />
        <ul className="rb-bullets">
          {MENB_HIGHRISK.rows.map((r) => <li key={r.text}>{r.text}<Decisions row={r} /><Source row={r} /></li>)}
        </ul>
      </Card>

      <Card id="rb-menb-pregnancy" title="Pregnancy">
        <p className="rb-small">{MENB_PREGNANCY.text}<Source row={MENB_PREGNANCY} /></p>
      </Card>
    </>
  );
}

// ── 5. The combined shot ─────────────────────────────────────────────────
function Penta() {
  return (
    <div className="rb-card">
      <ul className="rb-bullets">
        {PENTA_ROWS.map((r) => <li key={r.text}>{r.text}<Source row={r} /></li>)}
      </ul>
    </div>
  );
}

// ── 6. Doses on the record ───────────────────────────────────────────────
const CHIP_CLASS = { valid: 'dose-val-valid', invalid: 'dose-val-invalid', extra: 'dose-val-offwindow', unknown: 'dose-val-unknown', input: 'dose-val-needs-input' };
const Chip = ({ tone, children }) => <span className={`dose-val-chip ${CHIP_CLASS[tone]}`}>{children}</span>;

function Record() {
  return (
    <>
      <p className="rb-lead">Each dose on the record is checked against the patient&rsquo;s age and the dose before it, and gets one label. The card advises the routine date, which can be later than the minimum.</p>

      <Card id="rb-labels" title="What the label on a dose means">
        <div className="rb-legend">
          {CHIP_LEGEND.map((c) => (
            <div key={c.chip} className="rb-legend-item">
              <span className="rb-chips"><Chip tone={c.tone}>{c.chip}</Chip></span>
              <span className="rb-small">{c.text}<Decisions row={c} /><Source row={c} /></span>
            </div>
          ))}
        </div>
      </Card>

      <Card id="rb-intervals" title="Minimum intervals: a dose given sooner does not count">
        <p className="rb-band rb-band-green"><strong>{GRACE.title}</strong> {GRACE.text}<Decisions row={GRACE} /></p>
        <div className="rb-scroll">
          <table className="rb-table">
            <thead><tr><th className="rb-w40">Doses</th><th>Minimum interval</th></tr></thead>
            <tbody>
              {INTERVALS.map((r) => (
                <tr key={r.doses}>
                  <td data-label="Doses">{r.doses}</td>
                  <td data-label="Minimum interval">
                    <strong>{r.gap}</strong>
                    {r.text && <span className="rb-cell-text">{r.text}</span>}
                    <Decisions row={r} /><Source row={r} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card id="rb-not-counted" title="A dose that does not count">
        <ul className="rb-bullets">
          {NOT_COUNTED.map((r) => <li key={r.text}>{r.text}<Decisions row={r} /><Source row={r} /></li>)}
        </ul>
      </Card>
    </>
  );
}

// ── 7. MeningoVax decisions ──────────────────────────────────────────────
function DecisionItem({ d }) {
  const [cls, open, toggle] = useFold();
  return (
    <li id={`rb-decision-${d.key}`} className={`rb-declist-item${cls}`}>
      <FoldBar name={d.short} open={open} toggle={toggle} />
      <h4 className="rb-h4 rb-fold-title">{d.short}</h4>
      <span className="rb-dec-body"><DecisionText d={d} /></span>
      <span className="rb-cell-note">Applies in: {DECISION_USES[d.key].join('; ')}</span>
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

// ── 8. Sources ───────────────────────────────────────────────────────────
function Sources() {
  return (
    <>
      <p className="rb-lead">Every document the app cites. A document&rsquo;s count is how many of its sentences the app quotes.</p>
      <div className="rb-card">
        {SOURCE_DOCS.map((d) => (
          <div key={d.url} className="rb-doc">
            <a href={d.url} target="_blank" rel="noopener noreferrer">{d.name}</a>
            {d.title && d.title !== d.name && <span className="rb-cell-note">{d.title}</span>}
            <span className="rb-cell-note">
              {d.quotes ? `${d.quotes} sentence${d.quotes === 1 ? '' : 's'} quoted` : 'Listed, not quoted'}
              {d.lastVerified ? ` · read ${d.lastVerified}` : ''}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

const BODY = {
  'rb-vaccines': Vaccines, 'rb-who': Who, 'rb-acwy': MenACWY, 'rb-menb': MenB,
  'rb-penta': Penta, 'rb-record': Record, 'rb-decisions': DecisionList, 'rb-sources': Sources,
};

export default function Rulebook() {
  return (
    <div className="rb">
      <div className="rb-top">
        <h1 className="rb-title">Rulebook</h1>
        <p className="rb-intro">
          Recommendations are based on age, risk conditions and dated vaccine history. The parts
          below follow the order the app decides in. Source shows the CDC or ACIP sentence a rule
          rests on. A MeningoVax decision marks a rule they do not state, and opens to show the
          problem, what CDC and ACIP say, and what MeningoVax does.
        </p>
      </div>

      <nav aria-label="On this page" className="rb-nav">
        {SECTIONS.map(([id, name], i) => <a key={id} href={`#${id}`}>{i + 1}. {name}</a>)}
      </nav>

      <Stop />

      {SECTIONS.map(([id, name], i) => {
        const Body = BODY[id];
        return (
          <section key={id} className="rb-section" aria-labelledby={id}>
            <h2 id={id} className="rb-h2">{i + 1}. {name}</h2>
            <Body />
          </section>
        );
      })}

      <p className="rb-foot">
        This page is a guide to the app&rsquo;s reasoning, not a clinical reference. Where it and a
        CDC or ACIP document disagree, the document is right and this is a bug. Please report it.
      </p>
    </div>
  );
}
