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
  // entry already matches the exact schema /api/admin/publish expects, so this
  // block can be copied straight out of the email and pasted into the admin
  // dashboard's "Add from email" box — no need for the original database row
  // (which, on a host with no persistent disk, might not survive until review)
  // to still exist.
  const pasteBlock = JSON.stringify(entry);
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
    `Review normally: ${adminUrl}`,
    "",
    "— or —",
    "",
    `Paste this block into the admin dashboard's "Add from email" box to`,
    `publish it directly, even if it's no longer in the review queue:`,
    "",
    pasteBlock,
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

async function notifyNewLead(lead, adminUrl) {
  if (!transporter) return;
  const lines = [
    `Someone suggested a repository of case studies to look through:`,
    "",
    `URL: ${lead.url}`,
    lead.note ? `Note: ${lead.note}` : null,
    "",
    `See it in the dashboard: ${adminUrl}`,
  ].filter((l) => l !== null);

  try {
    await transporter.sendMail({
      from: GMAIL_USER,
      to: NOTIFY_EMAIL,
      subject: `New repository suggestion: ${lead.url}`,
      text: lines.join("\n"),
    });
  } catch (err) {
    console.error("Failed to send repository-suggestion notification email:", err.message);
  }
}

async function notifyEditRequest(req) {
  if (!transporter) return;
  const lines = [
    `Someone requested an edit to an existing catalog entry:`,
    "",
    `Entry: ${req.entryTitle}`,
    req.entryUrl ? `Catalog source: ${req.entryUrl}` : null,
    `Requester email: ${req.email}`,
    "",
    "Requested change:",
    req.description,
  ].filter((l) => l !== null);

  try {
    await transporter.sendMail({
      from: GMAIL_USER,
      to: NOTIFY_EMAIL,
      subject: `Edit request: ${req.entryTitle}`,
      text: lines.join("\n"),
    });
  } catch (err) {
    console.error("Failed to send edit-request notification email:", err.message);
  }
}

async function sendEditRequestConfirmation(req) {
  if (!transporter) return;
  const lines = [
    `Thanks — your edit request for "${req.entryTitle}" has been sent to the maintainer for review.`,
    "",
    "What you asked for:",
    req.description,
    "",
    "You don't need to do anything else — this is just a confirmation, not a request for a reply.",
  ];
  try {
    await transporter.sendMail({
      from: GMAIL_USER,
      to: req.email,
      subject: `Received your edit request for "${req.entryTitle}"`,
      text: lines.join("\n"),
    });
  } catch (err) {
    console.error("Failed to send edit-request confirmation email:", err.message);
  }
}

async function sendSubmissionConfirmation(email, entry) {
  if (!transporter) return;
  const lines = [
    `Thanks — your submission "${entry.t}" has been sent to the maintainer for review.`,
    "",
    "It'll appear in the public catalog once it's been checked against the site's inclusion criteria.",
    "You don't need to do anything else — this is just a confirmation, not a request for a reply.",
  ];
  try {
    await transporter.sendMail({
      from: GMAIL_USER,
      to: email,
      subject: `Received your submission: ${entry.t}`,
      text: lines.join("\n"),
    });
  } catch (err) {
    console.error("Failed to send submission confirmation email:", err.message);
  }
}

module.exports = {
  notifyNewSubmission,
  notifyNewLead,
  notifyEditRequest,
  sendEditRequestConfirmation,
  sendSubmissionConfirmation,
};
