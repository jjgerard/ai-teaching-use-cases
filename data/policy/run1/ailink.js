// Whether a found quote has an AI link. For second documents (whole procedures or regulations) the audit also counted generic misconduct text;
// those rows are kept in presence.json but reported as "general procedure", not as AI statements.
const AI = /\bAI\b|\bGenAI\b|\bGAI\b|artificial intelligence|generative|chatgpt|copilot|gemini|large language|\bLLM|automated|paraphras|chatbot/i;
module.exports = { hasAiLink: (quote) => AI.test(quote || ""), isSecondDoc: (docId) => /-d2-/.test(docId) };
