# Security Verification Guide

This document describes the security posture of the portfolio, the changes made,
and exactly how to verify each protection.

## What was reviewed & changed in this audit

1. **`firestore.rules`** — Hardened (also mirrored in `src/firebase.ts` and published via `firebase.json`).
   - Separated `create`, `update`, and `delete` permissions everywhere (no broad `allow write`).
   - Public portfolio collections: read-public, admin-only create/update/delete.
   - Public contact form: create-only for anonymous, strict field allow-list + type + length checks.
   - Admin message update restricted to ONLY `reply`, `replied`, `repliedAt`.
   - Anonymous users cannot set `replied=true`, add a `reply`, read, update, or delete any message.
   - `createdAt` must be a server timestamp within the last hour and not in the future.
   - Admin updates are restricted with `affectedKeys().hasOnly(...)` on every collection so an
     admin session can never inject unknown fields.
2. **`src/firebase.ts`**
   - `clean()` mirrors server-side length caps (name ≤80, email ≤254, subject ≤200, message ≤5000).
   - Added `safeExternalUrl()` to block `javascript:`, `data:`, `vbscript:` links.
3. **Public render** (`Projects`, `Certificates`) — external links are passed through
   `safeExternalUrl()` and use `rel="noopener noreferrer"`.
4. **`index.html`** — added safe, non-breaking meta headers: `referrer=no-referrer` and a
   restrictive `permissions-policy` (cameras, mic, geolocation, payment, usb, wake-lock).

    A strict Content-Security-Policy meta tag was intentionally NOT added because the
    single-file build inlines JS/CSS; a strict CSP would break the app. Serve the
    recommended CSP at the platform level instead (see "Recommended deployment headers").

## Why Firestore Security Rules are the real security boundary

The admin dashboard gates its UI on `hasAdminClaim()` on the client, but a malicious user can
trivially bypass any client check — so the real authorization is enforced **server-side in
Firestore Rules**. The rules reject every unauthorized read/write regardless of UI state.

- **Admin authorization is custom-claims-only.** The rules use:
  ```
  function isAdmin() {
    return request.auth != null && request.auth.token.admin == true;
  }
  ```
  No admin email is hardcoded into the rules or the client code, so a normal user cannot
  elevate by editing frontend JS.
- The administrator account must be granted the claim once via the Admin SDK (server-side):
  ```
  # requires the Firebase Admin SDK in a trusted server environment (never in the browser)
  admin.auth().setCustomUserClaims(uid, { admin: true });
  ```
  Use the account's Firebase Authentication UID. After assignment, re-authenticate (or call
  `getIdToken(true)`) so the refreshed ID token carries the claim.
- The client uses `hasAdminClaim(user)` (reads the verified ID-token claims via
  `getIdTokenResult`) to show/hide the dashboard. The authoritative gate is the rules.

## Firebase App Check

- **Client-side App Check is implemented.** `src/firebase.ts` lazily calls
  `initializeAppCheck(app, { provider: new ReCaptchaV3Provider(siteKey), isTokenAutoRefreshEnabled: true })`
  using the ReCAPTCHA v3 **site key** from `VITE_RECAPTCHA_SITE_KEY`, and attaches the token to
  the Firestore REST contact-form write via the `X-Firebase-AppCheck` header. The site key is
  public client config; the reCAPTCHA **secret** stays server-side. If the env var is unset, App
  Check is simply not initialized (guarded, non-fatal).
- `firestore.rules` and the in-app mirror include a toggle:
  ```
  const REQUIRE_APP_CHECK = false;
  function validAppCheck() { return !REQUIRE_APP_CHECK || request.token.app_check != null; }
  ```
  `validAppCheck()` is wired into the anonymous contact-form `create` rule.
- **It is intentionally kept `false`** so the form keeps working until App Check is fully
  provisioned. Enable it only after:
  1. In the Firebase console, register your Web app under **App Check** and enable
     **reCAPTCHA v3** (add the site key; leave the SECRET in the console).
  2. Set the public site key as `VITE_RECAPTCHA_SITE_KEY` and rebuild.
  3. Set `REQUIRE_APP_CHECK = true` (in `firestore.rules` AND the mirrored constant in
     `src/firebase.ts`) and redeploy the rules.
  Flipping the toggle before App Check is provisioned will reject all anonymous submissions.
- Firestore Rules **cannot** rate-limit by IP. True bot/rate protection requires App Check
  and/or a Cloud Function. Documented remaining risk.

## Firebase public config vs. secrets

The values in `firebaseConfig` (`apiKey`, `authDomain`, `projectId`, `storageBucket`,
`messagingSenderId`, `appId`) are **public client configuration** meant to ship in the browser.
They are NOT secrets.

Never add these to the frontend: the **service-account JSON private key**, **Admin SDK
credentials**, **Firebase Functions secrets** (e.g., an SMTP/FormSubmit API key, reCAPTCHA site
secret), or your **Firebase Authentication password**.

## Verify with the Firebase Emulator (recommended)

A test suite already exists at `test/firestore.rules.test.ts` covering the matrix below.
It uses `@firebase/rules-unit-testing` (already installed) and Vitest. Install Vitest once:

```
npm i -D vitest firebase-tools
```

Add to `package.json` scripts (or run directly):

```
"test:rules": "firebase emulators:exec --only firestore \"vitest run test/firestore.rules.test.ts --pool=forks\""
```

Then run:

```
npm run test:rules        # or: firebase emulators:exec --only firestore "vitest run test/firestore.rules.test.ts"
```

Notes:
- `@firebase/rules-unit-testing` requires the emulator; it will not run against production.
- The test file references `firestore.rules` under the test environment project id `portfolio-8be6c`.
- The single-file bundle is intentionally excluded from the test run.

### Required test matrix

**Unauthenticated (no auth)**
- CAN read `projects`, `stack`, `workRoles`, `workFocus`, `certificates`.
- CANNOT modify any portfolio document.
- CANNOT read `messages`.
- CAN create a well-formed `messages` doc (valid types + lengths + recent timestamp).
- CANNOT set `replied=true` at creation (create must be rejected).
- CANNOT include an admin `reply` text at creation (must be empty).
- CANNOT create with an extra/unknown field.
- CANNOT update or delete an existing message.
- CANNOT create with a future `createdAt` or a `createdAt` older than 1 hour.

**Authenticated non-admin**
- CANNOT modify portfolio documents.
- CANNOT read private `messages`.
- CANNOT update/delete `messages`.

**Admin (`hucainomar490@gmail.com`)**
- CAN create/update/delete portfolio documents.
- CAN read all messages.
- CAN update a message ONLY by changing `reply`/`replied`/`repliedAt`.
- CAN delete a message.
- CANNOT update a message's `name`/`email`/`subject`/`message` (update restricted).

**Malicious input**
- Oversized `name`/`subject`/`message` is rejected.
- Wrong types (number where string expected) are rejected.
- Unknown fields are rejected on create and on update.
- Invalid `href` scheme (`javascript:`, `data:`) is rejected by client `safeExternalUrl()`.

## Standard commands to run

```
npm audit                # dependency vulnerabilities
npm run build            # TypeScript strict compile + Vite build
npm run lint             # (add eslint if you install it)
firebase emulators:exec --only firestore 'npm run test:rules'
firebase emulators:exec --only auth  'npm run test:rules'
```

## Deployment security headers

`firebase.json` now ships with Firebase Hosting security headers already configured (see the
`hosting.headers` block), including:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), screen-wake-lock=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: (see below)
```

### CSP and the single-file build

The project uses `vite-plugin-singlefile`, so the runtime JS and CSS are **inlined** into
`index.html`. A CSP of `script-src 'self'` would block the inline bundle and break the app.

The CSP in `firebase.json` is therefore set at the **hosting layer** with the minimum
allowances required to run this exact build:
- `script-src 'self' 'unsafe-inline' 'unsafe-eval'` (required for the inlined bundle + bundle
  runtime eval of framer-motion/bundlers)
- `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com`
- `font-src 'self' https://fonts.gstatic.com`
- `img-src 'self' data: blob:`
- `connect-src 'self'` + the specific Firebase/FormSubmit origins the app actually calls
  (no wildcard `connect-src *`)
- `frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'`
- `upgrade-insecure-requests`

This is the most restrictive policy that still runs the single-file bundle. A stricter,
non-inline CSP would require switching off `vite-plugin-singlefile` (e.g., emitting hashed
external assets) — a larger change outside the scope of "don't break the UI to add security."

(Serve over HTTPS so `Strict-Transport-Security` is honored.)

## Cloud Function Rate Limiter (`functions/`)

A Firebase Cloud Function (`handleContactForm`) provides server-side rate limiting
for the public contact form:

- **3 submissions per IP per hour** (enforced in Firestore, not the client)
- Full field validation (type, length, format) before writing
- Saves to Firestore `messages` collection via Admin SDK
- Dispatches email notification via FormSubmit.co (non-blocking)
- Client-side `sendContactMessage()` tries the Cloud Function first, then falls
  back to the direct Firestore REST API if the function is not deployed

### Deploy the Cloud Function

```bash
cd functions && npm install && cd ..
firebase deploy --only functions
```

### Configure the admin email

```bash
firebase functions:secrets:set ADMIN_EMAIL
# Enter: hucainomar490@gmail.com
```

## Remaining risks that cannot be fully solved in the frontend

- **Direct unauthenticated writes to `messages`** are rate-limited by the Cloud
  Function (3/hour/IP) and protected by App Check when enabled. The fallback REST
  path still writes directly to Firestore but is subject to the same rules.
- **Email delivery** relies on FormSubmit (a third party), not on Firebase. Verifying the
  FormSubmit email in your Gmail inbox is required for production delivery.
- **Custom claims** would be safer than email matching in `isAdmin()`. If you adopt them,
  update `firestore.rules`, `src/firebase.ts`, and the client `isAdminUser` check together.
