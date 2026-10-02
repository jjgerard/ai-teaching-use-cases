// Validate the AI-policy dataset against policy/codebook.json.
//
//     node policy/validate.js [dataDir] [codebook.json]
//
// Exits non-zero on any error. Warnings (gaps, unverifiable quotes) do not fail.
//
// The rule this enforces: every analytical value is typed and closed. Prose is
// allowed only in evidence_quote, page_ref and misfit_note, and nothing here or
// downstream reads those. A value that is not on the list is an error, not a
// note to be tidied later.
//
// Tables (dataDir, default data/policy):
//   institutions.json  [{institution_id, country, region, sector}]
//   documents.json     [{doc_id, institution_id, url_id, level, audience, status, format,
//                        published, last_updated, retrieved, ...}]
//   codes.json         [{doc_id, variable_id, value, evidence_quote, page_ref, coder,
//                        coded_at, codebook_version, misfit_note, [unit, counted, basis]}]
//   snapshots/<doc_id>.txt   optional archived text; if present, quotes must occur in it

const fs = require("node:fs");
const path = require("node:path");

const ISO = /^\d{4}-\d{2}(-\d{2})?$/;
// Compare quotes to archived text ignoring layout artefacts: whitespace, hyphens
// (PDF line-break hyphens are lost or kept inconsistently) and curly quotes.
const squash = (s) =>
  String(s)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u00ad\u2010-\u2015-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

function validate({ institutions, documents, codes, codebook, snapshots = {} }) {
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);

  const states = Object.keys(codebook.states);
  const vars = new Map(codebook.variables.map((v) => [v.id, v]));
  const instIds = new Set(institutions.map((i) => i.institution_id));
  const docs = new Map();

  // --- documents ---------------------------------------------------------
  for (const d of documents) {
    if (!d.doc_id) { err("document with no doc_id"); continue; }
    if (docs.has(d.doc_id)) err(`${d.doc_id}: duplicate doc_id`);
    docs.set(d.doc_id, d);
    if (!instIds.has(d.institution_id)) err(`${d.doc_id}: unknown institution_id ${JSON.stringify(d.institution_id)}`);
    for (const [f, allowed] of Object.entries(codebook.documentFields)) {
      if (!allowed.includes(d[f])) err(`${d.doc_id}: ${f} ${JSON.stringify(d[f])} is not one of ${allowed.join("|")}`);
    }
    for (const f of ["published", "last_updated", "retrieved"]) {
      if (d[f] == null) continue;
      if (!ISO.test(d[f])) err(`${d.doc_id}: ${f} ${JSON.stringify(d[f])} is not an ISO date`);
    }
    if (d.retrieved == null) err(`${d.doc_id}: retrieved date is required`);
    if (d.last_updated == null && d.date_known !== false) err(`${d.doc_id}: last_updated is null but date_known is not false`);
    if (d.last_updated && d.published && d.last_updated < d.published) err(`${d.doc_id}: last_updated precedes published`);
  }

  // --- codes -------------------------------------------------------------
  const byDoc = new Map(); // doc_id -> variable_id -> row
  for (const c of codes) {
    const id = `${c.doc_id}/${c.variable_id}`;
    const doc = docs.get(c.doc_id);
    const v = vars.get(c.variable_id);
    if (!doc) { err(`${id}: unknown doc_id`); continue; }
    if (!v) { err(`${id}: unknown variable_id`); continue; }
    if (!byDoc.has(c.doc_id)) byDoc.set(c.doc_id, new Map());
    if (byDoc.get(c.doc_id).has(c.variable_id)) { err(`${id}: coded twice`); continue; }
    byDoc.get(c.doc_id).set(c.variable_id, c);

    for (const f of ["coder", "coded_at"]) if (!c[f]) err(`${id}: ${f} is required`);
    if (c.codebook_version !== codebook.version) err(`${id}: coded under codebook ${c.codebook_version}, current is ${codebook.version}`);

    const isState = typeof c.value === "string" && states.includes(c.value);
    const applies = !v.applies_to || v.applies_to.includes(doc.audience) || (doc.audience === "all");
    if (!applies && c.value !== "not_applicable") err(`${id}: variable does not apply to audience ${doc.audience}; must be not_applicable`);

    // misfit: no honest value. Left null, with a note, never forced.
    if (c.value === null) {
      if (!c.misfit_note || !String(c.misfit_note).trim()) err(`${id}: value null needs a misfit_note saying what the document says that no value carries`);
      if (!c.evidence_quote) err(`${id}: a misfit still needs the quote that does not fit`);
      continue;
    }

    if (isState) {
      if (v.states && !v.states.includes(c.value)) err(`${id}: state ${c.value} is not allowed for this variable`);
      if (c.value === "none_exists" && !c.evidence_quote) err(`${id}: none_exists needs the quote that says so`);
    } else {
      // evidence is mandatory for any substantive value
      if (!c.evidence_quote || !String(c.evidence_quote).trim()) err(`${id}: a coded value needs an evidence_quote`);
      checkValue(v, c, id, err);
    }

    if (c.evidence_quote) {
      const snap = snapshots[c.doc_id];
      if (snap == null) warn(`${id}: no archived snapshot for ${c.doc_id}, quote not verified`);
      else if (!squash(snap).includes(squash(c.evidence_quote))) err(`${id}: evidence_quote does not occur in the archived snapshot`);
    }
  }

  // --- gates: a gate that rules a dependent out forces not_applicable ------
  for (const [docId, rows] of byDoc) {
    for (const v of vars.values()) {
      if (!v.gate) continue;
      const gate = rows.get(v.gate.variable);
      const own = rows.get(v.id);
      if (gate && own && v.gate.if_in.includes(gate.value) && own.value !== "not_applicable") {
        err(`${docId}/${v.id}: gate ${v.gate.variable}=${gate.value} rules this out, so it must be not_applicable, found ${JSON.stringify(own.value)}`);
      }
    }
  }

  // --- completeness: report gaps, per variable, never silently -----------
  const gaps = {};
  for (const v of vars.values()) {
    const g = (gaps[v.id] = { coded: 0, none_exists: 0, not_stated: 0, not_applicable: 0, misfit: 0, uncoded: 0 });
    for (const d of docs.values()) {
      const row = byDoc.get(d.doc_id)?.get(v.id);
      if (!row) g.uncoded++;
      else if (row.value === null) g.misfit++;
      else if (states.includes(row.value)) g[row.value]++;
      else g.coded++;
    }
    if (g.misfit) warn(`${v.id}: ${g.misfit} misfit(s), the vocabulary needs revising`);
  }
  return { errors, warnings, gaps };
}

function checkValue(v, c, id, err) {
  const ids = (v.values || []).map((x) => x.id);
  switch (v.type) {
    case "enum":
    case "ordinal":
      if (!ids.includes(c.value)) err(`${id}: ${JSON.stringify(c.value)} is not one of ${ids.join("|")}`);
      break;
    case "multi":
      if (!Array.isArray(c.value) || c.value.length === 0) { err(`${id}: multi variable needs a non-empty array`); break; }
      for (const x of c.value) if (!ids.includes(x)) err(`${id}: ${JSON.stringify(x)} is not one of ${ids.join("|")}`);
      if (new Set(c.value).size !== c.value.length) err(`${id}: duplicate values in list`);
      break;
    case "boolean":
      if (typeof c.value !== "boolean") err(`${id}: expected true or false, got ${JSON.stringify(c.value)}`);
      break;
    case "integer":
    case "number":
      if (typeof c.value !== "number" || !Number.isFinite(c.value) || (v.type === "integer" && !Number.isInteger(c.value))) err(`${id}: expected a ${v.type}, got ${JSON.stringify(c.value)}`);
      // a number with no account of what it counted cannot be compared
      for (const f of ["unit", "counted", "basis"]) if (!c[f]) err(`${id}: numeric value needs ${f}`);
      if (typeof c.value === "number" && v.min != null && c.value < v.min) err(`${id}: ${c.value} below min ${v.min}`);
      if (typeof c.value === "number" && v.max != null && c.value > v.max) err(`${id}: ${c.value} above max ${v.max}`);
      break;
    case "date":
      if (typeof c.value !== "string" || !ISO.test(c.value)) err(`${id}: expected an ISO date, got ${JSON.stringify(c.value)}`);
      break;
    default:
      err(`${id}: variable has unknown type ${v.type}`);
  }
}

// Codebook self-check: catches a malformed vocabulary before anything is coded against it.
function checkCodebook(cb) {
  const errors = [];
  const ids = new Set();
  const byId = new Map(cb.variables.map((v) => [v.id, v]));
  for (const v of cb.variables) {
    if (ids.has(v.id)) errors.push(`${v.id}: duplicate variable id`);
    ids.add(v.id);
    if (["enum", "ordinal", "multi"].includes(v.type)) {
      if (!v.values?.length) errors.push(`${v.id}: needs values`);
      for (const x of v.values || []) {
        if (!x.id || !x.gloss) errors.push(`${v.id}: value ${x.id} needs a gloss (the decision rule)`);
        if (cb.states[x.id]) errors.push(`${v.id}: value id ${x.id} collides with a reserved state`);
      }
    }
    if (v.grain == null) errors.push(`${v.id}: grain must be declared ("document" or "list")`);
    if (v.gate && !byId.has(v.gate.variable)) errors.push(`${v.id}: gate refers to unknown variable ${v.gate.variable}`);
  }
  return errors;
}

function load(dir, codebookPath) {
  const read = (f, d) => (fs.existsSync(path.join(dir, f)) ? JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) : d);
  const snapDir = path.join(dir, "snapshots");
  const snapshots = {};
  if (fs.existsSync(snapDir)) for (const f of fs.readdirSync(snapDir)) if (f.endsWith(".txt")) snapshots[f.slice(0, -4)] = fs.readFileSync(path.join(snapDir, f), "utf8");
  return {
    institutions: read("institutions.json", []),
    documents: read("documents.json", []),
    codes: read("codes.json", []),
    codebook: JSON.parse(fs.readFileSync(codebookPath, "utf8")),
    snapshots,
  };
}

module.exports = { validate, checkCodebook };

if (require.main === module) {
  const dir = process.argv[2] || path.join(__dirname, "..", "data", "policy");
  const cbPath = process.argv[3] || path.join(__dirname, "codebook.json");
  const data = load(dir, cbPath);
  const cbErrors = checkCodebook(data.codebook);
  const { errors, warnings, gaps } = validate(data);
  for (const w of warnings) console.log("warn:", w);
  for (const [k, g] of Object.entries(gaps)) console.log(`gaps ${k}:`, JSON.stringify(g));
  const all = [...cbErrors.map((e) => "codebook: " + e), ...errors];
  for (const e of all) console.error("ERROR:", e);
  console.log(`${data.documents.length} documents, ${data.codes.length} codes, ${all.length} errors, ${warnings.length} warnings`);
  process.exit(all.length ? 1 : 0);
}
