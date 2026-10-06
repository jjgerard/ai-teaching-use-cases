// Builds index.html (standalone, data embedded) from data/policy/codes.json etc. Run: node data/policy/run1/preview/build.js
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..", ".."); const rd = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));
const codebook = rd("../../policy/codebook.json"), codes = rd("codes.json"), docs = rd("documents.json"), insts = rd("institutions.json");
const sample = rd("run1/sample.json"), outcomes = rd("run1/outcomes.json"), outcomes2 = rd("run1/outcomes-t2.json");
const man = [...rd("trial/manifest.json"), ...rd("run1/archive/manifest.json")]; const last = new Map(man.map((m) => [m.doc_id, m]));
const REG = { "GB-ENG": "England", "GB-SCT": "Scotland", "GB-WLS": "Wales", "GB-NIR": "Northern Ireland", IE: "Ireland", "IE-L": "Ireland" };
const codedIds = new Set(codes.map((r) => r.doc_id));
const hum = (s) => String(s).replace(/_/g, " ");
const DROPVARS = new Set(["uses", "disclosure"]); const DROPIDS = new Set(["default_when_silent", "default_when_silent_supervised", "default_when_silent_unsupervised", "detector_stance", "misconduct_framed_as", "sanctions_stated", "oral_verification", "disclosure_obligation"]);
const vars = codebook.variables.filter((v) => !DROPVARS.has(v.group) && !DROPIDS.has(v.id)).map((v) => ({ id: v.id, label: v.label, q: v.question, group: v.group, type: v.type, vals: Object.fromEntries((v.values || []).map((x) => [x.id, x.gloss])) }));
const STATES = ["not_stated", "not_applicable"];
const D = [];
for (const d of docs.filter((x) => codedIds.has(x.doc_id))) {
  const inst = insts.find((i) => i.institution_id === d.institution_id);
  const cells = {};
  for (const r of codes.filter((x) => x.doc_id === d.doc_id && !x.audience_scope)) {
    if (STATES.includes(r.value)) cells[r.variable_id] = { s: r.value === "not_stated" ? "ns" : "na" };
    else if (r.value === null) cells[r.variable_id] = { s: "mf", n: r.misfit_note, q: r.evidence_quote };
    else if (r.value === "none_exists") cells[r.variable_id] = { s: "ne", q: r.evidence_quote };
    else { const vs = [].concat(r.value); cells[r.variable_id] = { s: "v", v: vs, q: vs.map((x) => (r.evidence_quotes && r.evidence_quotes[x]) || r.evidence_quote || null) }; }
  }
  D.push({ id: d.doc_id, name: inst.name, region: REG[inst.region] || inst.region, url: d.url, words: d.word_count, audience: [].concat(d.audience), domains: d.domains, fmt: d.format, retrieved: d.retrieved, pub: d.published || null, upd: d.last_updated || null, cells });
}
D.sort((a, b) => a.region.localeCompare(b.region) || a.name.localeCompare(b.name));
// coverage of tier 1
const nf = new Set(outcomes.filter((o) => o.outcome === "not_found" || o.outcome === "unresolved").map((o) => o.name));
const cov = sample.filter((s) => s.tier === 1).map((s) => {
  const m = last.get(s.doc_id); let st;
  if (codedIds.has(s.doc_id)) st = "coded"; else if (nf.has(s.name)) st = "none"; else if (s.name === "Ravensbourne University London") st = "deferred"; else st = "fetch";
  return { name: s.name, region: s.region, st };
});
require("child_process").execFileSync("node", [path.join(__dirname, "patterns.js")], { stdio: "ignore" });
const patterns = JSON.parse(fs.readFileSync(path.join(__dirname, "patterns.json")));
const PDIRS = [...fs.readdirSync(path.join(root, "run1", "points2")).filter((d) => /^q\d+$/.test(d)).map((d) => path.join(root, "run1", "points2", d)), ...fs.readdirSync(path.join(root, "run1", "points")).filter((d) => /^b\d+$/.test(d)).map((d) => path.join(root, "run1", "points", d)), ...fs.readdirSync(path.join(root, "run1", "points", "pilot")).map((d) => path.join(root, "run1", "points", "pilot", d))];
require("child_process").execFileSync("node", [path.join(root, "..", "..", "policy", "points.js"), "merge", ...PDIRS, "--out", path.join(root, "points.json")], { stdio: "inherit" });
const points = rd("points.json"); const noPts = {};
for (const d of PDIRS) for (const f of fs.readdirSync(d).filter((x) => x.endsWith(".json"))) { const j = JSON.parse(fs.readFileSync(path.join(d, f))); if (j.no_points_reason) noPts[j.doc_id] = j.no_points_reason; }
const pdocIds = [...new Set([...points.map((p) => p.doc_id), ...Object.keys(noPts)])];
const PDOCS = pdocIds.map((id) => { const d = docs.find((x) => x.doc_id === id); const inst = insts.find((i) => i.institution_id === d.institution_id); return { id, name: inst.name, region: REG[inst.region] || inst.region, url: d.url, words: d.word_count, retrieved: d.retrieved, none: noPts[id] || null }; }).sort((a, b) => a.name.localeCompare(b.name));
const KINDS = rd("run1/archive3/kinds.json"); const FIRST = (d) => (KINDS[d] ? KINDS[d].first_doc_id : d);
// institutions that have schema coding but were not read for guidance points still need a name and region
{ const have = new Set(PDOCS.map((p) => p.id)); const more = new Set(); for (const f of ["uses.json", "support.json", "misconduct.json", "toolsdata.json"]) for (const r of rd(f)) { const F = FIRST(r.doc_id); if (!have.has(F)) more.add(F); }
  for (const id of more) { const d = docs.find((x) => x.doc_id === id); if (!d) continue; const inst = insts.find((i) => i.institution_id === d.institution_id); PDOCS.push({ id, name: inst.name, region: REG[inst.region] || inst.region, url: d.url, words: d.word_count, retrieved: d.retrieved, none: "not read for guidance points" }); } PDOCS.sort((a, b) => a.name.localeCompare(b.name)); }
const SDOCS = [...new Set([...rd("uses.json"), ...rd("support.json"), ...rd("misconduct.json"), ...(fs.existsSync(path.join(__dirname, "..", "..", "toolsdata.json")) ? rd("toolsdata.json") : [])].map((r) => FIRST(r.doc_id)))].filter((id) => PDOCS.some((p) => p.id === id));
const covAll = sample.map((s) => { const m = last.get(s.doc_id) || man.find((x) => x.doc_id === s.doc_id); let st; if (pdocIds.includes(s.doc_id)) st = "coded"; else if (nf.has(s.name) || (outcomes2.find((o) => o.name === s.name) || {}).outcome === "not_found") st = "none"; else if (s.name === "Ravensbourne University London" || /hartpury|plymouth-marjon|health-sciences/.test(s.doc_id)) st = "deferred"; else st = "fetch"; return { name: s.name, region: s.region, st }; });
// ---- statement-type trends (full set, vocabulary v2) ----
const TYPES0 = rd("run1/claims/statement-types.v2.json").types;
const CL = rd("claims.json");

const { hasAiLink, isSecondDoc } = require("../ailink.js");
const THIN = 8;
const GENERAL = new Set(TYPES0.filter((t) => t.general_advice).map((t) => t.id));
const cdocs = [...new Set(CL.map((r) => FIRST(r.doc_id)))];
const perDoc = Object.fromEntries(cdocs.map((d) => [d, { n: 0, types: new Set() }]));
for (const r of CL) { const o = perDoc[FIRST(r.doc_id)]; o.n++; for (const t of [r.claim, r.claim2]) if (t && t !== "unclassified") o.types.add(t); }
const lc = [0]; for (let i = 1; i < 400; i++) lc[i] = lc[i - 1] + Math.log(i);
const lch = (n, k) => lc[n] - lc[k] - lc[n - k];
function fisher(a, b, c, d) { const n = a + b + c + d, r1 = a + b, c1 = a + c; const p0 = Math.exp(lch(r1, a) + lch(n - r1, c1 - a) - lch(n, c1)); let p = 0; for (let x = Math.max(0, c1 - (n - r1)); x <= Math.min(r1, c1); x++) { const px = Math.exp(lch(r1, x) + lch(n - r1, c1 - x) - lch(n, c1)); if (px <= p0 * (1 + 1e-9)) p += px; } return Math.min(1, p); }
function pairsFor(ids, minSupport, TY = (d) => perDoc[d].types) {
  const sup = {}; for (const d of ids) for (const t of TY(d)) sup[t] = (sup[t] || 0) + 1;
  const ts = Object.keys(sup).filter((t) => !GENERAL.has(t) && sup[t] >= minSupport && sup[t] <= ids.length - minSupport); const tests = [];
  for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < ts.length; j++) {
    const A = ts[i], B = ts[j]; let a = 0, b = 0, c = 0; for (const d of ids) { const x = TY(d).has(A), y = TY(d).has(B); if (x && y) a++; else if (x) b++; else if (y) c++; }
    const dd = ids.length - a - b - c; tests.push({ A, B, a, b, c, d: dd, p: fisher(a, b, c, dd), lift: +(a / (a + b) / ((a + c) / ids.length)).toFixed(2) });
  }
  tests.sort((x, y) => x.p - y.p); const m = tests.length; let prev = 1; for (let i = m - 1; i >= 0; i--) { prev = Math.min(prev, tests[i].p * m / (i + 1)); tests[i].q = prev; }
  return { docs: ids.length, tests_run: m, top: tests.slice(0, 12) };
}
const PR = rd("presence.json"); const auditFound = {}; for (const x of PR.found) { if (isSecondDoc(x.doc_id) && !hasAiLink(x.quote)) continue; (auditFound[FIRST(x.doc_id)] = auditFound[FIRST(x.doc_id)] || new Set()).add(x.type || x.type_id); }
const AUDIT = Object.fromEntries(Object.entries(auditFound).map(([d, s]) => [d, [...s]]));
const augT = (d) => new Set([...perDoc[d].types, ...(auditFound[d] || [])]);

// region contrasts (descriptive; Fisher + Benjamini-Hochberg over all contrasts)
const docRegion = {}; for (const d of rd("run1/sample.json")) if (d.doc_id) docRegion[d.doc_id] = d.region;
const unionT = (d) => augT(d);
function contrast(name, gA, gB, minN) {
  const A = cdocs.filter((d) => gA.includes(docRegion[d])), B = cdocs.filter((d) => gB.includes(docRegion[d])); const out = [];
  for (const t of TYPES0) { if (GENERAL.has(t.id)) continue; const a = A.filter((d) => unionT(d).has(t.id)).length, b = B.filter((d) => unionT(d).has(t.id)).length; if (a + b < minN) continue; out.push({ id: t.id, a, na: A.length, b, nb: B.length, p: fisher(a, A.length - a, b, B.length - b) }); }
  return { name, na: A.length, nb: B.length, rows: out };
}
const RC = [contrast("Ireland vs Great Britain", ["Ireland"], ["England", "Scotland", "Wales", "Northern Ireland"], 6), contrast("Scotland vs England", ["Scotland"], ["England"], 6), contrast("Wales vs England", ["Wales"], ["England"], 6)];
{ const all = RC.flatMap((c) => c.rows.map((r) => r)).sort((x, y) => x.p - y.p); const m = all.length; let prev = 1; for (let i = m - 1; i >= 0; i--) { prev = Math.min(prev, all[i].p * m / (i + 1)); all[i].q = prev; } }
const REGSHARE = {}; for (const t of TYPES0) { REGSHARE[t.id] = {}; for (const r of ["England", "Scotland", "Wales", "Northern Ireland", "Ireland"]) { const ds = cdocs.filter((d) => docRegion[d] === r); REGSHARE[t.id][r] = [ds.filter((d) => unionT(d).has(t.id)).length, ds.length]; } }

// what a second document adds, for institutions that have one
const secondIds = Object.keys(KINDS); const docTypes = (d, aiOnly) => { const s = new Set(); for (const r of CL) if (r.doc_id === d) for (const t of [r.claim, r.claim2]) if (t && t !== "unclassified") s.add(t); for (const x of PR.found) if (x.doc_id === d && (!aiOnly || hasAiLink(x.quote))) s.add(x.type || x.type_id); return s; };
const SEC = { n: secondIds.length, kinds: {}, rows: [], avg: {} }; const agg = {}; let sumF = 0, sumAdd = 0, sumGen = 0;
for (const S of secondIds) { const F = KINDS[S].first_doc_id; SEC.kinds[KINDS[S].kind] = (SEC.kinds[KINDS[S].kind] || 0) + 1; const sf = docTypes(F, false), ss = docTypes(S, true), sa = docTypes(S, false); sumF += sf.size; const added = [...ss].filter((t) => !sf.has(t)); sumAdd += added.length; const gen = [...sa].filter((t) => !sf.has(t) && !ss.has(t)); sumGen += gen.length; for (const t of sf) (agg[t] ??= { first: 0, added: 0, general: 0 }).first++; for (const t of added) (agg[t] ??= { first: 0, added: 0, general: 0 }).added++; for (const t of gen) (agg[t] ??= { first: 0, added: 0, general: 0 }).general++; }
SEC.rows = Object.entries(agg).map(([id, v]) => ({ id, ...v })).filter((r) => (r.added + r.general) > 0).sort((a, b) => (b.added + b.general) - (a.added + a.general)).slice(0, 14);
SEC.avg = { first: +(sumF / secondIds.length).toFixed(1), added: +(sumAdd / secondIds.length).toFixed(1), general: +(sumGen / secondIds.length).toFixed(1) };

// kinds of training, guidance or support offered (support.json)
const SUPPORT = rd("support.json"); const SFORMS = rd("support-forms.json"); const RANKR = { mandatory: 5, advised: 4, planned: 3, optional: 2, unspecified: 1 };
const supByForm = {}; const mand = []; const supRows = {};
for (const r of SUPPORT) { const F = FIRST(r.doc_id); const o = (supByForm[r.form] ??= {}); const c = (o[F] ??= { req: r.requirement, ai: false }); if (RANKR[r.requirement] > RANKR[c.req]) c.req = r.requirement; if (hasAiLink(r.quote) || hasAiLink(r.name || "")) c.ai = true;
  { const L = (supRows[r.form] ??= []); const e = L.find((x) => x.i === F); const q = r.quote.length > 220 ? r.quote.slice(0, 217) + "..." : r.quote; if (!e) L.push({ i: F, n: r.name || "", q, rq: r.requirement, s: isSecondDoc(r.doc_id) }); else if (RANKR[r.requirement] > RANKR[e.rq]) Object.assign(e, { n: r.name || "", q, rq: r.requirement, s: isSecondDoc(r.doc_id) }); }
  if (r.requirement === "mandatory") mand.push({ d: F, form: r.form, name: r.name, q: r.quote.length > 220 ? r.quote.slice(0, 217) + "..." : r.quote, second: isSecondDoc(r.doc_id) }); }
const SUP = { forms: SFORMS.forms.map((f) => { const o = supByForm[f.id] || {}; const ids = Object.keys(o); const req = {}; for (const i of ids) req[o[i].req] = (req[o[i].req] || 0) + 1; return { id: f.id, label: f.label, def: f.definition, n: ids.length, nAi: ids.filter((i) => o[i].ai).length, req, rows: supRows[f.id] || [] }; }).sort((a, b) => b.n - a.n), mandatory: mand, any: new Set(SUPPORT.map((r) => FIRST(r.doc_id))).size };

// uses and acknowledgement (uses.json), aggregated by institution
const USESCH = rd("uses-schema.json"); const UDOCS = rd("uses.json");
const URows = []; const UAck = {}; const ACKQ = {};
const aq = (cat, v, i, q) => { if (!v || !q) return; const L = (ACKQ[cat + "|" + v] ??= []); if (!L.some((x) => x.i === i)) L.push({ i, q: q.length > 240 ? q.slice(0, 237) + "..." : q }); };
for (const d of UDOCS) { const i = FIRST(d.doc_id); for (const u of d.uses) if (u.ai_named !== false) URows.push({ i, d: d.doc_id, u: u.use, c: u.context, s: u.stance, a: u.acknowledge, k: u.conditions || [], t: u.tier || null, q: u.quote.length > 240 ? u.quote.slice(0, 237) + "..." : u.quote });
  const a = d.acknowledgement || {}; const o = (UAck[i] ??= { duty: null, def: null, decided: [], contents: [], location: [], records: null, referencing: null, consequence: null, exempt: [] });
  if (a.duty) aq("duty", a.duty.value, i, a.duty.quote); if (d.default_when_silent) aq("def", d.default_when_silent.value, i, d.default_when_silent.quote); for (const x of d.decided_by || []) aq("decided", x.value, i, x.quote); for (const x of a.contents || []) aq("contents", x.value, i, x.quote); for (const x of a.location || []) aq("location", x.value, i, x.quote); for (const k of ["referencing", "records", "consequence"]) if (a[k]) aq(k, a[k].value, i, a[k].quote); for (const x of a.exempt || []) aq("exempt", x.what, i, x.quote);
  const dr = { always_required: 4, conditional: 3, recommended: 2, not_required: 1 };
  if (a.duty && (!o.duty || dr[a.duty.value] > dr[o.duty.v])) o.duty = { v: a.duty.value, q: a.duty.quote };
  if (d.default_when_silent && !o.def) o.def = { v: d.default_when_silent.value, q: d.default_when_silent.quote };
  for (const x of d.decided_by || []) if (!o.decided.includes(x.value)) o.decided.push(x.value);
  for (const x of a.contents || []) if (!o.contents.includes(x.value)) o.contents.push(x.value);
  for (const x of a.location || []) if (!o.location.includes(x.value)) o.location.push(x.value);
  if (a.records && !o.records) o.records = a.records.value; if (a.referencing && !o.referencing) o.referencing = a.referencing.value; if (a.consequence && !o.consequence) o.consequence = a.consequence.value;
  for (const x of a.exempt || []) if (!o.exempt.includes(x.what)) o.exempt.push(x.what); }
const UTIL = { uses: USESCH.uses.map((u) => ({ id: u.id, label: u.label, def: u.definition })), contexts: USESCH.contexts, stances: Object.keys(USESCH.stances), rows: URows, ack: UAck, ackq: ACKQ, schema: { duty: USESCH.acknowledgement.duty, def: USESCH.default_when_silent, decided: USESCH.decided_by, location: USESCH.acknowledgement.location, contents: USESCH.acknowledgement.contents, records: USESCH.acknowledgement.records, referencing: USESCH.acknowledgement.referencing, consequence: USESCH.acknowledgement.consequence } };
const richIds = cdocs.filter((d) => perDoc[d].n >= THIN);

// academic misconduct (misconduct.json), aggregated by institution
const MSCH = rd("misconduct-schema.json"); const MDOCS = fs.existsSync(path.join(__dirname, "..", "..", "misconduct.json")) ? rd("misconduct.json") : [];
const MRows = []; const MScope = {}; const msr = { ai_specific: 3, general_misconduct: 2, none: 1 };
const mq = (s) => (s.length > 240 ? s.slice(0, 237) + "..." : s);
for (const d of MDOCS) { const i = FIRST(d.doc_id); if (!MScope[i] || msr[d.scope] > msr[MScope[i]]) MScope[i] = d.scope;
  for (const [g, f] of [["offences", "offences"], ["liability", "liability"], ["process", "process"], ["outcomes", "outcomes"]]) for (const x of d[f] || []) MRows.push({ i, d: d.doc_id, g, v: x.value, ai: x.ai_named, sc: d.scope, q: mq(x.quote) });
  for (const x of d.detection || []) MRows.push({ i, d: d.doc_id, g: "detection", v: x.method, st: x.stance, ai: x.ai_named, sc: d.scope, q: mq(x.quote) }); }
const MIS = { rows: MRows, scope: MScope, schema: { offences: MSCH.offences, liability: MSCH.liability, process: MSCH.process, outcomes: MSCH.outcomes, methods: MSCH.detection.methods, stances: MSCH.detection.stances, scope: MSCH.scope }, ndocs: MDOCS.length };

// tools and data (toolsdata.json), aggregated by institution
const TSCH = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "toolsdata-schema.json"), "utf8")); const TDOCS = fs.existsSync(path.join(__dirname, "..", "..", "toolsdata.json")) ? rd("toolsdata.json") : [];
const TRows = [];
for (const d of TDOCS) { const i = FIRST(d.doc_id);
  for (const x of d.tools || []) TRows.push({ i, d: d.doc_id, g: "tools", v: x.tool_class, st: x.stance, a: x.audience, nm: x.name || "", k: x.conditions || [], ai: x.ai_named, q: mq(x.quote) });
  for (const x of d.data || []) TRows.push({ i, d: d.doc_id, g: "data", v: x.data_type, st: x.stance, a: x.audience, k: x.conditions || [], ai: x.ai_named, q: mq(x.quote) });
  for (const x of d.safeguards || []) TRows.push({ i, d: d.doc_id, g: "safeguards", v: x.value, a: x.audience, ai: x.ai_named, q: mq(x.quote) });
  for (const x of d.legal || []) TRows.push({ i, d: d.doc_id, g: "legal", v: x.value, a: x.audience, ai: x.ai_named, q: mq(x.quote) }); }
const TOOLS = { rows: TRows, ndocs: TDOCS.length, schema: { tools: TSCH.tool_classes, data: TSCH.data_types, safeguards: TSCH.safeguards, legal: TSCH.legal, toolStances: TSCH.tool_stances, dataStances: TSCH.data_stances, conditions: TSCH.conditions } };

// CSV exports, one per schema (also written to data/policy/csv/)
const csvEsc = (v) => { const s = Array.isArray(v) ? v.join("; ") : v == null ? "" : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const toCsv = (cols, rows) => [cols.join(","), ...rows.map((r) => cols.map((c) => csvEsc(r[c])).join(","))].join("\n") + "\n";
const instOfDoc = (id) => { const d = docs.find((x) => x.doc_id === id); const inst = d && insts.find((i) => i.institution_id === d.institution_id); return { institution_id: d ? d.institution_id : "", institution: inst ? inst.name : "", region: inst ? (REG[inst.region] || inst.region) : "", doc_id: id }; };
const CSVS = {};
CSVS.uses = toCsv(["institution_id", "institution", "region", "doc_id", "use", "context", "tier", "stance", "acknowledge", "conditions", "quote_names_ai", "quote"], UDOCS.flatMap((d) => d.uses.map((u) => ({ ...instOfDoc(d.doc_id), use: u.use, context: u.context, tier: u.tier || "", stance: u.stance, acknowledge: u.acknowledge, conditions: u.conditions || [], quote_names_ai: u.ai_named !== false, quote: u.quote }))));
CSVS.acknowledgement = toCsv(["institution_id", "institution", "region", "doc_id", "field", "value", "quote"], UDOCS.flatMap((d) => { const a = d.acknowledgement || {}, base = instOfDoc(d.doc_id), o = []; const add = (field, value, quote) => { if (value) o.push({ ...base, field, value, quote }); };
  if (a.duty) add("duty", a.duty.value, a.duty.quote); if (d.default_when_silent) add("default_when_silent", d.default_when_silent.value, d.default_when_silent.quote); for (const x of d.decided_by || []) add("decided_by", x.value, x.quote); for (const x of a.contents || []) add("contents", x.value, x.quote); for (const x of a.location || []) add("location", x.value, x.quote); for (const k of ["referencing", "records", "consequence"]) if (a[k]) add(k, a[k].value, a[k].quote); for (const x of a.exempt || []) add("exempt", x.what, x.quote); return o; }));
CSVS.support = toCsv(["institution_id", "institution", "region", "doc_id", "form", "name", "requirement", "quote_names_ai", "second_document", "quote"], SUPPORT.map((r) => ({ ...instOfDoc(r.doc_id), form: r.form, name: r.name || "", requirement: r.requirement, quote_names_ai: hasAiLink(r.quote) || hasAiLink(r.name || ""), second_document: isSecondDoc(r.doc_id), quote: r.quote })));
CSVS.misconduct = toCsv(["institution_id", "institution", "region", "doc_id", "scope", "dimension", "value", "stance", "quote_names_ai", "quote"], MDOCS.flatMap((d) => { const base = instOfDoc(d.doc_id), o = []; for (const f of ["offences", "liability", "process", "outcomes"]) for (const x of d[f] || []) o.push({ ...base, scope: d.scope, dimension: f, value: x.value, stance: "", quote_names_ai: x.ai_named, quote: x.quote }); for (const x of d.detection || []) o.push({ ...base, scope: d.scope, dimension: "detection", value: x.method, stance: x.stance, quote_names_ai: x.ai_named, quote: x.quote }); return o; }));
CSVS.toolsdata = toCsv(["institution_id", "institution", "region", "doc_id", "dimension", "value", "stance", "audience", "tool_name", "conditions", "quote_names_ai", "quote"], TDOCS.flatMap((d) => { const base = instOfDoc(d.doc_id), o = []; for (const x of d.tools || []) o.push({ ...base, dimension: "tools", value: x.tool_class, stance: x.stance, audience: x.audience, tool_name: x.name || "", conditions: x.conditions || [], quote_names_ai: x.ai_named, quote: x.quote }); for (const x of d.data || []) o.push({ ...base, dimension: "data", value: x.data_type, stance: x.stance, audience: x.audience, tool_name: "", conditions: x.conditions || [], quote_names_ai: x.ai_named, quote: x.quote }); for (const f of ["safeguards", "legal"]) for (const x of d[f] || []) o.push({ ...base, dimension: f, value: x.value, stance: "", audience: x.audience, tool_name: "", conditions: [], quote_names_ai: x.ai_named, quote: x.quote }); return o; }));
{ const od = path.join(__dirname, "..", "..", "csv"); fs.mkdirSync(od, { recursive: true }); for (const [k, v] of Object.entries(CSVS)) fs.writeFileSync(path.join(od, k + ".csv"), v); }
const TRENDS = { types: TYPES0.map((t) => ({ id: t.id, label: t.label, group: t.group, def: t.definition })), rows: CL.map((r) => ({ d: FIRST(r.doc_id), q: r.doc_id, n: r.point_id, c: r.claim, c2: r.claim2, f: r.fit })), docs: cdocs, sdocs: SDOCS, thin: THIN, nper: Object.fromEntries(cdocs.map((d) => [d, perDoc[d].n])), minsup: 8, agreement: rd("run1/claims/agreement.json"), pairs: { all: pairsFor(cdocs, 8), rich: pairsFor(richIds, 8) }, pairsAud: { all: pairsFor(cdocs, 8, augT), rich: pairsFor(richIds, 8, augT) }, vocab: "2", usesData: UTIL, misconduct: MIS, tools: TOOLS, csv: CSVS, support: SUP, second: SEC, regionContrasts: RC, regionShare: REGSHARE, general: [...GENERAL], audit: AUDIT, fitCounts: CL.reduce((o, r) => ((o[r.fit] = (o[r.fit] || 0) + 1), o), {}) };

const html = fs.readFileSync(path.join(__dirname, "template.html"), "utf8").replace("__DATA__", JSON.stringify({ vars, docs: D, cov: covAll, patterns, version: codebook.version, points: points.slice().sort((a, b) => (PDOCS.findIndex((x) => x.id === a.doc_id) - PDOCS.findIndex((x) => x.id === b.doc_id)) || a.point_id.localeCompare(b.point_id)).map((p) => ({ d: p.doc_id, n: p.point_id, q: p.quote, a: p.anchor, ad: p.addressee, f: p.force, t: p.topic, s: p.specific, g: p.gist })), pdocs: PDOCS, trends: TRENDS }).replace(/</g, "\\u003c"));
fs.writeFileSync(path.join(__dirname, "index.html"), html);
// the same page as a tab of the catalog site (public/ai-guidance-analysis.html)
{ const navCss = `<style>.tab-nav{background:#030c18;border-bottom:3px solid #c9ced4;font-family:"Segoe UI","Open Sans",-apple-system,Helvetica,Arial,sans-serif}.tab-nav-inner{max-width:1180px;margin:0 auto;display:flex;align-items:center;gap:.15rem;flex-wrap:wrap;padding:0 1.5rem}.tab-nav-links{display:flex;gap:.15rem;flex-wrap:wrap}.tab-link{font-weight:700;font-size:.76rem;letter-spacing:.02em;text-decoration:none;color:#9fb3c8;padding:.7rem .9rem;border-bottom:3px solid transparent;margin-bottom:-3px;white-space:nowrap}.tab-link:hover{color:#fff}.tab-link.active{color:#fff;border-bottom-color:#2a78d6}.tab-nav-toggle{display:none;flex-direction:column;justify-content:center;align-items:center;gap:4px;width:2.3rem;height:2.3rem;margin:.5rem 0;padding:0;background:none;border:none;cursor:pointer}.tab-nav-toggle-bar{display:block;width:19px;height:2px;background:#9fb3c8;border-radius:1px}.tab-nav-toggle:hover .tab-nav-toggle-bar{background:#fff}@media(max-width:640px){.tab-nav-toggle{display:flex}.tab-nav-links{display:none;flex-direction:column;gap:0;flex-basis:100%;padding-bottom:.4rem}.tab-nav.open .tab-nav-links{display:flex}.tab-link{padding:.8rem .3rem;margin-bottom:0;border-bottom:1px solid rgba(255,255,255,.1);border-left:3px solid transparent}.tab-link.active{border-bottom-color:rgba(255,255,255,.1);border-left-color:#2a78d6}}</style>`;
  const nav = `<nav class="tab-nav" id="tabNav"><div class="tab-nav-inner"><button class="tab-nav-toggle" type="button" aria-expanded="false" aria-controls="tabNavLinks" aria-label="Toggle navigation menu"><span class="tab-nav-toggle-bar"></span><span class="tab-nav-toggle-bar"></span><span class="tab-nav-toggle-bar"></span></button><div class="tab-nav-links" id="tabNavLinks"><a class="tab-link" href="/">Teaching Case Studies</a><a class="tab-link" href="/ai-for-research">Research Case Studies</a><a class="tab-link" href="/reducing-ai-use">Reducing AI (mis)use</a><a class="tab-link active" href="/ai-guidance-analysis">AI Guidance Analysis</a><a class="tab-link" href="/about">About</a></div></div></nav><script>(function(){var n=document.getElementById("tabNav"),t=n.querySelector(".tab-nav-toggle");t.addEventListener("click",function(){var o=n.classList.toggle("open");t.setAttribute("aria-expanded",o?"true":"false")})})();</script>`;
  const siteHtml = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="icon" href="/favicon.svg" type="image/svg+xml">' + navCss + '</head><body style="margin:0">' + nav + html + '</body></html>\n';
  const pub = path.join(__dirname, "..", "..", "..", "..", "public"); if (fs.existsSync(pub)) fs.writeFileSync(path.join(pub, "ai-guidance-analysis.html"), siteHtml); }
console.log("docs", D.length, "coverage", cov.reduce((a, c) => ((a[c.st] = (a[c.st] || 0) + 1), a), {}), "bytes", html.length);
