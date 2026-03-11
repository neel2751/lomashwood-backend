import nodemailer from "nodemailer";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || "Lomash Wood <notifications@lomashwood.co.uk>";

function hasSmtpConfig() {
  return !!(smtpHost && smtpUser && smtpPass);
}

function getTransport() {
  if (!hasSmtpConfig()) {
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

export async function sendSystemEmail(input: SendEmailInput) {
  const transporter = getTransport();

  if (!transporter) {
    console.info("[EMAIL_DISABLED] Missing SMTP config, email not sent", {
      to: input.to,
      subject: input.subject,
    });
    return { sent: false, reason: "SMTP_NOT_CONFIGURED" };
  }

  await transporter.sendMail({
    from: smtpFrom,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  return { sent: true };
}
