// Agreement between the main classification and an independent second pass on a random 10% sample.
const fs = require("fs"), path = require("path"); const root = path.join(__dirname, "..", "..");
const main = new Map(JSON.parse(fs.readFileSync(path.join(root, "claims.json"))).map((r) => [r.ref, r]));
const dbl = JSON.parse(fs.readFileSync(path.join(__dirname, "full", "d1", "d1.json"))).rows;
const types = JSON.parse(fs.readFileSync(path.join(__dirname, "statement-types.v1.json"))).types; const grp = Object.fromEntries(types.map((t) => [t.id, t.group])); grp.unclassified = "unclassified";
let n = 0, same = 0, sameGroup = 0, either = 0, bothClear = 0, bothClearSame = 0; const ca = {}, cb = {};
for (const r of dbl) { const m = main.get(r.ref); if (!m) continue; n++; if (m.claim === r.claim) same++; if (grp[m.claim] === grp[r.claim]) sameGroup++;
  if (m.claim === r.claim || m.claim === r.claim2 || m.claim2 === r.claim) either++;
  if (m.fit === "clear" && r.fit === "clear") { bothClear++; if (m.claim === r.claim) bothClearSame++; }
  ca[m.claim] = (ca[m.claim] || 0) + 1; cb[r.claim] = (cb[r.claim] || 0) + 1; }
const labels = [...new Set([...Object.keys(ca), ...Object.keys(cb)])]; const pe = labels.reduce((s, l) => s + ((ca[l] || 0) / n) * ((cb[l] || 0) / n), 0); const kappa = (same / n - pe) / (1 - pe);
const out = { points: n, exact_pct: +(100 * same / n).toFixed(1), group_pct: +(100 * sameGroup / n).toFixed(1), either_pct: +(100 * either / n).toFixed(1), both_clear: bothClear, both_clear_exact_pct: +(100 * bothClearSame / bothClear).toFixed(1), kappa: +kappa.toFixed(2) };
fs.writeFileSync(path.join(__dirname, "agreement.json"), JSON.stringify(out, null, 1)); console.log(out);
