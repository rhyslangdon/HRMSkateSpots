/**
 * EMAIL SERVICE — Low-level email sender using Nodemailer + Gmail SMTP.
 *
 * HOW IT WORKS:
 * 1. Nodemailer is an npm package that lets Node.js apps send emails.
 * 2. We create a "transporter" — this is the connection to Gmail's SMTP server.
 * 3. The transporter uses our Gmail app password (NOT regular password) to authenticate.
 * 4. Any part of our app can call sendEmail() with a recipient, subject, and body.
 *
 * SMTP CREDENTIALS (from .env.local):
 *   SMTP_HOST = smtp.gmail.com        (Gmail's mail server)
 *   SMTP_PORT = 587                   (standard TLS port)
 *   SMTP_USER = hrmskatespots@gmail.com
 *   SMTP_PASS = <Gmail App Password>  (generated in Google Account settings)
 *   SMTP_FROM = "HRM Skate Spots <hrmskatespots@gmail.com>"
 *
 * NOTE: This is used for OUR app emails (premium welcome, downgrade notice).
 *       Auth emails (verification, password reset) are sent by Supabase separately.
 */
import nodemailer from 'nodemailer';

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  // Create a transporter — this establishes the connection to Gmail's SMTP server.
  // Think of it like opening a mailbox: we tell nodemailer WHERE to send (host/port)
  // and WHO we are (user/pass).
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, // smtp.gmail.com
    port: Number(process.env.SMTP_PORT) || 587, // 587 = TLS encrypted
    secure: process.env.SMTP_SECURE === 'true', // false for port 587 (uses STARTTLS)
    auth: {
      user: process.env.SMTP_USER, // Gmail address
      pass: process.env.SMTP_PASS, // Gmail App Password (NOT regular password)
    },
  });

  // Actually send the email. Gmail delivers it to the recipient's inbox.
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER, // "From" address shown in email
    to, // Recipient's email address
    subject, // Email subject line
    text, // Plain-text fallback (for email clients that don't support HTML)
    html, // Rich HTML version (what most people see)
  });
}
