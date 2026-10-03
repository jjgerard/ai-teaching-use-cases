// Builds index.html (standalone, data embedded) from data/policy/codes.json etc. Run: node data/policy/run1/preview/build.js
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..", ".."); const rd = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));
const codebook = rd("../../policy/codebook.json"), codes = rd("codes.json"), docs = rd("documents.json"), insts = rd("institutions.json");
const sample = rd("run1/sample.json"), outcomes = rd("run1/outcomes.json"), outcomes2 = rd("run1/outcomes-t2.json");
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
require("child_process").execFileSync("node", [path.join(__dirname, "patterns.js")], { stdio: "ignore" });
const patterns = JSON.parse(fs.readFileSync(path.join(__dirname, "patterns.json")));
const PDIRS = [...fs.readdirSync(path.join(root, "run1", "points")).filter((d) => /^b\d+$/.test(d)).map((d) => path.join(root, "run1", "points", d)), ...fs.readdirSync(path.join(root, "run1", "points", "pilot")).map((d) => path.join(root, "run1", "points", "pilot", d))];
require("child_process").execFileSync("node", [path.join(root, "..", "..", "policy", "points.js"), "merge", ...PDIRS, "--out", path.join(root, "points.json")], { stdio: "inherit" });
const points = rd("points.json"); const noPts = {};
for (const d of PDIRS) for (const f of fs.readdirSync(d).filter((x) => x.endsWith(".json"))) { const j = JSON.parse(fs.readFileSync(path.join(d, f))); if (j.no_points_reason) noPts[j.doc_id] = j.no_points_reason; }
const pdocIds = [...new Set([...points.map((p) => p.doc_id), ...Object.keys(noPts)])];
const PDOCS = pdocIds.map((id) => { const d = docs.find((x) => x.doc_id === id); const inst = insts.find((i) => i.institution_id === d.institution_id); return { id, name: inst.name, region: REG[inst.region] || inst.region, url: d.url, words: d.word_count, retrieved: d.retrieved, none: noPts[id] || null }; }).sort((a, b) => a.name.localeCompare(b.name));
const covAll = sample.map((s) => { const m = last.get(s.doc_id) || man.find((x) => x.doc_id === s.doc_id); let st; if (pdocIds.includes(s.doc_id)) st = "coded"; else if (nf.has(s.name) || (outcomes2.find((o) => o.name === s.name) || {}).outcome === "not_found") st = "none"; else if (s.name === "Ravensbourne University London" || /hartpury|plymouth-marjon|health-sciences/.test(s.doc_id)) st = "deferred"; else st = "fetch"; return { name: s.name, region: s.region, st }; });
const html = fs.readFileSync(path.join(__dirname, "template.html"), "utf8").replace("__DATA__", JSON.stringify({ vars, docs: D, cov: covAll, patterns, version: codebook.version, points: points.slice().sort((a, b) => (PDOCS.findIndex((x) => x.id === a.doc_id) - PDOCS.findIndex((x) => x.id === b.doc_id)) || a.point_id.localeCompare(b.point_id)).map((p) => ({ d: p.doc_id, n: p.point_id, q: p.quote, a: p.anchor, ad: p.addressee, f: p.force, t: p.topic, s: p.specific, g: p.gist })), pdocs: PDOCS }).replace(/</g, "\\u003c"));
fs.writeFileSync(path.join(__dirname, "index.html"), html);
console.log("docs", D.length, "coverage", cov.reduce((a, c) => ((a[c.st] = (a[c.st] || 0) + 1), a), {}), "bytes", html.length);
