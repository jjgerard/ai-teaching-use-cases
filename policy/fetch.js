// Archive policy documents for the AI policy atlas. Dependency-free (Node >= 22).
//
//   node policy/fetch.js fetch  targets.json --contact you@example.org [--delay 3000] [--dir data/policy]
//   node policy/fetch.js import saved.html   --id <doc_id> --url <original url> [--dir data/policy]
//   node policy/fetch.js status [--dir data/policy]
//
// targets.json: [{ "doc_id": "kcl-students-guidance-202610", "url": "https://..." }, ...]
//
// What it does and does not do
// - Identifies itself honestly (User-Agent carries --contact) and obeys robots.txt.
// - Waits --delay ms between requests to the same host. No parallel hammering.
// - NEVER tries to defeat a bot wall. A Cloudflare/Incapsula challenge, a 403/429/503 or a login redirect is
//   recorded as `blocked` and nothing is saved as a snapshot. Blocked pages are findings, not errors: they
//   show up in `status`, and you can save the page in your own browser and use `import`.
// - Writes plain text to <dir>/snapshots/<doc_id>.txt (what the validator checks quotes against), raw bytes to
//   <dir>/raw/ (gitignored), and a row in <dir>/manifest.json (url, final url, status, sha256, date, words).
// - If a re-fetch finds different content, the old snapshot moves to <dir>/snapshots-history/<doc_id>/<date>.txt,
//   so change over time is kept rather than overwritten.
// - PDFs are converted with `pdftotext` if it is installed; otherwise the manifest says needs_text.

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—", hellip: "…", pound: "£", euro: "€" };
const decode = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") { const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) ? String.fromCodePoint(n) : m; }
    return ENTITIES[e.toLowerCase()] ?? m;
  });

// Visible text of an HTML page, wording unchanged. Prefers <main>/<article>; otherwise drops obvious chrome.
function htmlToText(html) {
  const title = decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").replace(/\s+/g, " ").trim());
  let h = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style|noscript|svg|template|iframe)\b[\s\S]*?<\/\1>/gi, "");
  const main = h.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i) || h.match(/<[a-z]+\b[^>]*\brole=["']main["'][^>]*>([\s\S]*?)<\/(?:div|section|article)>/i) || h.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  h = main ? main[1] : h.replace(/<head\b[\s\S]*?<\/head>/i, "").replace(/<(nav|header|footer|aside|form)\b[\s\S]*?<\/\1>/gi, "");
  h = h.replace(/<li\b[^>]*>/gi, "\n- ").replace(/<(br|hr)\s*\/?>/gi, "\n").replace(/<\/?(p|div|section|h[1-6]|ul|ol|table|tr|blockquote|figure|dl|dt|dd|details|summary)\b[^>]*>/gi, "\n").replace(/<\/(td|th)>/gi, "\t").replace(/<[^>]+>/g, "");
  // \r, zero-width characters and every other kind of space become plain spaces/newlines before collapsing
  const text = decode(h).replace(/\r\n?/g, "\n").replace(/[\u200b-\u200d\ufeff]/g, "").replace(/[^\S\n]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return { title, text };
}

const CHALLENGE = /eval\(function\(p,a,c,k,e,d\)|cf-chl|__cf_chl|Just a moment\.\.\.|challenge-platform|Attention Required! \| Cloudflare|_Incapsula_|Request unsuccessful\. Incapsula|px-captcha|Checking your browser|are you a robot|enable javascript and cookies to continue/i;
function blockedReason(status, body) {
  if (CHALLENGE.test(body.slice(0, 20000))) return "bot challenge page";
  if ([401, 403, 407, 429, 451, 503].includes(status)) return `HTTP ${status}`;
  if (status >= 400) return `HTTP ${status}`;
  return null;
}

// Minimal robots.txt: the group for our UA token, else "*". Longest matching Allow/Disallow wins.
function robotsAllowed(robotsTxt, pathname, uaToken = "ai-policy-atlas") {
  const groups = []; let cur = null;
  for (const raw of robotsTxt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim(); if (!line) continue;
    const [k, ...rest] = line.split(":"); const v = rest.join(":").trim(); const key = k.toLowerCase();
    if (key === "user-agent") { if (!cur || cur.rules.length) groups.push((cur = { agents: [], rules: [] })); cur.agents.push(v.toLowerCase()); }
    else if (cur && (key === "allow" || key === "disallow")) cur.rules.push({ allow: key === "allow", path: v });
  }
  const mine = groups.find((g) => g.agents.some((a) => a !== "*" && uaToken.toLowerCase().includes(a))) || groups.find((g) => g.agents.includes("*"));
  if (!mine) return true;
  let best = null;
  for (const r of mine.rules) {
    if (r.path === "") continue;
    const re = new RegExp("^" + r.path.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$"));
    if (re.test(pathname) && (!best || r.path.length >= best.path.length)) best = r;
  }
  return best ? best.allow : true;
}

const today = () => new Date().toISOString().slice(0, 10);
function paths(dir) {
  return { snaps: path.join(dir, "snapshots"), raw: path.join(dir, "raw"), hist: path.join(dir, "snapshots-history"), manifest: path.join(dir, "manifest.json") };
}
function readManifest(dir) { const p = paths(dir).manifest; return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : []; }
function writeManifest(dir, rows) { fs.writeFileSync(paths(dir).manifest, JSON.stringify(rows, null, 1) + "\n"); }
function upsert(rows, row) { const i = rows.findIndex((r) => r.doc_id === row.doc_id); if (i >= 0) rows[i] = { ...rows[i], ...row }; else rows.push(row); }

function toText(buf, contentType, rawPath) {
  if (/pdf/i.test(contentType) || buf.slice(0, 4).toString() === "%PDF") {
    const r = spawnSync("pdftotext", [rawPath, "-"], { encoding: "utf8", maxBuffer: 1 << 28 });
    if (r.status === 0 && r.stdout.trim()) return { title: null, text: r.stdout.trim(), kind: "pdf" };
    return { title: null, text: null, kind: "pdf", needsText: true };
  }
  const body = buf.toString("utf8");
  if (/html|xml/i.test(contentType) || /<html|<!doctype html/i.test(body.slice(0, 500))) { const { title, text } = htmlToText(body); return { title, text, kind: "html" }; }
  return { title: null, text: body.trim(), kind: "text" };
}

function save(dir, doc_id, text) {
  const P = paths(dir); fs.mkdirSync(P.snaps, { recursive: true });
  const f = path.join(P.snaps, doc_id + ".txt");
  if (fs.existsSync(f)) {
    const old = fs.readFileSync(f, "utf8");
    if (old !== text + "\n") { fs.mkdirSync(path.join(P.hist, doc_id), { recursive: true }); fs.writeFileSync(path.join(P.hist, doc_id, `${today()}.txt`), old); }
  }
  fs.writeFileSync(f, text + "\n");
}

async function fetchOne(t, ctx) {
  const url = new URL(t.url);
  const row = { doc_id: t.doc_id, url: t.url, retrieved: today(), method: "fetch" };
  try {
    if (!ctx.robots.has(url.origin)) {
      let txt = ""; try { const r = await fetch(url.origin + "/robots.txt", { headers: { "user-agent": ctx.ua }, signal: AbortSignal.timeout(20000) }); if (r.ok && /text|plain/i.test(r.headers.get("content-type") || "text")) txt = await r.text(); } catch {}
      ctx.robots.set(url.origin, txt);
    }
    if (!robotsAllowed(ctx.robots.get(url.origin), url.pathname + url.search)) return { ...row, status: "robots_disallowed" };
    const res = await fetch(url, { headers: { "user-agent": ctx.ua, accept: "text/html,application/pdf;q=0.9,*/*;q=0.5", "accept-language": "en" }, redirect: "follow", signal: AbortSignal.timeout(60000) });
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get("content-type") || "";
    const why = blockedReason(res.status, buf.toString("utf8", 0, 20000));
    row.final_url = res.url; row.http = res.status; row.content_type = ct; row.bytes = buf.length;
    if (why) return { ...row, status: "blocked", blocked_reason: why };
    if (/login|signin|sso|saml/i.test(new URL(res.url).pathname + new URL(res.url).hostname) && !/login|signin|sso|saml/i.test(url.pathname + url.hostname)) return { ...row, status: "blocked", blocked_reason: "redirected to a login page" };
    const P = paths(ctx.dir); fs.mkdirSync(P.raw, { recursive: true });
    const ext = /pdf/i.test(ct) ? "pdf" : /html/i.test(ct) ? "html" : "bin";
    const rawPath = path.join(P.raw, `${t.doc_id}.${ext}`); fs.writeFileSync(rawPath, buf);
    const { title, text, needsText } = toText(buf, ct, rawPath);
    row.sha256 = sha256(buf); row.title = title;
    if (needsText || !text) return { ...row, status: /html/i.test(ct) && !needsText ? "js_shell" : "needs_text", words: 0 };
    const words = text.split(/\s+/).length;
    // An HTML page that renders no text without JavaScript is not an archive of the policy.
    if (/html/i.test(ct) && words < 40) return { ...row, status: "js_shell", words };
    save(ctx.dir, t.doc_id, text);
    return { ...row, status: "ok", words, thin: words < 300 };
  } catch (e) {
    return { ...row, status: "error", blocked_reason: String(e.message || e).slice(0, 200) };
  }
}

async function cmdFetch(file, o) {
  if (!o.contact) { console.error("--contact <email or URL> is required: it goes in the User-Agent so site owners can reach you."); process.exit(2); }
  const targets = JSON.parse(fs.readFileSync(file, "utf8"));
  const ctx = { dir: o.dir, robots: new Map(), ua: `ai-policy-atlas/0.4 (research; contact: ${o.contact})` };
  const rows = readManifest(o.dir); const lastHit = new Map(); const delay = Number(o.delay || 3000);
  for (const [i, t] of targets.entries()) {
    const host = new URL(t.url).host; const wait = (lastHit.get(host) || 0) + delay - Date.now(); if (wait > 0) await sleep(wait);
    const r = await fetchOne(t, ctx); lastHit.set(host, Date.now());
    upsert(rows, r); writeManifest(o.dir, rows);
    console.log(`[${i + 1}/${targets.length}] ${r.status.padEnd(17)} ${t.doc_id}${r.blocked_reason ? "  (" + r.blocked_reason + ")" : ""}`);
  }
}

function cmdImport(file, o) {
  if (!o.id || !o.url) { console.error("import needs --id <doc_id> and --url <original url>"); process.exit(2); }
  const buf = fs.readFileSync(file); const P = paths(o.dir); fs.mkdirSync(P.raw, { recursive: true });
  const ext = path.extname(file).slice(1) || "bin"; const rawPath = path.join(P.raw, `${o.id}.${ext}`); fs.writeFileSync(rawPath, buf);
  const ct = ext === "pdf" ? "application/pdf" : /html?/.test(ext) ? "text/html" : "text/plain";
  const { title, text, needsText } = toText(buf, ct, rawPath);
  const rows = readManifest(o.dir);
  const row = { doc_id: o.id, url: o.url, retrieved: today(), method: "manual-import", sha256: sha256(buf), title, bytes: buf.length };
  if (needsText || !text) upsert(rows, { ...row, status: "needs_text" }); else { save(o.dir, o.id, text); upsert(rows, { ...row, status: "ok", words: text.split(/\s+/).length }); }
  writeManifest(o.dir, rows); console.log(`imported ${o.id}: ${rows.find((r) => r.doc_id === o.id).status}`);
}

function cmdStatus(o) {
  const rows = readManifest(o.dir); const by = {};
  for (const r of rows) (by[r.status] ||= []).push(r);
  for (const [k, v] of Object.entries(by)) console.log(`${k}: ${v.length}`);
  for (const r of rows.filter((r) => r.status !== "ok" || r.thin)) console.log(`  ${(r.thin && r.status === "ok" ? "ok (thin, " + r.words + "w)" : r.status).padEnd(17)} ${r.doc_id}  ${r.blocked_reason || ""}\n      ${r.url}`);
}

module.exports = { htmlToText, blockedReason, robotsAllowed, sha256 };

if (require.main === module) {
  const argv = process.argv.slice(2); const cmd = argv[0]; const o = { dir: "data/policy" }; const pos = [];
  for (let i = 1; i < argv.length; i++) { if (argv[i].startsWith("--")) { o[argv[i].slice(2)] = argv[i + 1]; i++; } else pos.push(argv[i]); }
  if (cmd === "fetch" && pos[0]) cmdFetch(pos[0], o).catch((e) => { console.error(e); process.exit(1); });
  else if (cmd === "import" && pos[0]) cmdImport(pos[0], o);
  else if (cmd === "status") cmdStatus(o);
  else { console.error(fs.readFileSync(__filename, "utf8").split("\n").slice(1, 12).join("\n").replace(/^\/\/ ?/gm, "")); process.exit(2); }
}
module.exports.cmdFetch = cmdFetch; module.exports.cmdImport = cmdImport; module.exports.readManifest = readManifest;
