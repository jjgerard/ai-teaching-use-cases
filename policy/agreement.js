// Inter-coder agreement between two codes.json files.
//
//     node policy/agreement.js a/codes.json b/codes.json [--by-variable] [--show-disagreements]
//
// Only cells present in both files are compared. Three levels, because they answer different questions:
//   kind   : do the coders agree on the KIND of answer (a value / not_stated / none_exists / not_applicable / misfit)?
//   exact  : do they agree on the exact value (multi values as sets)?
//   jaccard: for multi values, overlap of the two sets (1 = identical)
// "exact" is computed only over cells where BOTH coders gave a substantive value, so it is not inflated by
// the many cells both leave as not_stated or not_applicable. Cohen's kappa is not reported: with a handful of
// documents per variable it is unstable, and it would hide which cells disagree.

const fs = require("node:fs");
const STATES = ["none_exists", "not_stated", "not_applicable"];
const kindOf = (v) => (v === null ? "misfit" : typeof v === "string" && STATES.includes(v) ? v : "value");
const norm = (v) => (Array.isArray(v) ? [...v].sort() : [v]);
const key = (r) => `${r.doc_id}\u0000${r.variable_id}`;

function compare(a, b) {
  const bm = new Map(b.map((r) => [key(r), r]));
  const cells = [];
  for (const ra of a) {
    const rb = bm.get(key(ra));
    if (!rb) continue;
    const ka = kindOf(ra.value), kb = kindOf(rb.value);
    const cell = { doc_id: ra.doc_id, variable_id: ra.variable_id, a: ra.value, b: rb.value, kindAgree: ka === kb };
    if (ka === "value" && kb === "value") {
      const sa = norm(ra.value), sb = norm(rb.value);
      const inter = sa.filter((x) => sb.includes(x)).length;
      cell.exact = sa.length === sb.length && inter === sa.length;
      cell.jaccard = inter / new Set([...sa, ...sb]).size;
    }
    cells.push(cell);
  }
  return cells;
}

function summarise(cells) {
  const both = cells.filter((c) => c.exact !== undefined);
  const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
  return {
    cells: cells.length,
    kindAgreement: mean(cells.map((c) => +c.kindAgree)),
    bothSubstantive: both.length,
    exactAgreement: mean(both.map((c) => +c.exact)),
    meanJaccard: mean(both.map((c) => c.jaccard)),
  };
}

module.exports = { compare, summarise, kindOf };

if (require.main === module) {
  const files = process.argv.slice(2).filter((x) => !x.startsWith("--"));
  const [a, b] = files.map((f) => JSON.parse(fs.readFileSync(f, "utf8")));
  const cells = compare(a, b);
  const pct = (x) => (x == null ? "n/a" : (100 * x).toFixed(0) + "%");
  const s = summarise(cells);
  console.log(`cells compared: ${s.cells}`);
  console.log(`kind agreement: ${pct(s.kindAgreement)}`);
  console.log(`both gave a value: ${s.bothSubstantive}; exact agreement there: ${pct(s.exactAgreement)}; mean Jaccard: ${pct(s.meanJaccard)}`);
  if (process.argv.includes("--by-variable")) {
    const by = new Map();
    for (const c of cells) (by.get(c.variable_id) || by.set(c.variable_id, []).get(c.variable_id)).push(c);
    const rows = [...by].map(([v, cs]) => ({ v, ...summarise(cs) })).sort((x, y) => (x.kindAgreement ?? 1) - (y.kindAgreement ?? 1));
    for (const r of rows) console.log(`${r.v.padEnd(46)} kind ${pct(r.kindAgreement).padStart(4)}  exact ${pct(r.exactAgreement).padStart(4)} (n=${r.bothSubstantive})`);
  }
  if (process.argv.includes("--show-disagreements")) {
    for (const c of cells.filter((c) => !c.kindAgree || c.exact === false)) console.log(`${c.doc_id.slice(0, 24)} ${c.variable_id}: ${JSON.stringify(c.a)} vs ${JSON.stringify(c.b)}`);
  }
}
