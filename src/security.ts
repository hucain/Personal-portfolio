/**
 * Security utilities — client-side hardening layer.
 *
 * The REAL security boundary is the Firestore Security Rules.
 * These helpers add defense-in-depth: rate limiting, XSS sanitization,
 * and deterrent warnings for would-be attackers.
 */

// ---------------------------------------------------------------------------
// Console Warning Banner
// ---------------------------------------------------------------------------
// Displays a scary warning in DevTools to deter casual attackers.

const CONSOLE_WARNING = [
  "%c⚠ WARNING — STUDIO VAULT SECURITY",
  "color: #ff4444; font-size: 20px; font-weight: bold; text-shadow: 0 0 10px red;",
  "",
  "This is a private administrative interface.",
  "Unauthorized access attempts are logged and may result in legal action.",
  "All operations are monitored by Firestore Security Rules.",
  "",
  "If you are not the administrator, close this console immediately.",
].join("\n");

let consoleWarningShown = false;

export function showConsoleWarning(): void {
  if (consoleWarningShown || !import.meta.env.DEV) return;
  consoleWarningShown = true;
  // Only show in dev to avoid noise in production
  console.warn(CONSOLE_WARNING);
}

// ---------------------------------------------------------------------------
// XSS Sanitization
// ---------------------------------------------------------------------------
// Prevents stored XSS in user-generated content (messages, names, etc.).

const ENTITY_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#96;",
};

const ENTITY_REGEX = /[&<>"'`/]/g;

/** Sanitize a string for safe HTML insertion — escapes all dangerous characters. */
export function sanitizeHTML(input: string): string {
  if (!input) return "";
  return input.replace(ENTITY_REGEX, (char) => ENTITY_MAP[char] ?? char);
}

/** Strip all HTML tags from a string — used for plain-text display. */
export function stripHTML(input: string): string {
  if (!input) return "";
  return input.replace(/<[^>]*>/g, "");
}

// ---------------------------------------------------------------------------
// Contact Form Rate Limiting
// ---------------------------------------------------------------------------
// Prevents spam submissions with a cooldown between sends.

const CONTACT_COOLDOWN_KEY = "_portfolio_last_send";
const CONTACT_COOLDOWN_MS = 30_000; // 30 seconds between submissions

export function canSendContactForm(): { allowed: boolean; waitSeconds: number } {
  try {
    const lastSend = localStorage.getItem(CONTACT_COOLDOWN_KEY);
    if (!lastSend) return { allowed: true, waitSeconds: 0 };

    const elapsed = Date.now() - parseInt(lastSend, 10);
    if (elapsed >= CONTACT_COOLDOWN_MS) return { allowed: true, waitSeconds: 0 };

    const remaining = Math.ceil((CONTACT_COOLDOWN_MS - elapsed) / 1000);
    return { allowed: false, waitSeconds: remaining };
  } catch {
    return { allowed: true, waitSeconds: 0 };
  }
}

export function recordContactSend(): void {
  try {
    localStorage.setItem(CONTACT_COOLDOWN_KEY, String(Date.now()));
  } catch {
    // localStorage unavailable — skip rate limiting
  }
}

// ---------------------------------------------------------------------------
// Admin Path Obfuscation
// ---------------------------------------------------------------------------
// Adds a harmless random attribute to the body to make automated scanning
// slightly harder (security through obscurity — NOT a real defense).

export function applyPathObfuscation(): void {
  try {
    const nonce = Math.random().toString(36).slice(2, 10);
    document.body.setAttribute("data-vault", nonce);
  } catch {
    // Non-critical
  }
}

// ---------------------------------------------------------------------------
// Init — call once at app startup
// ---------------------------------------------------------------------------
export function initSecurity(): void {
  showConsoleWarning();
  applyPathObfuscation();
}
