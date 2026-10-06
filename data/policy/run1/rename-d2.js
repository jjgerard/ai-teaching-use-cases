// The first d2 doc ids used a truncated institution slug (e.g. "d", "st", "edinburgh" for two institutions). Rename to the full base from the first document's id.
const fs = require("fs"), path = require("path"); const R = "data/policy/run1/";
const inst = {}; for (const d of fs.readdirSync(R + "discovery2")) { const f = R + "discovery2/" + d + "/input.json"; if (fs.existsSync(f)) for (const i of JSON.parse(fs.readFileSync(f))) inst[i.name] = i.first_doc_id; }
const baseOf = (id) => id.replace(/-202610$/, "").replace(/-(students?|staff)-.*$/, "").replace(/-genai(-.*)?$/, "");
const map = {}; const targets = JSON.parse(fs.readFileSync(R + "archive3/targets.json"));
for (const t of targets) { const first = inst[t.institution]; if (!first) { console.log("NO MATCH", t.institution, t.doc_id); continue; } const kind = t.doc_id.replace(/^.*?-d2-/, "").replace(/-202610$/, ""); map[t.doc_id] = baseOf(first) + "-d2-" + kind + "-202610"; }
const nm = Object.values(map); if (new Set(nm).size !== nm.length) console.log("DUPLICATE NEW IDS", nm.filter((x, i) => nm.indexOf(x) !== i));
for (const [a, b] of Object.entries(map)) { for (const sub of ["snapshots", "raw"]) for (const f of fs.readdirSync(R + "archive3/" + sub)) if (f.startsWith(a + ".")) fs.renameSync(R + "archive3/" + sub + "/" + f, R + "archive3/" + sub + "/" + f.replace(a, b)); }
const man = JSON.parse(fs.readFileSync(R + "archive3/manifest.json")); for (const m of man) if (map[m.doc_id]) m.doc_id = map[m.doc_id]; fs.writeFileSync(R + "archive3/manifest.json", JSON.stringify(man, null, 1));
for (const t of targets) if (map[t.doc_id]) t.doc_id = map[t.doc_id]; fs.writeFileSync(R + "archive3/targets.json", JSON.stringify(targets, null, 1));
for (const d of fs.readdirSync(R + "discovery2")) { const f = R + "discovery2/" + d + "/targets.json"; if (fs.existsSync(f)) { const j = JSON.parse(fs.readFileSync(f)); for (const t of j) if (map[t.doc_id]) t.doc_id = map[t.doc_id]; fs.writeFileSync(f, JSON.stringify(j, null, 1)); } }
fs.writeFileSync(R + "archive3/id-map.json", JSON.stringify(map, null, 1)); console.log(Object.entries(map).filter(([a, b]) => a !== b).length, "renamed");
console.log(nm.join("\n"));
