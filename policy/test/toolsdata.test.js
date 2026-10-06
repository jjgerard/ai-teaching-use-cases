const test = require("node:test"); const assert = require("node:assert");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
const { validateFile } = require("../toolsdata.js");
const real = fs.readFileSync(path.join(__dirname, "..", "..", "data", "policy", "toolsdata-schema.json"), "utf8");
function fx(body) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "td-")); fs.mkdirSync(path.join(root, "snapshots"));
  fs.writeFileSync(path.join(root, "snapshots", "d1.txt"), "Do not upload personal data into AI tools. Use Copilot through your university account. Free versions of ChatGPT are not supported by the university. Data protection law applies.\n");
  fs.writeFileSync(path.join(root, "toolsdata-schema.json"), real);
  const f = path.join(root, "d1.json"); fs.writeFileSync(f, JSON.stringify({ doc_id: "d1", coder: "t", ...body })); return { root, f };
}
test("valid tool, data, safeguard and legal rows pass", () => {
  const { root, f } = fx({ tools: [{ tool_class: "institution_provided_tool", stance: "provided", audience: "both", name: "Copilot", ai_named: true, quote: "Use Copilot through your university account." }], data: [{ data_type: "personal_data", stance: "prohibited", audience: "both", ai_named: true, quote: "Do not upload personal data into AI tools." }], safeguards: [{ value: "use_institutional_account", audience: "students", ai_named: false, quote: "Use Copilot through your university account." }], legal: [{ value: "data_protection", audience: "unspecified", ai_named: false, quote: "Data protection law applies." }] });
  assert.deepEqual(validateFile(f, { root }).errs, []);
});
test("an empty document passes", () => { const a = fx({}); assert.deepEqual(validateFile(a.f, { root: a.root }).errs, []); });
test("unknown values, missing fields, missing quotes, bare conditional and duplicates are rejected", () => {
  const { root, f } = fx({ tools: [{ tool_class: "nope", stance: "provided", audience: "both", ai_named: true, quote: "Use Copilot through your university account." }, { tool_class: "external_or_consumer_tools", stance: "conditional", audience: "both", ai_named: true, quote: "Free versions of ChatGPT are not supported by the university." }, { tool_class: "external_or_consumer_tools", stance: "warned", audience: "both", quote: "Free versions of ChatGPT are not supported by the university." }, { tool_class: "agentic_tools", stance: "prohibited", audience: "students", ai_named: true, quote: "Agents may never be used." }], data: [{ data_type: "personal_data", stance: "prohibited", audience: "both", ai_named: true, quote: "Do not upload personal data into AI tools." }, { data_type: "personal_data", stance: "prohibited", audience: "both", ai_named: true, quote: "Do not upload personal data into AI tools." }] });
  const e = validateFile(f, { root }).errs.join("\n"); for (const re of [/not in the vocabulary/, /conditional needs/, /ai_named must be/, /not in the snapshot/, /listed twice/]) assert.match(e, re);
});
