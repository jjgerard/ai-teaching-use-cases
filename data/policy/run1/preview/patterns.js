// Descriptive frequency and co-occurrence over the coded documents. Exploratory only: one model, 47 documents, many tests.
// Co-occurrence is computed only over documents that address BOTH variables (a value coded for each), so shared silence
// (hub pages that say nothing about anything) cannot create a pattern. Fisher exact test, Benjamini-Hochberg across all tests run.
const fs = require("fs"), path = require("path"); const root = path.join(__dirname, "..", "..");
const rd = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));
const codes = rd("codes.json"), docs = rd("documents.json"), cb = rd("../../policy/codebook.json");
const ids = [...new Set(codes.map((r) => r.doc_id))];
const V = Object.fromEntries(cb.variables.map((v) => [v.id, v]));
const STATE = new Set(["not_stated", "not_applicable"]);
// cell(doc, var) -> array of values if addressed with a value, else null
const cell = {}; for (const r of codes) { if (r.audience_scope) continue; (cell[r.doc_id] = cell[r.doc_id] || {})[r.variable_id] = r; }
const vals = (d, v) => { const r = (cell[d] || {})[v]; if (!r || r.value === null || STATE.has(r.value) || r.value === "none_exists") return null; return [].concat(r.value); };
const isPointer = (d) => (vals(d, "instrument_force") || []).includes("pointer_page");
const logf = [0]; for (let i = 1; i < 400; i++) logf[i] = logf[i - 1] + Math.log(i);
const lc = (n, k) => logf[n] - logf[k] - logf[n - k];
function fisher(a, b, c, d) { // two-sided
  const n = a + b + c + d, r1 = a + b, c1 = a + c; const p0 = Math.exp(lc(r1, a) + lc(n - r1, c1 - a) - lc(n, c1)); let p = 0;
  for (let x = Math.max(0, c1 - (n - r1)); x <= Math.min(r1, c1); x++) { const px = Math.exp(lc(r1, x) + lc(n - r1, c1 - x) - lc(n, c1)); if (px <= p0 * (1 + 1e-9)) p += px; }
  return Math.min(1, p);
}
function analyse(subset, label) {
  // features
  const feats = []; for (const v of cb.variables) { if (!["enum", "ordinal", "multi", "boolean"].includes(v.type)) continue;
    const seen = new Set(); for (const d of subset) for (const x of vals(d, v.id) || []) seen.add(x);
    for (const x of seen) feats.push({ v: v.id, x, key: v.id + "=" + x }); }
  const freq = feats.map((f) => { const addr = subset.filter((d) => vals(d, f.v)); const has = addr.filter((d) => vals(d, f.v).includes(f.x)); return { ...f, n: has.length, addressed: addr.length }; })
    .filter((f) => f.addressed >= 8).sort((a, b) => b.n / b.addressed - a.n / a.addressed || b.n - a.n);
  const tests = [];
  for (let i = 0; i < feats.length; i++) for (let j = i + 1; j < feats.length; j++) {
    const A = feats[i], B = feats[j]; if (A.v === B.v) continue;
    const both = subset.filter((d) => vals(d, A.v) && vals(d, B.v)); if (both.length < 15) continue;
    const a = both.filter((d) => vals(d, A.v).includes(A.x) && vals(d, B.v).includes(B.x)).length;
    const b = both.filter((d) => vals(d, A.v).includes(A.x) && !vals(d, B.v).includes(B.x)).length;
    const c = both.filter((d) => !vals(d, A.v).includes(A.x) && vals(d, B.v).includes(B.x)).length;
    const dd = both.length - a - b - c; if (a + b < 4 || c + dd < 4 || a + c < 4 || b + dd < 4) continue;
    const lift = (a / (a + b)) / ((a + c) / both.length);
    tests.push({ A: A.key, B: B.key, n: both.length, a, b, c, d: dd, p: fisher(a, b, c, dd), lift: +lift.toFixed(2) });
  }
  tests.sort((x, y) => x.p - y.p); const m = tests.length;
  let prev = 1; for (let i = m - 1; i >= 0; i--) { prev = Math.min(prev, tests[i].p * m / (i + 1)); tests[i].q = prev; }
  return { label, docs: subset.length, tests_run: m, freq, top: tests.slice(0, 14) };
}
const all = analyse(ids, "all coded documents"), rules = analyse(ids.filter((d) => !isPointer(d) && vals(d, "instrument_force")), "excluding pointer pages and documents with no stated force");
fs.writeFileSync(path.join(__dirname, "patterns.json"), JSON.stringify({ all, rules }, null, 1));
for (const R of [all, rules]) { console.log("\n=== " + R.label + ": " + R.docs + " docs, " + R.tests_run + " tests");
  console.log("most common (share among documents that address the variable, addressed>=8):"); for (const f of R.freq.slice(0, 22)) console.log("  " + f.key.padEnd(58) + f.n + "/" + f.addressed + " " + Math.round(100 * f.n / f.addressed) + "%");
  console.log("co-occurrence, smallest p:"); for (const t of R.top.slice(0, 10)) console.log("  p=" + t.p.toFixed(4) + " q=" + t.q.toFixed(2) + " lift=" + t.lift + " n=" + t.n + " [" + t.a + "," + t.b + "," + t.c + "," + t.d + "]  " + t.A + "  +  " + t.B); }
