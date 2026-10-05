// Agreement between the main new-type audit (b*) and the independent re-code (d*) on 12 documents x 11 types.
const fs = require("fs"), path = require("path"); const D = "data/policy/run1/audit-v2/";
const rd = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const load = (pre) => { const o = {}; for (const d of fs.readdirSync(D)) if (new RegExp("^" + pre + "\\d+$").test(d)) for (const f of fs.readdirSync(D + d)) { const j = rd(D + d + "/" + f); o[j.doc_id] = { found: new Set(j.found.map((x) => x.type)), unsure: new Set(j.unsure.map((x) => x.type)) }; } return o; };
const B = load("b"), Dd = load("d"); const docs = Object.keys(Dd); const types = rd("data/policy/run1/claims/statement-types.v2.json").types.filter((t) => t.new_in_v2).map((t) => t.id);
const cell = (o, t) => (o.found.has(t) ? "found" : o.unsure.has(t) ? "unsure" : "absent");
let n = 0, exact = 0, foundBoth = 0, foundEither = 0, binAgree = 0; const per = {}; const diffs = [];
for (const d of docs) for (const t of types) { const a = cell(B[d], t), b = cell(Dd[d], t); n++; if (a === b) exact++; const fa = a === "found", fb = b === "found"; if (fa === fb) binAgree++; if (fa && fb) foundBoth++; if (fa || fb) foundEither++; (per[t] ??= { both: 0, either: 0 }); if (fa && fb) per[t].both++; if (fa || fb) per[t].either++; if (a !== b) diffs.push(`${d.slice(0, 22)} ${t.slice(0, 34)}: ${a} vs ${b}`); }
const p = (x, y) => (y ? Math.round((100 * x) / y) : null);
const pe = (a, b) => a + b; let pa = binAgree / n, pf1 = 0, pf2 = 0; for (const d of docs) for (const t of types) { if (B[d].found.has(t)) pf1++; if (Dd[d].found.has(t)) pf2++; }
const pe_ = (pf1 / n) * (pf2 / n) + (1 - pf1 / n) * (1 - pf2 / n); const kappa = (pa - pe_) / (1 - pe_);
const out = { docs: docs.length, cells: n, exact_three_state_pct: p(exact, n), found_vs_not_found_pct: p(binAgree, n), found_by_both: foundBoth, found_by_either: foundEither, jaccard_found_pct: p(foundBoth, foundEither), kappa_found: +kappa.toFixed(2), per_type: per, differences: diffs };
fs.writeFileSync(D + "agreement.json", JSON.stringify(out, null, 1)); console.log(JSON.stringify({ ...out, differences: undefined, per_type: undefined })); console.log(diffs.join("\n"));
