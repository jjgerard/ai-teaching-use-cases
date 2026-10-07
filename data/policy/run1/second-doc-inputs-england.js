// Builds inputs for second-document discovery for English institutions (discovery3/eN) from documents.json and the frame.
const fs = require("fs"), path = require("path"); const rd = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const D = rd("data/policy/documents.json"), I = rd("data/policy/institutions.json"), F = rd("data/policy/frame.json"), S = rd("data/policy/run1/sample.json");
const K = rd("data/policy/run1/archive3/kinds.json");
const web = {}; for (const f of F) web[f.name] = f.website; for (const s of S) web[s.name] = web[s.name] || s.website;
const gapIn = {}; const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name === "input.json") for (const o of rd(p)) if (o.name && o.website) gapIn[o.name] = o.website; } }; walk("data/policy/run1/discovery-gaps");
const man = {}; for (const d of fs.readdirSync("data/policy/run1").filter((x) => x.startsWith("archive"))) { const f = `data/policy/run1/${d}/manifest.json`; if (fs.existsSync(f)) for (const m of rd(f)) man[m.doc_id] = m.url; }
const other = {}; const walk2 = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk2(p); else if (e.name.startsWith("outcomes") && e.name.endsWith(".json")) { let j; try { j = rd(p); } catch { continue; } for (const o of j.rows || j) if (o && o.name) other[o.name] = [...(other[o.name] || []), ...(o.other_pages || [])]; } } }; walk2("data/policy/run1");
const inst = {}; I.forEach((i) => (inst[i.institution_id] = i));
const rows = [];
for (const d of D) { const i = inst[d.institution_id]; if (!i || i.region !== "GB-ENG" || i.sector !== "university" || d.doc_id.includes("-d2-") || K[d.doc_id]) continue;
  const base = d.doc_id.replace(/-students-genai-202610$|-.*-202610$/, "");
  rows.push({ name: i.name, region: "England", website: web[i.name] || gapIn[i.name] || null, base, first_doc_id: d.doc_id, first_doc_url: man[d.doc_id] || null, known_other_pages: [...new Map((other[i.name] || []).map((p) => [p.url, { url: p.url, title: p.title, audience: p.audience }])).values()].slice(0, 8) }); }
rows.sort((a, b) => a.name.localeCompare(b.name));
fs.mkdirSync("data/policy/run1/discovery3", { recursive: true });
let n = 0; for (let i = 0; i < rows.length; i += 5) { n++; fs.mkdirSync("data/policy/run1/discovery3/e" + n, { recursive: true }); fs.writeFileSync("data/policy/run1/discovery3/e" + n + "/input.json", JSON.stringify(rows.slice(i, i + 5), null, 1)); }
console.log("institutions", rows.length, "batches", n, "no website", rows.filter((r) => !r.website).map((r) => r.name), "no first url", rows.filter((r) => !r.first_doc_url).length);
