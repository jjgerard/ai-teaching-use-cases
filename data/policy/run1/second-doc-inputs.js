// Builds inputs for second-document discovery in the thin regions (NI, Wales, Scotland, Ireland) from institutions that already have a first document.
const fs = require("fs"), path = require("path"); const rd = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const S = rd("data/policy/run1/sample.json"); const M = rd("data/policy/matrix.json");
const have = new Set(M.rows.filter((r) => r.doc_id).map((r) => r.doc_id));
const man = {}; for (const f of ["data/policy/run1/archive/manifest.json", "data/policy/run1/archive2/manifest.json"]) if (fs.existsSync(f)) for (const m of rd(f)) man[m.doc_id] = m.url;
const other = {}; const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.startsWith("outcomes") && e.name.endsWith(".json")) { let j; try { j = rd(p); } catch { continue; } for (const o of j.rows || j) if (o && o.name) other[o.name] = [...(other[o.name] || []), ...(o.other_pages || [])]; } } };
walk("data/policy/run1/discovery"); walk("data/policy/run1"); 
const REG = ["Northern Ireland", "Wales", "Scotland", "Ireland"];
const rows = S.filter((s) => REG.includes(s.region) && have.has(s.doc_id)).map((s) => ({ name: s.name, region: s.region, website: s.website, base: s.doc_id.replace(/-students-genai-202610$|-student-genai-guidance-202610$|-.*-202610$/, ""), first_doc_id: s.doc_id, first_doc_url: man[s.doc_id] || null, known_other_pages: [...new Map((other[s.name] || []).map((p) => [p.url, { url: p.url, title: p.title, audience: p.audience }])).values()].slice(0, 8) }));
rows.sort((a, b) => REG.indexOf(a.region) - REG.indexOf(b.region) || a.name.localeCompare(b.name));
fs.mkdirSync("data/policy/run1/discovery2", { recursive: true });
let n = 0; for (let i = 0; i < rows.length; i += 5) { n++; fs.mkdirSync("data/policy/run1/discovery2/d" + n, { recursive: true }); fs.writeFileSync("data/policy/run1/discovery2/d" + n + "/input.json", JSON.stringify(rows.slice(i, i + 5), null, 1)); }
console.log("institutions", rows.length, "batches", n, rows.reduce((o, r) => ((o[r.region] = (o[r.region] || 0) + 1), o), {}), "missing first url", rows.filter((r) => !r.first_doc_url).length, "with other pages", rows.filter((r) => r.known_other_pages.length).length);
