const test = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { htmlToText, blockedReason, robotsAllowed, cmdFetch, cmdImport, readManifest } = require("../fetch.js");

test("htmlToText keeps wording, drops chrome, decodes entities, keeps list structure", () => {
  const { title, text } = htmlToText(`<html><head><title>AI &amp; you</title><script>var x=1</script></head><body><nav>MENU</nav><main><h1>Using AI</h1><p>Don&rsquo;t copy&nbsp;paste.</p><ul><li>Declare use</li><li>Verify</li></ul></main><footer>FOOT</footer></body></html>`);
  assert.equal(title, "AI & you");
  assert.match(text, /Don\u2019t copy paste\./);
  assert.match(text, /- Declare use\n- Verify/);
  assert.ok(!/MENU|FOOT|var x/.test(text));
});
test("without <main> it drops nav/header/footer", () => {
  const { text } = htmlToText("<body><header>H</header><div>Real text</div><footer>F</footer></body>");
  assert.equal(text, "Real text");
});
test("bot challenges and 4xx are blocked, ordinary pages are not", () => {
  assert.equal(blockedReason(200, "<title>Just a moment...</title>"), "bot challenge page");
  assert.equal(blockedReason(403, "forbidden"), "HTTP 403");
  assert.equal(blockedReason(404, "x"), "HTTP 404");
  assert.equal(blockedReason(200, "<p>A normal policy page about enable javascript in class</p>"), null);
});
test("robots.txt: our group beats *, longest match wins, empty disallow allows", () => {
  const r = "User-agent: *\nDisallow: /private/\nAllow: /private/ok\n\nUser-agent: ai-policy-atlas\nDisallow: /blocked\n";
  assert.equal(robotsAllowed(r, "/blocked/x"), false);
  assert.equal(robotsAllowed(r, "/private/x"), true); // our own group has no rule for /private
  const r2 = "User-agent: *\nDisallow: /private/\nAllow: /private/ok";
  assert.equal(robotsAllowed(r2, "/private/x"), false);
  assert.equal(robotsAllowed(r2, "/private/ok/page"), true);
  assert.equal(robotsAllowed("User-agent: *\nDisallow:", "/anything"), true);
  assert.equal(robotsAllowed("", "/anything"), true);
});

test("fetch end to end: ok, blocked, robots, change history, import", async () => {
  let version = 1;
  const server = http.createServer((req, res) => {
    if (req.url === "/robots.txt") { res.setHeader("content-type", "text/plain"); return res.end("User-agent: *\nDisallow: /secret"); }
    if (req.url === "/policy") { res.setHeader("content-type", "text/html"); return res.end(`<title>P</title><main><p>Rule v${version}</p></main>`); }
    if (req.url === "/wall") { res.setHeader("content-type", "text/html"); res.statusCode = 403; return res.end("<title>Just a moment...</title>cf-chl"); }
    if (req.url === "/secret") { res.setHeader("content-type", "text/html"); return res.end("<main>should not be fetched</main>"); }
    res.statusCode = 404; res.end("no");
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fetchtest-"));
  const targets = path.join(dir, "targets.json");
  fs.writeFileSync(targets, JSON.stringify([{ doc_id: "a", url: base + "/policy" }, { doc_id: "b", url: base + "/wall" }, { doc_id: "c", url: base + "/secret" }]));
  const log = console.log; console.log = () => {};
  try {
    await cmdFetch(targets, { dir, contact: "test@example.org", delay: 0 });
    let m = Object.fromEntries(readManifest(dir).map((r) => [r.doc_id, r]));
    assert.equal(m.a.status, "ok"); assert.equal(m.b.status, "blocked"); assert.equal(m.c.status, "robots_disallowed");
    assert.match(fs.readFileSync(path.join(dir, "snapshots", "a.txt"), "utf8"), /Rule v1/);
    assert.ok(!fs.existsSync(path.join(dir, "snapshots", "b.txt")), "blocked pages are never saved as snapshots");
    assert.ok(!fs.existsSync(path.join(dir, "snapshots", "c.txt")));
    version = 2;
    await cmdFetch(targets, { dir, contact: "test@example.org", delay: 0 });
    assert.match(fs.readFileSync(path.join(dir, "snapshots", "a.txt"), "utf8"), /Rule v2/);
    const hist = fs.readdirSync(path.join(dir, "snapshots-history", "a"));
    assert.equal(hist.length, 1);
    assert.match(fs.readFileSync(path.join(dir, "snapshots-history", "a", hist[0]), "utf8"), /Rule v1/);
    const saved = path.join(dir, "saved.html"); fs.writeFileSync(saved, "<main><p>Saved by hand</p></main>");
    cmdImport(saved, { dir, id: "b", url: base + "/wall" });
    m = Object.fromEntries(readManifest(dir).map((r) => [r.doc_id, r]));
    assert.equal(m.b.status, "ok"); assert.equal(m.b.method, "manual-import");
    assert.match(fs.readFileSync(path.join(dir, "snapshots", "b.txt"), "utf8"), /Saved by hand/);
  } finally { console.log = log; server.close(); }
});
