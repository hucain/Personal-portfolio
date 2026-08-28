/**
 * Email delivery — EmailJS (automatic) or Gmail mailto: (manual fallback).
 *
 * If EmailJS is configured (.env.local), emails are sent automatically.
 * If not, it opens Gmail compose with everything pre-filled — you just hit Send.
 *
 * ============================================================
 * EASIEST SETUP (5 minutes, free):
 * ============================================================
 *
 * 1. Go to https://www.emailjs.com/ and create a free account
 *
 * 2. Click "Email Services" → "Add New Service" → choose Gmail
 *    → connect your Gmail (hucainomar490@gmail.com)
 *    → copy the SERVICE ID (looks like: service_abc1234)
 *
 * 3. Click "Email Templates" → "Create New Template":
 *
 *    --- Template 1: "contact_notification" ---
 *    Subject: [Portfolio Inquiry] {{subject}} ({{type}})
 *    Content:
 *      New message from {{from_name}} ({{from_email}})
 *
 *      Type: {{type}}
 *      Subject: {{subject}}
 *
 *      {{message}}
 *
 *    --- Template 2: "reply_to_visitor" ---
 *    Subject: Re: {{subject}}
 *    Content:
 *      {{reply}}
 *
 *      ---
 *      Your original message: {{original_message}}
 *
 *    Save both templates. Copy their IDs (look like: template_xyz789)
 *
 * 4. Click "Account" → "API Keys" → copy your Public Key
 *
 * 5. Create a file called .env.local in your project root:
 *    VITE_EMAILJS_SERVICE_ID=service_abc1234
 *    VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
 *    VITE_EMAILJS_TEMPLATE_NOTIFICATION=template_xyz789
 *    VITE_EMAILJS_TEMPLATE_REPLY=template_xyz987
 *
 * 6. Restart your dev server: npm run dev
 *
 * That's it! Emails now send automatically.
 * ============================================================
 */

import emailjs from "@emailjs/browser";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined;
const TEMPLATE_NOTIFICATION = import.meta.env.VITE_EMAILJS_TEMPLATE_NOTIFICATION as string | undefined;
const TEMPLATE_REPLY = import.meta.env.VITE_EMAILJS_TEMPLATE_REPLY as string | undefined;
const ADMIN_EMAIL = "hucainomar490@gmail.com";

let initialized = false;

function ensureInit(): boolean {
  if (initialized) return !!PUBLIC_KEY;
  initialized = true;
  if (PUBLIC_KEY) {
    try { emailjs.init(PUBLIC_KEY); } catch { /* ignore */ }
  }
  return !!SERVICE_ID && !!PUBLIC_KEY && !!TEMPLATE_NOTIFICATION;
}

export function isEmailJSConfigured(): boolean {
  return ensureInit();
}

// ---------------------------------------------------------------------------
// Contact form → open Gmail to notify admin (always works, zero setup)
// ---------------------------------------------------------------------------
export function openGmailContact(params: {
  name: string;
  email: string;
  subject: string;
  type: string;
  message: string;
}): void {
  const to = ADMIN_EMAIL;
  const subject = `[Portfolio Inquiry] ${params.subject} (${params.type})`;
  const body = `Hi Hussain,\n\nNew message from ${params.name} (${params.email}).\nType: ${params.type}\n\n---\n\n${params.message}`;
  const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

// ---------------------------------------------------------------------------
// Reply → open Gmail to reply to visitor (always works, zero setup)
// ---------------------------------------------------------------------------
export function openGmailReply(params: {
  visitorEmail: string;
  visitorName: string;
  subject: string;
  reply: string;
}): void {
  const subject = `Re: ${params.subject}`;
  const body = `Hi ${params.visitorName.split(" ")[0]},\n\n${params.reply}`;
  const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(params.visitorEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

// ---------------------------------------------------------------------------
// EmailJS — automatic email sending (requires setup above)
// ---------------------------------------------------------------------------
export async function sendContactEmailJS(params: {
  name: string;
  email: string;
  subject: string;
  type: string;
  message: string;
}): Promise<boolean> {
  if (!ensureInit() || !SERVICE_ID || !TEMPLATE_NOTIFICATION) return false;

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_NOTIFICATION, {
      to_email: ADMIN_EMAIL,
      from_name: params.name,
      from_email: params.email,
      subject: params.subject,
      type: params.type,
      message: params.message,
    });
    return true;
  } catch (err) {
    console.error("EmailJS contact failed:", err);
    return false;
  }
}

export async function sendReplyEmailJS(params: {
  visitorEmail: string;
  subject: string;
  reply: string;
  originalMessage: string;
}): Promise<boolean> {
  if (!ensureInit() || !SERVICE_ID || !TEMPLATE_REPLY) return false;

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_REPLY, {
      to_email: params.visitorEmail,
      from_email: ADMIN_EMAIL,
      subject: params.subject,
      reply: params.reply,
      original_message: params.originalMessage,
    });
    return true;
  } catch (err) {
    console.error("EmailJS reply failed:", err);
    return false;
  }
}
