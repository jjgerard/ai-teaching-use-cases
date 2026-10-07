// Appends the five-schema coding of the new documents (batches yN) to the merged files. Idempotent. Run from repo root.
const fs = require("fs"), cp = require("child_process"), os = require("os"), path = require("path");
const R = "data/policy/run1/", P = "data/policy/";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "my-"));
const spec = [["uses", "uses.js", "uses.json", "docs"], ["support", "support.js", "support.json", "rows"], ["misconduct", "misconduct.js", "misconduct.json", "docs"], ["toolsdata", "toolsdata.js", "toolsdata.json", "docs"], ["risks", "risks.js", "risks.json", "docs"]];
for (const [dir, js, out, kind] of spec) {
  const dirs = fs.readdirSync(R + dir).filter((d) => /^y\d+$/.test(d)).map((d) => R + dir + "/" + d);
  const f = path.join(tmp, out); const r = cp.spawnSync("node", ["policy/" + js, "merge", ...dirs, "--out", f], { encoding: "utf8" }); process.stdout.write(dir + ": " + r.stdout.split("\n").filter((l) => /documents|ERROR/.test(l)).join(" | ") + "\n"); if (r.status) { console.log(r.stdout); process.exit(1); }
  const add = JSON.parse(fs.readFileSync(f)), cur = JSON.parse(fs.readFileSync(P + out));
  if (kind === "docs") { const have = new Set(cur.map((d) => d.doc_id)); const fresh = add.filter((d) => !have.has(d.doc_id)); fs.writeFileSync(P + out, JSON.stringify([...cur, ...fresh], null, 1) + "\n"); console.log("  added docs", fresh.length, "total", cur.length + fresh.length); }
  else { const have = new Set(cur.map((x) => x.doc_id)); const fresh = add.filter((x) => !have.has(x.doc_id)); fs.writeFileSync(P + out, JSON.stringify([...cur, ...fresh], null, 1) + "\n"); console.log("  added rows", fresh.length, "total", cur.length + fresh.length); }
}
