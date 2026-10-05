// One row per institution in the sample, one cell per statement type (v2): stated | borderline | not_in_document | no_document.
// "not_in_document" means a whole-document audit found no statement; it does not say what the institution does elsewhere.
const fs = require("fs"); const rd = (f) => JSON.parse(fs.readFileSync("data/policy/" + f, "utf8"));
const S = rd("run1/sample.json"), V = rd("run1/claims/statement-types.v2.json").types, C = rd("claims.json"), P = rd("presence.json");
const types = V.map((t) => t.id);
const { hasAiLink, isSecondDoc } = require("./ailink.js"); const KINDS = rd("run1/archive3/kinds.json"); const secondOf = {}; for (const [d, k] of Object.entries(KINDS)) secondOf[k.first_doc_id] = d;
const RANK = { stated: 3, general_procedure: 2, borderline: 1 };
const st = {}; const set = (d, t, v) => { (st[d] ??= {}); const o = st[d][t]; if (!o || RANK[v] > RANK[o]) st[d][t] = v; };
for (const r of C) for (const t of [r.claim, r.claim2]) if (t && t !== "unclassified") set(r.doc_id, t, "stated");
for (const x of P.found) set(x.doc_id, x.type, isSecondDoc(x.doc_id) && !hasAiLink(x.quote) ? "general_procedure" : "stated");
for (const x of P.unsure) set(x.doc_id, x.type, "borderline");
const words = (d) => { try { return fs.readFileSync("data/policy/snapshots/" + d + ".txt", "utf8").split(/\s+/).length; } catch { return 0; } };
const fetchList = fs.readFileSync("data/policy/run1/FOR-USER-FETCH.md", "utf8");
const o1 = rd("run1/outcomes.json"), o2 = rd("run1/outcomes-t2.json"); const oc = {}; for (const o of [...(o1.rows || o1), ...(o2.rows || o2)]) oc[o.name] = o.outcome;
const rows = S.map((s) => {
  const has = st[s.doc_id] !== undefined; let reason = null;
  if (!has) reason = fetchList.includes(s.doc_id) ? "document found but not archived (bot wall, script page or robots); waiting for local fetch" : oc[s.name] === "not_found" ? "no document found" : "no document audited (" + (oc[s.name] || s.status || "unknown") + ")";
  const sd = secondOf[s.doc_id]; const cells = {}; for (const t of types) { if (!has) { cells[t] = "no_document"; continue; } const a = st[s.doc_id][t], b = sd && st[sd] ? st[sd][t] : null; cells[t] = [a, b].filter(Boolean).sort((x, y) => RANK[y] - RANK[x])[0] || "not_in_document"; }
  return { institution: s.name, region: s.region, tier: s.tier, doc_id: has ? s.doc_id : null, doc_words: has ? words(s.doc_id) : null, second_doc: sd ? { doc_id: sd, kind: KINDS[sd].kind, words: words(sd) } : null, reason_no_document: reason, cells };
});
fs.writeFileSync("data/policy/matrix.json", JSON.stringify({ vocabulary: "2.0", states: { stated: "a verbatim quote in a document makes the statement (for second documents, only quotes that mention AI)", general_procedure: "only a second document, and only generic misconduct-procedure wording that does not mention AI", borderline: "a possible match the audit would not count", not_in_document: "the whole document was audited and no statement was found", no_document: "no document archived for this institution" }, types, rows }, null, 1));
const q = (s) => '"' + String(s ?? "").replace(/"/g, '""') + '"';
fs.writeFileSync("data/policy/matrix.csv", ["institution,region,tier,doc_id,doc_words,second_doc_id,second_doc_kind,reason_no_document," + types.join(",")].concat(rows.map((r) => [q(r.institution), r.region, r.tier, r.doc_id || "", r.doc_words ?? "", r.second_doc ? r.second_doc.doc_id : "", r.second_doc ? r.second_doc.kind : "", q(r.reason_no_document), ...types.map((t) => r.cells[t])].join(","))).join("\n") + "\n");
const withDoc = rows.filter((r) => r.doc_id); const by = {}; for (const r of rows) { const k = r.region + (r.doc_id ? "" : " (no doc)"); by[k] = (by[k] || 0) + 1; }
console.log("institutions", rows.length, "with document", withDoc.length, "types", types.length); console.log(by);
console.log("short docs (<500 words):", withDoc.filter((r) => r.doc_words < 500).length);
const reasons = {}; for (const r of rows.filter((r) => !r.doc_id)) reasons[r.reason_no_document] = (reasons[r.reason_no_document] || 0) + 1; console.log(reasons);
