/**
 * Firebase Cloud Functions — Email Delivery
 *
 * Uses Nodemailer + Gmail SMTP for reliable email delivery.
 *
 * SETUP (one-time):
 * 1. Go to https://myaccount.google.com/security
 * 2. Enable 2-Step Verification
 * 3. Go to https://myaccount.google.com/apppasswords
 * 4. Create an App Password (select "Mail" and "Other")
 * 5. Copy the 16-character password
 * 6. Run:
 *    firebase functions:secrets:set GMAIL_APP_PASSWORD
 *    (paste the 16-char password when prompted)
 * 7. Deploy: firebase deploy --only functions
 */
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";
import * as nodemailer from "nodemailer";
// ---------------------------------------------------------------------------
// Initialize the Admin SDK
// ---------------------------------------------------------------------------
initializeApp();
const db = getFirestore();
// Config via Firebase environment
const ADMIN_EMAIL = defineString("ADMIN_EMAIL", {
    default: "hucainomar490@gmail.com",
});
const GMAIL_APP_PASSWORD = defineString("GMAIL_APP_PASSWORD");
// ---------------------------------------------------------------------------
// Nodemailer transporter — Gmail SMTP
// ---------------------------------------------------------------------------
function getTransporter() {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: ADMIN_EMAIL.value(),
            pass: GMAIL_APP_PASSWORD.value(),
        },
    });
}
// ---------------------------------------------------------------------------
// HTML email helpers
// ---------------------------------------------------------------------------
function baseStyles() {
    return `
    body { margin: 0; padding: 0; background: #121018; font-family: 'Segoe UI', system-ui, sans-serif; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 24px; }
    .card { background: #1b1824; border: 1px solid rgba(243,239,230,0.1); border-radius: 16px; padding: 32px; }
    .label { font-size: 11px; font-weight: 600; letter-spacing: 0.14em; color: #d4b483; text-transform: uppercase; margin-bottom: 6px; }
    .heading { font-size: 24px; font-weight: 500; color: #f3efe6; margin: 0 0 16px; }
    .text { font-size: 14px; line-height: 1.7; color: #a8a29a; }
    .value { font-size: 14px; color: #f3efe6; margin: 0 0 16px; }
    .message-box { background: #121018; border: 1px solid rgba(243,239,230,0.1); border-radius: 12px; padding: 16px; margin: 16px 0; }
    .divider { border: none; border-top: 1px solid rgba(243,239,230,0.1); margin: 20px 0; }
    .footer { font-size: 12px; color: #666; text-align: center; margin-top: 32px; }
    .btn { display: inline-block; background: #d4b483; color: #121018; text-decoration: none; padding: 12px 28px; border-radius: 999px; font-weight: 600; font-size: 14px; }
  `;
}
function notificationEmailHtml(name, email, subject, type, message, docId) {
    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>${baseStyles()}</style></head>
    <body>
      <div class="container">
        <div class="card">
          <div class="label">Portfolio Inquiry</div>
          <div class="heading">${escapeHtml(subject)}</div>

          <div class="label">From</div>
          <p class="value">${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>

          <div class="label">Type</div>
          <p class="value">${escapeHtml(type)}</p>

          <hr class="divider">

          <div class="label">Message</div>
          <div class="message-box">
            <p class="text" style="white-space:pre-wrap">${escapeHtml(message)}</p>
          </div>

          <hr class="divider">

          <div class="text" style="font-size:12px">
            <strong>Reply to ${escapeHtml(name)}</strong> from the Admin Dashboard,
            or reply directly to this email in Gmail.
          </div>

          <div class="footer">M. Hussain Umer Portfolio · ${docId}</div>
        </div>
      </div>
    </body>
    </html>
  `;
}
function replyEmailHtml(adminName, reply, originalSubject, originalMessage) {
    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>${baseStyles()}</style></head>
    <body>
      <div class="container">
        <div class="card">
          <div class="label">Reply from ${escapeHtml(adminName)}</div>
          <div class="heading">Re: ${escapeHtml(originalSubject)}</div>

          <div class="message-box">
            <p class="text" style="white-space:pre-wrap">${escapeHtml(reply)}</p>
          </div>

          <hr class="divider">

          <div class="label">Your Original Message</div>
          <div class="message-box">
            <p class="text" style="white-space:pre-wrap; font-size:13px; color:#888">${escapeHtml(originalMessage)}</p>
          </div>

          <div class="footer">M. Hussain Umer Portfolio</div>
        </div>
      </div>
    </body>
    </html>
  `;
}
function confirmationEmailHtml(visitorName, subject) {
    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>${baseStyles()}</style></head>
    <body>
      <div class="container">
        <div class="card">
          <div class="label">Message Received</div>
          <div class="heading">Thank you, ${escapeHtml(visitorName)}!</div>

          <p class="text">
            Your message regarding <strong>${escapeHtml(subject)}</strong> has been received successfully.
          </p>

          <hr class="divider">

          <p class="text">
            I review every message personally and will get back to you as soon as possible — usually within a day.
          </p>

          <p class="text" style="margin-top: 20px">
            Best regards,<br>
            <strong style="color: #f3efe6">M. Hussain Umer</strong><br>
            <span style="color: #a8a29a; font-size: 13px">AI Web Developer & Frontend Specialist</span>
          </p>

          <div class="footer">M. Hussain Umer Portfolio</div>
        </div>
      </div>
    </body>
    </html>
  `;
}
function replySentCopyHtml(visitorName, visitorEmail, subject, reply) {
    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>${baseStyles()}</style></head>
    <body>
      <div class="container">
        <div class="card">
          <div class="label">Reply Sent</div>
          <div class="heading">Re: ${escapeHtml(subject)}</div>

          <div class="label">Sent to</div>
          <p class="value">${escapeHtml(visitorName)} &lt;${escapeHtml(visitorEmail)}&gt;</p>

          <div class="label">Your Reply</div>
          <div class="message-box">
            <p class="text" style="white-space:pre-wrap">${escapeHtml(reply)}</p>
          </div>

          <div class="footer">M. Hussain Umer Portfolio · Copy for your records</div>
        </div>
      </div>
    </body>
    </html>
  `;
}
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
function validate(payload) {
    const name = String(payload.name ?? "").trim();
    const email = String(payload.email ?? "").trim();
    const subject = String(payload.subject ?? "").trim();
    const type = String(payload.type ?? "").trim();
    const message = String(payload.message ?? "").trim();
    if (name.length < 1 || name.length > 80)
        return { ok: false, error: "Name must be between 1 and 80 characters." };
    if (email.length < 6 || email.length > 254)
        return { ok: false, error: "Email must be between 6 and 254 characters." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return { ok: false, error: "Invalid email format." };
    if (subject.length < 1 || subject.length > 200)
        return { ok: false, error: "Subject must be between 1 and 200 characters." };
    if (type.length < 1 || type.length > 40)
        return { ok: false, error: "Type must be between 1 and 40 characters." };
    if (message.length < 1 || message.length > 5000)
        return { ok: false, error: "Message must be between 1 and 5000 characters." };
    const dangerous = /<script|javascript:|data:|vbscript:|on\w+\s*=/i;
    if (dangerous.test(name) || dangerous.test(message) || dangerous.test(subject))
        return { ok: false, error: "Message contains disallowed content." };
    return { ok: true, data: { name, email, subject, type, message } };
}
// ---------------------------------------------------------------------------
// Rate limiter
// ---------------------------------------------------------------------------
const MAX_MESSAGES_PER_HOUR = 3;
async function checkRateLimit(ip) {
    const cutoff = Date.now() - 60 * 60 * 1000;
    const snap = await db
        .collection("messages")
        .where("createdAt", ">=", new Date(cutoff))
        .get();
    const count = snap.docs.filter((doc) => doc.data().ip === ip).length;
    if (count >= MAX_MESSAGES_PER_HOUR) {
        const oldest = snap.docs
            .filter((doc) => doc.data().ip === ip)
            .sort((a, b) => (a.data().createdAt?.toMillis?.() ?? 0) - (b.data().createdAt?.toMillis?.() ?? 0))[0];
        if (oldest) {
            const oldestTime = oldest.data().createdAt?.toMillis?.() ?? Date.now();
            const retryAfter = Math.ceil((oldestTime + 60 * 60 * 1000 - Date.now()) / 1000);
            return { allowed: false, retryAfter: Math.max(retryAfter, 60) };
        }
        return { allowed: false, retryAfter: 3600 };
    }
    return { allowed: true };
}
// ---------------------------------------------------------------------------
// Cloud Function: handleContactForm
// ---------------------------------------------------------------------------
export const handleContactForm = onRequest({
    region: "us-central1",
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 15,
    invoker: "public",
}, async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).json({ ok: false, error: "Method not allowed." });
        return;
    }
    const forwarded = req.headers["x-forwarded-for"];
    const ip = (typeof forwarded === "string" ? forwarded.split(",")[0] : null)
        ?? req.ip
        ?? "unknown";
    const rateCheck = await checkRateLimit(ip);
    if (!rateCheck.allowed) {
        res.status(429).json({
            ok: false,
            error: `Too many submissions. Please try again in ${Math.ceil((rateCheck.retryAfter ?? 3600) / 60)} minutes.`,
        });
        return;
    }
    const result = validate(req.body);
    if (!result.ok || !result.data) {
        res.status(400).json({ ok: false, error: result.error });
        return;
    }
    const data = result.data;
    const now = new Date();
    const docId = `msg_${now.getTime()}`;
    try {
        await db.collection("messages").doc(docId).set({
            name: data.name,
            email: data.email,
            subject: data.subject,
            type: data.type,
            message: data.message,
            createdAt: FieldValue.serverTimestamp(),
            replied: false,
            reply: "",
            ip,
        });
        // Send email notifications via Gmail SMTP
        try {
            const transporter = getTransporter();
            // 1. Notification email to admin
            await transporter.sendMail({
                from: `"Portfolio Contact Form" <${ADMIN_EMAIL.value()}>`,
                to: ADMIN_EMAIL.value(),
                replyTo: `"${data.name}" <${data.email}>`,
                subject: `[Portfolio Inquiry] ${data.subject} (${data.type})`,
                html: notificationEmailHtml(data.name, data.email, data.subject, data.type, data.message, docId),
                text: `New inquiry from ${data.name} (${data.email})\nType: ${data.type}\nSubject: ${data.subject}\n\n${data.message}`,
            });
            console.log(`✅ Notification email sent to admin for ${docId}`);
            // 2. Confirmation email to client
            await transporter.sendMail({
                from: `"M. Hussain Umer" <${ADMIN_EMAIL.value()}>`,
                to: data.email,
                subject: `Message Received — ${data.subject}`,
                html: confirmationEmailHtml(data.name, data.subject),
                text: `Hi ${data.name},\n\nYour message regarding "${data.subject}" has been received successfully.\n\nI review every message personally and will get back to you as soon as possible — usually within a day.\n\nBest regards,\nM. Hussain Umer\nAI Web Developer & Frontend Specialist`,
            });
            console.log(`✅ Confirmation email sent to ${data.email} for ${docId}`);
        }
        catch (emailErr) {
            console.error("❌ Email delivery failed:", emailErr);
            // Firestore message is already saved — email failure does not delete it
        }
        res.status(201).json({
            ok: true,
            id: docId,
            data: {
                name: data.name,
                email: data.email,
                subject: data.subject,
                type: data.type,
                message: data.message,
                createdAt: now.toISOString(),
                replied: false,
                reply: "",
            },
        });
    }
    catch (error) {
        console.error("Firestore write failed:", error);
        res.status(500).json({
            ok: false,
            error: "Could not save your message. Please try again.",
        });
    }
});
// ---------------------------------------------------------------------------
// Cloud Function: handleReply
// ---------------------------------------------------------------------------
export const handleReply = onRequest({
    region: "us-central1",
    cors: true,
    maxInstances: 5,
    timeoutSeconds: 15,
    invoker: "public",
}, async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).json({ ok: false, error: "Method not allowed." });
        return;
    }
    // Verify admin auth
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ ok: false, error: "Authentication required." });
        return;
    }
    try {
        const token = await getAuth().verifyIdToken(authHeader.slice(7));
        if (token.admin !== true && token.email !== ADMIN_EMAIL.value()) {
            res.status(403).json({ ok: false, error: "Admin privileges required." });
            return;
        }
    }
    catch {
        res.status(401).json({ ok: false, error: "Invalid or expired token." });
        return;
    }
    const body = req.body;
    const messageId = String(body.messageId ?? "").trim();
    const reply = String(body.reply ?? "").trim();
    const visitorEmail = String(body.visitorEmail ?? "").trim();
    const visitorName = String(body.visitorName ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const originalMessage = String(body.originalMessage ?? "").trim();
    if (!messageId || messageId.length > 60) {
        res.status(400).json({ ok: false, error: "Invalid message ID." });
        return;
    }
    if (reply.length < 2 || reply.length > 2000) {
        res.status(400).json({ ok: false, error: "Reply must be between 2 and 2000 characters." });
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visitorEmail)) {
        res.status(400).json({ ok: false, error: "Invalid visitor email." });
        return;
    }
    // Update Firestore
    try {
        await db.collection("messages").doc(messageId).update({
            reply,
            replied: true,
            repliedAt: FieldValue.serverTimestamp(),
        });
    }
    catch (error) {
        console.error("Firestore update failed:", error);
        res.status(500).json({ ok: false, error: "Could not save reply." });
        return;
    }
    // Send emails via Gmail SMTP
    try {
        const transporter = getTransporter();
        // 1. Send reply TO the visitor (they receive it in their Gmail)
        await transporter.sendMail({
            from: `"M. Hussain Umer" <${ADMIN_EMAIL.value()}>`,
            to: visitorEmail,
            replyTo: `"M. Hussain Umer" <${ADMIN_EMAIL.value()}>`,
            subject: `Re: ${subject}`,
            html: replyEmailHtml("M. Hussain Umer", reply, subject, originalMessage),
            text: reply,
        });
        console.log(`✅ Reply email sent to ${visitorEmail}`);
        // 2. Send a copy TO the admin (so they see it in their Gmail too)
        await transporter.sendMail({
            from: `"M. Hussain Umer (Portfolio)" <${ADMIN_EMAIL.value()}>`,
            to: ADMIN_EMAIL.value(),
            replyTo: `"${visitorName}" <${visitorEmail}>`,
            subject: `[Reply Sent] Re: ${subject} → ${visitorName}`,
            html: replySentCopyHtml(visitorName, visitorEmail, subject, reply),
            text: `Reply sent to ${visitorName} <${visitorEmail}>\n\nSubject: Re: ${subject}\n\n${reply}`,
        });
        console.log(`✅ Admin copy sent for reply to ${visitorName}`);
    }
    catch (emailErr) {
        console.error("❌ Reply email failed:", emailErr);
        // Still return 200 — the reply is saved in Firestore
    }
    res.status(200).json({ ok: true });
});
//# sourceMappingURL=index.js.map