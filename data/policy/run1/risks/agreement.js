// Agreement between two independent coders on the risks pilot. Keys ignore audience, bearer strength and quote.
const fs = require("fs"); const [a, b] = process.argv.slice(2).length ? process.argv.slice(2) : ["p1", "p2"];
const keys = (j) => ({ risks: new Set((j.risks || []).map((x) => x.risk)), duties: new Set((j.responsibilities || []).map((x) => x.duty)), bearers: new Set((j.responsibilities || []).map((x) => x.duty + "|" + x.bearer)) });
const tot = {}, diffs = {}; for (const f of fs.readdirSync(a).filter((x) => x.endsWith(".json"))) {
  const A = keys(JSON.parse(fs.readFileSync(a + "/" + f))), B = keys(JSON.parse(fs.readFileSync(b + "/" + f)));
  for (const k of Object.keys(A)) { const both = [...A[k]].filter((x) => B[k].has(x)).length, un = new Set([...A[k], ...B[k]]).size; const t = (tot[k] ||= { both: 0, un: 0 }); t.both += both; t.un += un;
    (diffs[f] ||= []).push(...[...A[k]].filter((x) => !B[k].has(x)).map((x) => k + ": only " + a + " " + x), ...[...B[k]].filter((x) => !A[k].has(x)).map((x) => k + ": only " + b + " " + x)); } }
let both = 0, un = 0; for (const [k, v] of Object.entries(tot)) { console.log(k.padEnd(11), v.both + "/" + v.un, (100 * v.both / (v.un || 1)).toFixed(0) + "%"); both += v.both; un += v.un; } console.log("all".padEnd(11), both + "/" + un, (100 * both / un).toFixed(0) + "%");
for (const [f, d] of Object.entries(diffs)) { console.log("\n" + f.replace("-202610.json", "")); d.forEach((x) => console.log("  " + x)); }
