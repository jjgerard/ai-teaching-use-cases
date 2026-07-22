const nodemailer = require("nodemailer");

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL;

const configured = !!(GMAIL_USER && GMAIL_APP_PASSWORD && NOTIFY_EMAIL);

const transporter = configured
  ? nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    })
  : null;

if (!configured) {
  console.warn(
    "Email notifications disabled — set GMAIL_USER, GMAIL_APP_PASSWORD and NOTIFY_EMAIL to enable them."
  );
}

async function notifyNewSubmission(entry, adminUrl) {
  if (!transporter) return;
  const lines = [
    `Title: ${entry.t}`,
    `Contributor: ${entry.by}${entry.inst ? ` (${entry.inst})` : ""}`,
    `Source: ${entry.u}`,
    entry.reg ? `Region: ${entry.reg}` : null,
    entry.th ? `Theme: ${entry.th}` : null,
    entry.disc && entry.disc.length ? `Discipline(s): ${entry.disc.join(", ")}` : null,
    entry.tool && entry.tool.length ? `Tool(s): ${entry.tool.join(", ")}` : null,
    "",
    "Summary:",
    entry.s,
    "",
    `Review it: ${adminUrl}`,
  ].filter((l) => l !== null);

  try {
    await transporter.sendMail({
      from: GMAIL_USER,
      to: NOTIFY_EMAIL,
      subject: `New case study submission: ${entry.t}`,
      text: lines.join("\n"),
    });
  } catch (err) {
    console.error("Failed to send submission notification email:", err.message);
  }
}

module.exports = { notifyNewSubmission };
