// Builds index.html (standalone, data embedded) from data/policy/codes.json etc. Run: node data/policy/run1/preview/build.js
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..", ".."); const rd = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));
const codebook = rd("../../policy/codebook.json"), codes = rd("codes.json"), docs = rd("documents.json"), insts = rd("institutions.json");
const sample = rd("run1/sample.json"), outcomes = rd("run1/outcomes.json");
const man = [...rd("trial/manifest.json"), ...rd("run1/archive/manifest.json")]; const last = new Map(man.map((m) => [m.doc_id, m]));
const REG = { "GB-ENG": "England", "GB-SCT": "Scotland", "GB-WLS": "Wales", "GB-NIR": "Northern Ireland", IE: "Ireland", "IE-L": "Ireland" };
const codedIds = new Set(codes.map((r) => r.doc_id));
const hum = (s) => String(s).replace(/_/g, " ");
const vars = codebook.variables.map((v) => ({ id: v.id, label: v.label, q: v.question, group: v.group, type: v.type, vals: Object.fromEntries((v.values || []).map((x) => [x.id, x.gloss])) }));
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
const html = fs.readFileSync(path.join(__dirname, "template.html"), "utf8").replace("__DATA__", JSON.stringify({ vars, docs: D, cov, version: codebook.version }).replace(/</g, "\\u003c"));
fs.writeFileSync(path.join(__dirname, "index.html"), html);
console.log("docs", D.length, "coverage", cov.reduce((a, c) => ((a[c.st] = (a[c.st] || 0) + 1), a), {}), "bytes", html.length);
