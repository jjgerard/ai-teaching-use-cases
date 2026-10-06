// Merges the completeness pass (run1/complete/cN/{uses,support,misconduct}) into uses.json, support.json and misconduct.json.
// Checks that every original row is still present before replacing a document. Run from repo root: node data/policy/run1/merge-complete.js
const fs = require("fs"), path = require("path"), cp = require("child_process"); const P = "data/policy/", C = P + "run1/complete/";
const batches = fs.readdirSync(C).filter((d) => /^c\d+$/.test(d) && fs.existsSync(C + d + "/notes.json")).sort((a, b) => +a.slice(1) - +b.slice(1));
const J = (f) => JSON.parse(fs.readFileSync(f, "utf8")); const S = (x) => JSON.stringify(x);
const problems = []; let docsChanged = 0;
const present = (arr, row) => (arr || []).some((x) => S(x) === S(row));
for (const b of batches) for (const f of fs.readdirSync(C + b + "/uses").filter((x) => x.endsWith(".json"))) {
  const id = f.replace(/\.json$/, ""); const ex = { u: J(C + b + "/existing/" + id + ".uses.json"), s: J(C + b + "/existing/" + id + ".support.json"), m: J(C + b + "/existing/" + id + ".misconduct.json") };
  const nu = J(C + b + "/uses/" + f), ns = J(C + b + "/support/" + f), nm = J(C + b + "/misconduct/" + f);
  for (const r of ex.u.uses) if (!present(nu.uses, r)) problems.push(`${id}: use row lost ${r.use}/${r.context}/${r.stance}`);
  for (const k of ["default_when_silent"]) if (ex.u[k] && S(ex.u[k]) !== S(nu[k])) problems.push(`${id}: ${k} changed`);
  for (const r of ex.u.decided_by || []) if (!present(nu.decided_by, r)) problems.push(`${id}: decided_by lost ${r.value}`);
  const ea = ex.u.acknowledgement || {}, na = nu.acknowledgement || {};
  for (const k of Object.keys(ea)) { if (ea[k] == null || (Array.isArray(ea[k]) && !ea[k].length)) continue; if (Array.isArray(ea[k])) { for (const r of ea[k]) if (!present(na[k], r)) problems.push(`${id}: acknowledgement.${k} lost an entry`); } else if (S(ea[k]) !== S(na[k])) problems.push(`${id}: acknowledgement.${k} changed`); }
  for (const r of ex.s.found) if (!present(ns.found, r)) problems.push(`${id}: support row lost ${r.form}`);
  for (const k of ["offences", "liability", "detection", "process", "outcomes", "definitions"]) for (const r of ex.m[k] || []) if (!present(nm[k], r)) problems.push(`${id}: misconduct ${k} row lost`);
}
console.log(batches.length, "batches;", problems.length, "problems"); problems.slice(0, 40).forEach((p) => console.log(" ", p));
if (problems.length && !process.argv.includes("--force")) process.exit(1);
const dirs = (k) => batches.map((b) => C + b + "/" + k);
const tmp = fs.mkdtempSync("/tmp/cmp-"); const run = (mod, k, out) => cp.execFileSync("node", ["policy/" + mod + ".js", "merge", ...dirs(k), "--out", out], { stdio: "pipe" }).toString().trim().split("\n").slice(-2).join(" | ");
console.log(run("uses", "uses", tmp + "/u.json")); console.log(run("support", "support", tmp + "/s.json")); console.log(run("misconduct", "misconduct", tmp + "/m.json"));
for (const [f, x] of [["uses.json", "u.json"], ["support.json", "s.json"], ["misconduct.json", "m.json"]]) {
  const a = J(P + f), b = J(tmp + "/" + x), ids = new Set(b.map((r) => r.doc_id)); const keep = a.filter((r) => !ids.has(r.doc_id)); fs.writeFileSync(P + f, JSON.stringify([...keep, ...b], null, 1) + "\n"); console.log(f, a.length, "->", keep.length + b.length);
}
const un = []; for (const b of batches) { const n = J(C + b + "/notes.json"); for (const u of n.unmapped || []) un.push({ batch: b, ...u }); } fs.writeFileSync(C + "unmapped.json", JSON.stringify(un, null, 1) + "\n"); console.log("unmapped statements:", un.length);
