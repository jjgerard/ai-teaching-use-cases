// Seeded stratified draw for the student-layer run. Strata are for sampling only (no policy content).
// Output: sample.json = ordered list; tier 1 = first ~60 (stratified), tier 2 = the rest in seeded random order.
const fs = require("fs");
const frame = require("../frame.json");
let a = 20261002; const rnd = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const shuffle = (x) => { x = [...x]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
const inc = frame.filter((r) => r.include === true);
const byName = new Map(inc.map((r) => [r.name, r]));
// already have an archived institution-wide student document (trial or reading set) -> coding only
const covered = ["University of Essex","Canterbury Christ Church University","Arts University Bournemouth","London Metropolitan University","Leeds Trinity University","Cranfield University","University of Hertfordshire","University of Exeter","University of Cambridge","University of Strathclyde","University of Stirling","Queen Margaret University","University of Edinburgh","University of Glasgow","Bangor University","University of Ulster","National University of Ireland, Maynooth","University of Limerick","Technological University of the Shannon: Midlands Midwest"];
// trial found a plausible URL but the page was blocked / JS shell: user fetches locally
const blocked = ["University of Leicester","Lancaster University","Buckinghamshire New University"];
const RG = ["University of Birmingham","University of Bristol","Durham University","Imperial College London","King's College London","University of Leeds","University of Liverpool","London School of Economics and Political Science","University of Manchester","Newcastle University","University of Nottingham","University of Oxford","Queen Mary University of London","University of Sheffield","University of Southampton","University College London","University of Warwick","University of York"];
const PRE92 = ["Aston University","University of Bath","University of Bradford","Brunel University of London","City St George's, University of London","Goldsmiths University of London","University of Hull","Keele University","University of Kent","Loughborough University","University of Reading","Royal Holloway University of London","University of Salford","SOAS University of London","University of Surrey","University of Sussex","University of East Anglia","University of Lincoln","Birkbeck, University of London","The Open University"];
const SPEC = ["Royal Agricultural University","Harper Adams University","University of Buckingham","BPP University","The University of Law","Regent's University London","Arden University","University for the Creative Arts","Falmouth University","University of the Arts London","Norwich University of the Arts","Leeds Arts University","Ravensbourne University London","Royal Veterinary College","Institute of Cancer Research","London School of Hygiene & Tropical Medicine","University College of Osteopathy","Health Sciences University","Northeastern University London","University College Birmingham","Arts University Plymouth","University College of Estate Management","BIMM University","Plymouth Marjon University","Hartpury University"];
const ENG = inc.filter((r) => r.region === "England").map((r) => r.name);
const POST92 = ENG.filter((n) => ![...RG, ...PRE92, ...SPEC, ...covered, ...blocked].includes(n));
const pick = (list, n) => shuffle(list.filter((n2) => byName.has(n2) && !covered.includes(n2) && !blocked.includes(n2))).slice(0, n);
const t1 = [];
t1.push(...pick(RG, 6), ...pick(PRE92, 3), ...pick(POST92, 4), ...pick(SPEC, 3));
const sc = ["University of Aberdeen","Abertay University","University of Dundee","Edinburgh Napier University","Glasgow Caledonian University","Heriot-Watt University","Robert Gordon University","University of St Andrews","University of the Highlands and Islands","University of the West of Scotland","Scotland's Rural College"];
t1.push(...pick(sc, 7));
t1.push(...inc.filter((r) => r.region === "Wales" && r.name !== "Bangor University").map((r) => r.name));
t1.push("Queen's University Belfast", "St Mary's University College", "Stranmillis University College");
t1.push("Technological University Dublin","Munster Technological University","South East Technological University","Atlantic Technological University","Trinity College Dublin","University College Dublin","University College Cork","Dublin City University");
const tier1 = [...new Set(t1)];
const rest = shuffle(inc.map((r) => r.name).filter((n) => !tier1.includes(n) && !covered.includes(n) && !blocked.includes(n)));
const slug = (n) => n.toLowerCase().replace(/^the /, "").replace(/university college dublin/,"ucd").replace(/university college cork/,"ucc").replace(/&/g,"and").replace(/[^a-z0-9]+/g, "-").replace(/-?(university|of|college)-?/g, "-").replace(/^-|-$/g, "").replace(/-+/g,"-").slice(0, 24);
const row = (n, tier, status) => { const r = byName.get(n); if (!r) throw new Error("not in include set: " + n); return { name: n, ror_id: r.ror_id, region: r.country === "IE" ? "Ireland" : r.region, website: r.website, tier, status, doc_id: slug(n) + "-students-genai-202610" }; };
const out = [
  ...covered.map((n) => row(n, 1, "archived")), ...blocked.map((n) => row(n, 1, "blocked_pending_user")),
  ...tier1.map((n) => row(n, 1, "to_discover")), ...rest.map((n) => row(n, 2, "to_discover")),
];
fs.writeFileSync(__dirname + "/sample.json", JSON.stringify(out, null, 1) + "\n");
const c = {}; out.forEach((r) => { const k = `tier${r.tier}/${r.region}/${r.status}`; c[k] = (c[k] || 0) + 1; }); console.log(c, out.length);
console.log(tier1.join("; "));
