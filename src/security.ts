/**
 * Security utilities — client-side hardening layer.
 *
 * The REAL security boundary is the Firestore Security Rules.
 * These helpers add defense-in-depth: rate limiting, XSS sanitization,
 * session protection, and deterrent warnings for would-be attackers.
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
  if (consoleWarningShown) return;
  consoleWarningShown = true;
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
// Input Length Validation
// ---------------------------------------------------------------------------
// Validates input lengths before sending to Firestore.

export function validateInputLengths(fields: Record<string, { value: string; min: number; max: number }>): string[] {
  const errors: string[] = [];
  for (const [name, { value, min, max }] of Object.entries(fields)) {
    if (value.length < min) errors.push(`${name} must be at least ${min} characters.`);
    if (value.length > max) errors.push(`${name} must be at most ${max} characters.`);
  }
  return errors;
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
// Session Fingerprint
// ---------------------------------------------------------------------------
// Generates a browser fingerprint to detect session hijacking.
// If the fingerprint changes mid-session, the session is invalidated.

function generateFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency,
  ];
  return btoa(components.join("|"));
}

const FINGERPRINT_KEY = "_vault_fp";
const SESSION_START_KEY = "_vault_session_start";
const ABSOLUTE_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours max session

export function validateSession(): { valid: boolean; reason?: string } {
  try {
    const currentFp = generateFingerprint();
    const storedFp = sessionStorage.getItem(FINGERPRINT_KEY);
    const sessionStart = sessionStorage.getItem(SESSION_START_KEY);

    // First visit — store fingerprint
    if (!storedFp) {
      sessionStorage.setItem(FINGERPRINT_KEY, currentFp);
      sessionStorage.setItem(SESSION_START_KEY, String(Date.now()));
      return { valid: true };
    }

    // Fingerprint mismatch — possible hijacking
    if (storedFp !== currentFp) {
      sessionStorage.removeItem(FINGERPRINT_KEY);
      sessionStorage.removeItem(SESSION_START_KEY);
      return { valid: false, reason: "Session fingerprint mismatch" };
    }

    // Absolute timeout — force re-authentication after 2 hours
    if (sessionStart && Date.now() - parseInt(sessionStart, 10) > ABSOLUTE_TIMEOUT_MS) {
      sessionStorage.removeItem(FINGERPRINT_KEY);
      sessionStorage.removeItem(SESSION_START_KEY);
      return { valid: false, reason: "Session expired (2 hour limit)" };
    }

    return { valid: true };
  } catch {
    return { valid: true }; // Fail open for non-critical check
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(FINGERPRINT_KEY);
    sessionStorage.removeItem(SESSION_START_KEY);
  } catch {
    // Non-critical
  }
}

// ---------------------------------------------------------------------------
// Admin Right-Click & Selection Prevention
// ---------------------------------------------------------------------------
// Prevents casual inspection of admin dashboard content.

export function disableAdminContextMenu(): () => void {
  const handler = (e: Event) => e.preventDefault();
  document.addEventListener("contextmenu", handler);
  return () => document.removeEventListener("contextmenu", handler);
}

// ---------------------------------------------------------------------------
// Init — call once at app startup
// ---------------------------------------------------------------------------
export function initSecurity(): void {
  showConsoleWarning();
}
