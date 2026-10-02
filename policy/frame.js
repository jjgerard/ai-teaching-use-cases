// Build a CANDIDATE sampling frame of institutions from the Research Organization Registry (ROR).
//
//   node policy/frame.js GB IE [--out data/policy/frame.json]
//
// The point of a frame is that every institution is listed, so "no public guidance found" and "blocked" are
// findings about named institutions instead of silent gaps. ROR is broad (it also lists health partnerships,
// schools, research institutes), so each row gets a `tier` from its NAME only. That is a heuristic to
// speed up curation, NOT a decision: a human sets `include` to true/false against the official register
// (e.g. OfS / HESA for England and UK providers, HEA for Ireland) before coding starts.
//
// Rows: { ror_id, name, acronym, country, region, website, established, wikipedia, tier, include: null }

const fs = require("node:fs");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const UNI_NAME = /universit/i;
const OTHER_NAME = /\b(college|institute|conservatoire|royal academy|school of|birkbeck|goldsmiths)/i;
const NOT_UNI = /(university (academy|technical college|hospital|centre|press)|universities uk|students'? union)/i;
const NOT_HEI = /(university press|hospital|health partner|nhs|trust\b|nursery|primary school|secondary school|grammar school|sixth form|academy trust|research council|museum|library|foundation|cooperative|centre for|laborator|observatory|hospice|clinic|chambers|students'? union|tutorial)/i;
// tier: "university_name" (contains "universit"), "other_candidate" (college/institute/conservatoire... needs a human
// look: many are further-education colleges or professional colleges), "unlikely" (matches an exclusion).
function tierOf(name) {
  if (NOT_HEI.test(name) || NOT_UNI.test(name)) return "unlikely";
  if (UNI_NAME.test(name)) return "university_name";
  if (OTHER_NAME.test(name)) return "other_candidate";
  return "unlikely";
}
const looksLikeHei = (name) => tierOf(name) === "university_name";

function parseItem(it) {
  const names = it.names || [];
  const name = (names.find((n) => (n.types || []).includes("ror_display")) || names[0] || {}).value || "";
  const acronym = (names.find((n) => (n.types || []).includes("acronym")) || {}).value || null;
  const loc = (it.locations || [])[0]?.geonames_details || {};
  const link = (t) => (it.links || []).find((l) => l.type === t)?.value || null;
  return { ror_id: it.id, name, acronym, country: loc.country_code || null, region: loc.country_subdivision_name || null, website: link("website"), established: it.established || null, wikipedia: link("wikipedia"), tier: tierOf(name), include: null };
}

async function page(country, n) {
  const url = `https://api.ror.org/v2/organizations?filter=country.country_code:${country},types:education&page=${n}`;
  const res = await fetch(url, { headers: { "user-agent": "ai-policy-atlas/0.4 (research frame builder)" }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`ROR ${res.status} for ${url}`);
  return res.json();
}

async function buildFrame(countries, { delay = 1000, log = () => {} } = {}) {
  const out = [];
  for (const cc of countries) {
    let n = 1, total = Infinity;
    while ((n - 1) * 20 < total) {
      const j = await page(cc, n); total = j.number_of_results;
      for (const it of j.items || []) out.push(parseItem(it));
      log(`${cc} page ${n}: ${out.length} so far of ${total}`);
      if (!(j.items || []).length) break;
      n++; await sleep(delay);
    }
  }
  return out.sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name));
}

module.exports = { parseItem, looksLikeHei, tierOf, buildFrame };

if (require.main === module) {
  const args = process.argv.slice(2); const oi = args.indexOf("--out");
  const out = oi >= 0 ? args.splice(oi, 2)[1] : "data/policy/frame.json";
  if (!args.length) { console.error("usage: node policy/frame.js GB IE [--out file]"); process.exit(2); }
  buildFrame(args, { log: (m) => console.error(m) }).then((rows) => {
    fs.writeFileSync(out, JSON.stringify(rows, null, 1) + "\n");
    const n = (t) => rows.filter((r) => r.tier === t).length;
    console.log(`${rows.length} candidates written to ${out}: ${n("university_name")} university_name, ${n("other_candidate")} other_candidate, ${n("unlikely")} unlikely (name heuristic only). include is null on every row until a human curates it.`);
  }).catch((e) => { console.error(e); process.exit(1); });
}
