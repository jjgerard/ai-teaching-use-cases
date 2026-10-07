// Second seeded draw (new institutions only) outside the UK and Ireland, after the first pilot (intl-sample.js).
// AU, NZ and CA come from the full ROR frame (policy/frame.js). The US frame has 4,428 education records, so it is sampled
// from randomly chosen ROR result pages instead of being downloaded in full. Only names containing "universit" are eligible.
// Run from repo root: node data/policy/run1/intl-sample.js
const fs = require("fs"); const { parseItem, tierOf } = require("../../../policy/frame.js");
let a = 20261007; const rnd = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const shuffle = (x) => { x = [...x]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
const COUNTRY = { AU: "Australia", NZ: "New Zealand", CA: "Canada", US: "United States" };
const slug = (s) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const BAD = /(group|society|association|application|debate|magnet|network|consortium|research group|groupe|virtual university|student|u15|northern studies|seminary|bible|theolog|divinity|rabbinical|yeshiva|press|hospital|system office|council|university system|professional school|université du québec$|system$)/i;
(async () => {
  const frame = JSON.parse(fs.readFileSync("data/policy/frame-intl-1.json"));
  const uniq = (rows) => { const s = new Set(); return rows.filter((r) => !s.has(r.name) && s.add(r.name)); };
  const pool = (cc) => uniq(frame.filter((r) => r.country === cc && r.tier === "university_name" && !BAD.test(r.name)));
  const done = new Set(JSON.parse(fs.readFileSync("data/policy/run1/intl/sample.json")).map((r) => r.name)); const fresh = (cc) => pool(cc).filter((r) => !done.has(r.name));
  const pick = { AU: shuffle(fresh("AU")).slice(0, 20), NZ: fresh("NZ"), CA: shuffle(fresh("CA")).slice(0, 20) };
  // US: ten random result pages out of 222, then a random draw from their university-named records
  const pages = shuffle(Array.from({ length: 222 }, (_, i) => i + 1)).slice(0, 20); const us = [];
  for (const n of pages) { const res = await fetch(`https://api.ror.org/v2/organizations?filter=country.country_code:US,types:education&page=${n}`, { headers: { "user-agent": "ai-guidance-analysis/0.5 (research frame builder)" } }); const j = await res.json(); for (const it of j.items || []) us.push(parseItem(it)); await new Promise((r) => setTimeout(r, 1500)); }
  pick.US = shuffle(uniq(us.filter((r) => tierOf(r.name) === "university_name" && !BAD.test(r.name) && !done.has(r.name)))).slice(0, 20);
  const out = []; const taken = new Set([...JSON.parse(fs.readFileSync("data/policy/documents.json")).map((d) => d.doc_id), ...JSON.parse(fs.readFileSync("data/policy/run1/intl/sample.json")).map((d) => d.doc_id)]);
  for (const cc of ["AU", "NZ", "CA", "US"]) for (const r of pick[cc]) { let id = slug(r.name) + "-students-genai-202610"; if (taken.has(id)) id = slug(r.name) + "-" + cc.toLowerCase() + "-students-genai-202610"; taken.add(id); out.push({ name: r.name, ror_id: r.ror_id, country: cc, country_name: COUNTRY[cc], region: r.region, website: r.website, doc_id: id }); }
  fs.mkdirSync("data/policy/run1/intl2", { recursive: true }); fs.writeFileSync("data/policy/run1/intl2/sample.json", JSON.stringify(out, null, 1));
  const per = 4; let n = 0; for (let i = 0; i < out.length; i += per) { n++; fs.mkdirSync(`data/policy/run1/discovery-intl2/h${n}`, { recursive: true }); fs.writeFileSync(`data/policy/run1/discovery-intl2/h${n}/input.json`, JSON.stringify(out.slice(i, i + per), null, 1)); }
  console.log(out.length, "institutions in", n, "batches"); console.log(out.map((r) => r.country + " " + r.name).join("\n"));
})();
