// Combines England second-document targets (discovery3) and international draw 2 (discovery-intl2) into archive7/targets.json,
// renaming second-document ids from the first document's full base so institutions with a shared slug do not collide.
const fs = require("fs"); const R = "data/policy/run1/";
const baseOf = (id) => id.replace(/-202610$/, "").replace(/-(students?|staff)-.*$/, "").replace(/-genai(-.*)?$/, "");
const inst = {}; for (const d of fs.readdirSync(R + "discovery3")) { const f = R + "discovery3/" + d + "/input.json"; if (fs.existsSync(f)) for (const i of JSON.parse(fs.readFileSync(f))) inst[i.name] = i.first_doc_id; }
const out = [];
for (const d of fs.readdirSync(R + "discovery3")) { const f = R + "discovery3/" + d + "/targets.json"; if (!fs.existsSync(f)) continue; for (const t of JSON.parse(fs.readFileSync(f))) { const first = inst[t.institution]; if (!first) { console.log("NO MATCH", t.institution, t.doc_id); continue; } const kind = t.doc_id.replace(/^.*?-d2-/, "").replace(/-202610$/, ""); out.push({ ...t, doc_id: baseOf(first) + "-d2-" + kind + "-202610", first_doc_id: first, track: "england-d2" }); } }
for (const d of fs.readdirSync(R + "discovery-intl2")) { const f = R + "discovery-intl2/" + d + "/targets.json"; if (!fs.existsSync(f)) continue; for (const t of JSON.parse(fs.readFileSync(f))) out.push({ ...t, track: "intl2" }); }
const ids = out.map((t) => t.doc_id); const dup = ids.filter((x, i) => ids.indexOf(x) !== i); if (dup.length) console.log("DUPLICATE IDS", dup);
fs.mkdirSync(R + "archive7", { recursive: true }); fs.writeFileSync(R + "archive7/targets.json", JSON.stringify(out, null, 1)); console.log(out.length, "targets", out.filter((t) => t.track === "england-d2").length, "england", out.filter((t) => t.track === "intl2").length, "intl");
