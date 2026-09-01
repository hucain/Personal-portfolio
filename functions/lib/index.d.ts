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
export declare const handleContactForm: import("firebase-functions/v2/https").HttpsFunction;
export declare const handleReply: import("firebase-functions/v2/https").HttpsFunction;
//# sourceMappingURL=index.d.ts.map