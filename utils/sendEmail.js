
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Load local .env values as a fallback for development.
let backendEnv = {};

try {
  backendEnv = dotenv.parse(
    fs.readFileSync(path.join(__dirname, "..", ".env"))
  );
} catch {
  // Render environment variables will be used in production.
}

const getSetting = (name) =>
  process.env[name]?.trim() || backendEnv[name]?.trim() || "";

const sendEmail = async ({
  email,
  subject,
  html,
  attachments = [],
}) => {
  const apiKey = getSetting("MAILTRAP_API_KEY");
  const fromEmail = getSetting("MAILTRAP_FROM_EMAIL");
  const fromName =
    getSetting("MAILTRAP_FROM_NAME") || "J&J K-POP Store";

  if (!apiKey || !fromEmail) {
    throw new Error(
      "Mailtrap API settings are incomplete. Check MAILTRAP_API_KEY and MAILTRAP_FROM_EMAIL."
    );
  }

  if (!email || !subject || !html) {
    throw new Error(
      "Recipient email, subject, and HTML content are required."
    );
  }

  // Convert PDF and other attachments into Base64 for Mailtrap.
  const formattedAttachments = attachments.map((attachment) => ({
    filename: attachment.filename,
    type: attachment.contentType || "application/octet-stream",
    disposition: "attachment",
    content: Buffer.isBuffer(attachment.content)
      ? attachment.content.toString("base64")
      : Buffer.from(attachment.content).toString("base64"),
  }));

  const payload = {
    from: {
      email: fromEmail,
      name: fromName,
    },
    to: [
      {
        email,
      },
    ],
    subject,
    html,
    attachments: formattedAttachments,
  };

  const response = await fetch(
    "https://send.api.mailtrap.io/api/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    }
  );

  const responseText = await response.text();

  let result;

  try {
    result = JSON.parse(responseText);
  } catch {
    result = { message: responseText };
  }

  if (!response.ok) {
    console.error("Mailtrap API error:", response.status, result);

    throw new Error(
      `Mailtrap API failed with status ${response.status}.`
    );
  }

  console.log(
    "Mailtrap API accepted email:",
    result.message_ids || result
  );

  return result;
};

module.exports = sendEmail;
