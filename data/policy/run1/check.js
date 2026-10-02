// node data/policy/run1/check.js <dir-with-codes-and-registrations> [--merge]
// Builds a temp copy of the tables, applies each <doc_id>.registration.json (audience, domains, format, published,
// last_updated, date_known; every proposed change needs a verbatim quote from the snapshot), merges the <doc_id>.json
// code files and runs policy/validate.js. With --merge, writes accepted registrations into documents.json.
const fs = require("fs"), path = require("path"), os = require("os"), cp = require("child_process");
const root = path.join(__dirname, ".."); const dir = path.resolve(process.argv[2]); const merge = process.argv.includes("--merge");
const norm = (s) => s.toLowerCase().replace(/[‘’“”'"`\-‐-―\s]+/g, " ").trim();
const docs = JSON.parse(fs.readFileSync(path.join(root, "documents.json")));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "chk-")); fs.mkdirSync(path.join(tmp, "snapshots"));
let problems = 0;
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".registration.json"))) {
  const r = JSON.parse(fs.readFileSync(path.join(dir, f))); const d = docs.find((x) => x.doc_id === r.doc_id);
  if (!d) { console.error("registration for unknown doc", r.doc_id); problems++; continue; }
  const snap = norm(fs.readFileSync(path.join(root, "snapshots", r.doc_id + ".txt"), "utf8"));
  for (const [k, q] of Object.entries(r.evidence || {})) if (!snap.includes(norm(q))) { console.error(`${r.doc_id}: evidence quote for ${k} is not in the snapshot`); problems++; }
  for (const k of ["audience", "domains", "format", "published", "last_updated", "date_known"]) if (k in r) {
    if (k !== "format" && k !== "date_known" && !(r.evidence || {})[k]) { console.error(`${r.doc_id}: ${k} changed without an evidence quote`); problems++; }
    d[k] = r[k];
  }
  if ((d.published || d.last_updated) && d.date_known === false) delete d.date_known;
}
fs.writeFileSync(path.join(tmp, "documents.json"), JSON.stringify(docs));
fs.copyFileSync(path.join(root, "institutions.json"), path.join(tmp, "institutions.json"));
for (const f of fs.readdirSync(path.join(root, "snapshots"))) fs.copyFileSync(path.join(root, "snapshots", f), path.join(tmp, "snapshots", f));
const codes = fs.readdirSync(dir).filter((f) => f.endsWith(".json") && !f.endsWith(".registration.json")).flatMap((f) => JSON.parse(fs.readFileSync(path.join(dir, f))));
fs.writeFileSync(path.join(tmp, "codes.json"), JSON.stringify(codes));
const out = cp.spawnSync("node", [path.join(root, "..", "..", "policy", "validate.js"), tmp], { encoding: "utf8" });
const lines = (out.stdout + out.stderr).split("\n").filter((l) => /ERROR|errors/.test(l) && !/uncoded/.test(l));
console.log(lines.slice(-40).join("\n"));
if (merge && !problems) { fs.writeFileSync(path.join(root, "documents.json"), JSON.stringify(docs, null, 1) + "\n"); console.log("registrations merged into documents.json"); }
process.exit(problems || /[1-9]\d* errors/.test(out.stdout) ? 1 : 0);
