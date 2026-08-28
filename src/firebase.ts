import { initializeApp } from "firebase/app";
import { sendContactEmailJS, sendReplyEmailJS } from "./emailjs";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  getIdTokenResult,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  getToken as getAppCheckToken,
  type AppCheck,
} from "firebase/app-check";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  initializeFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAT4ZmbZemXi4Ox1r0LgGWKSXrF8dijTNA",
  authDomain: "portfolio-8be6c.firebaseapp.com",
  projectId: "portfolio-8be6c",
  storageBucket: "portfolio-8be6c.firebasestorage.app",
  messagingSenderId: "410226207003",
  appId: "1:410226207003:web:837ca19c222e91369d4bbe",
};

export const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });
export const auth = getAuth(app);
void setPersistence(auth, browserLocalPersistence);

// =========================================================================
// FIREBASE APP CHECK
// -------------------------------------------------------------------------
// App Check is an anti-abuse layer for the public contact form. It does NOT
// replace Firestore Rules (which remain the real authorization boundary).
//
// The ReCAPTCHA *site key* below is PUBLIC client configuration (the SECRET
// key stays in the Firebase console server-side). It is read from a build-time
// env var `VITE_RECAPTCHA_SITE_KEY`. If it is unset, App Check is simply not
// initialized and the app keeps working — it must remain OFF in the rules too
// (`REQUIRE_APP_CHECK = false`) until the console side is provisioned.
//
// NEVER put the reCAPTCHA secret, a service-account key, or Admin SDK
// credentials here.
// =========================================================================
let appCheckInstance: AppCheck | null = null;
let appCheckInitialized = false;

export function initAppCheck(): void {
  if (appCheckInitialized) return;
  appCheckInitialized = true;

  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
  if (!siteKey || siteKey.length === 0) {
    // Not provisioned via env: leave App Check disabled so the site still works.
    if (import.meta.env.DEV) {
      console.warn("App Check skipped: VITE_RECAPTCHA_SITE_KEY is not set.");
    }
    return;
  }

  try {
    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    // Never throw during Firebase initialization; the app must keep working.
    console.error("App Check initialization failed", error);
    appCheckInstance = null;
  }
}

// Returns a fresh App Check token string for attaching to Firestore REST calls,
// or null if App Check is unavailable. Never throws.
export async function getAppCheckAttestation(): Promise<string | null> {
  if (!appCheckInstance) initAppCheck();
  if (!appCheckInstance) return null;
  try {
    const token = await getAppCheckToken(appCheckInstance, true);
    return token.token || null;
  } catch {
    return null;
  }
}

// Call App Check init early (idempotent). Safe even before the console is
// provisioned because init() is guarded.
void initAppCheck();

export const firestoreConsoleUrl =
  "https://console.firebase.google.com/project/portfolio-8be6c/firestore/data/~2Fmessages";
export const firestoreRulesUrl =
  "https://console.firebase.google.com/project/portfolio-8be6c/firestore/rules";
export const authConsoleUrl =
  "https://console.firebase.google.com/project/portfolio-8be6c/authentication/providers";

export const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null
        && request.auth.token.email != null
        && request.auth.token.email == 'hucainomar490@gmail.com';
    }

    function hasOnlyKeys(keys) {
      return request.resource.data.keys().hasOnly(keys);
    }

    function updateOnly(keys) {
      return request.resource.data
        .diff(resource.data)
        .affectedKeys()
        .hasOnly(keys);
    }

    match /messages/{messageId} {
      allow create: if
        request.auth == null
        && hasOnlyKeys(['name', 'email', 'subject', 'type', 'message', 'createdAt', 'replied', 'reply'])
        && request.resource.data.name is string
        && request.resource.data.email is string
        && request.resource.data.subject is string
        && request.resource.data.type is string
        && request.resource.data.message is string
        && request.resource.data.createdAt is timestamp
        && request.resource.data.replied is bool
        && request.resource.data.reply is string
        && request.resource.data.name.size() >= 1 && request.resource.data.name.size() <= 80
        && request.resource.data.email.size() >= 5 && request.resource.data.email.size() <= 254
        && request.resource.data.subject.size() >= 1 && request.resource.data.subject.size() <= 200
        && request.resource.data.type.size() >= 1 && request.resource.data.type.size() <= 40
        && request.resource.data.message.size() >= 1 && request.resource.data.message.size() <= 5000
        && request.resource.data.replied == false
        && request.resource.data.reply.size() == 0
        && request.resource.data.createdAt >= request.time - duration.value(1, 'h')
        && request.resource.data.createdAt <= request.time;
      allow read: if isAdmin();
      allow update: if isAdmin() && updateOnly(['reply', 'replied', 'repliedAt'])
        && request.resource.data.reply is string
        && request.resource.data.replied is bool
        && request.resource.data.replied == true
        && request.resource.data.reply.size() <= 2000
        && request.resource.data.repliedAt is timestamp;
      allow delete: if isAdmin();
    }

    match /projects/{docId} {
      allow read: if true;
      allow create: if isAdmin() && hasOnlyKeys(['title', 'detail', 'status', 'href', 'order'])
        && request.resource.data.title is string && request.resource.data.title.size() in [1, 120]
        && request.resource.data.detail is string && request.resource.data.detail.size() <= 2000
        && request.resource.data.status is string && request.resource.data.status.size() <= 40
        && request.resource.data.href is string && request.resource.data.href.size() <= 500
        && request.resource.data.order is number;
      allow update: if isAdmin() && updateOnly(['title', 'detail', 'status', 'href', 'order'])
        && request.resource.data.title is string && request.resource.data.title.size() in [1, 120]
        && request.resource.data.detail is string && request.resource.data.detail.size() <= 2000
        && request.resource.data.status is string && request.resource.data.status.size() <= 40
        && request.resource.data.href is string && request.resource.data.href.size() <= 500
        && request.resource.data.order is number;
      allow delete: if isAdmin();
    }

    match /stack/{docId} {
      allow read: if true;
      allow create: if isAdmin() && hasOnlyKeys(['name', 'blurb', 'accent', 'key', 'group', 'order'])
        && request.resource.data.name is string && request.resource.data.name.size() in [1, 60]
        && request.resource.data.blurb is string && request.resource.data.blurb.size() <= 300
        && request.resource.data.accent is string && request.resource.data.accent.size() <= 12
        && request.resource.data.key is string && request.resource.data.key.size() <= 20
        && request.resource.data.group in ['core', 'framework']
        && request.resource.data.order is number;
      allow update: if isAdmin() && updateOnly(['name', 'blurb', 'accent', 'key', 'group', 'order'])
        && request.resource.data.name is string && request.resource.data.name.size() in [1, 60]
        && request.resource.data.blurb is string && request.resource.data.blurb.size() <= 300
        && request.resource.data.accent is string && request.resource.data.accent.size() <= 12
        && request.resource.data.key is string && request.resource.data.key.size() <= 20
        && request.resource.data.group in ['core', 'framework']
        && request.resource.data.order is number;
      allow delete: if isAdmin();
    }

    match /workRoles/{docId} {
      allow read: if true;
      allow create: if isAdmin() && hasOnlyKeys(['period', 'title', 'place', 'summary', 'points', 'order'])
        && request.resource.data.period is string && request.resource.data.period.size() <= 40
        && request.resource.data.title is string && request.resource.data.title.size() in [1, 120]
        && request.resource.data.place is string && request.resource.data.place.size() <= 80
        && request.resource.data.summary is string && request.resource.data.summary.size() <= 2000
        && request.resource.data.points is list && request.resource.data.points.size() <= 12
        && request.resource.data.order is number;
      allow update: if isAdmin() && updateOnly(['period', 'title', 'place', 'summary', 'points', 'order'])
        && request.resource.data.period is string && request.resource.data.period.size() <= 40
        && request.resource.data.title is string && request.resource.data.title.size() in [1, 120]
        && request.resource.data.place is string && request.resource.data.place.size() <= 80
        && request.resource.data.summary is string && request.resource.data.summary.size() <= 2000
        && request.resource.data.points is list && request.resource.data.points.size() <= 12
        && request.resource.data.order is number;
      allow delete: if isAdmin();
    }

    match /workFocus/{docId} {
      allow read: if true;
      allow create: if isAdmin() && hasOnlyKeys(['title', 'detail', 'order'])
        && request.resource.data.title is string && request.resource.data.title.size() in [1, 120]
        && request.resource.data.detail is string && request.resource.data.detail.size() <= 2000
        && request.resource.data.order is number;
      allow update: if isAdmin() && updateOnly(['title', 'detail', 'order'])
        && request.resource.data.title is string && request.resource.data.title.size() in [1, 120]
        && request.resource.data.detail is string && request.resource.data.detail.size() <= 2000
        && request.resource.data.order is number;
      allow delete: if isAdmin();
    }

    match /certificates/{docId} {
      allow read: if true;
      allow create: if isAdmin() && hasOnlyKeys(['title', 'issuer', 'year', 'credentialId', 'href', 'order'])
        && request.resource.data.title is string && request.resource.data.title.size() in [1, 120]
        && request.resource.data.issuer is string && request.resource.data.issuer.size() in [1, 120]
        && request.resource.data.year is string && request.resource.data.year.size() <= 12
        && request.resource.data.credentialId is string && request.resource.data.credentialId.size() <= 120
        && request.resource.data.href is string && request.resource.data.href.size() <= 500
        && request.resource.data.order is number;
      allow update: if isAdmin() && updateOnly(['title', 'issuer', 'year', 'credentialId', 'href', 'order'])
        && request.resource.data.title is string && request.resource.data.title.size() in [1, 120]
        && request.resource.data.issuer is string && request.resource.data.issuer.size() in [1, 120]
        && request.resource.data.year is string && request.resource.data.year.size() <= 12
        && request.resource.data.credentialId is string && request.resource.data.credentialId.size() <= 120
        && request.resource.data.href is string && request.resource.data.href.size() <= 500
        && request.resource.data.order is number;
      allow delete: if isAdmin();
    }

    match /contactInfo/{docId} {
      allow read: if true;
      allow create: if isAdmin() && hasOnlyKeys(['label', 'value', 'icon', 'order'])
        && request.resource.data.label is string && request.resource.data.label.size() in [1, 80]
        && request.resource.data.value is string && request.resource.data.value.size() in [1, 254]
        && request.resource.data.icon is string && request.resource.data.icon.size() <= 20
        && request.resource.data.order is number;
      allow update: if isAdmin() && updateOnly(['label', 'value', 'icon', 'order'])
        && request.resource.data.label is string && request.resource.data.label.size() in [1, 80]
        && request.resource.data.value is string && request.resource.data.value.size() in [1, 254]
        && request.resource.data.icon is string && request.resource.data.icon.size() <= 20
        && request.resource.data.order is number;
      allow delete: if isAdmin();
    }
  }
}`;

export type ContactMessage = {
  id?: string;
  name: string;
  email: string;
  subject: string;
  type: string;
  message: string;
  createdAt?: string;
  replied?: boolean;
  reply?: string;
  repliedAt?: string;
};

export type ProjectItem = {
  id: string;
  title: string;
  detail: string;
  status: string;
  href?: string;
  order: number;
};

export type StackItem = {
  id: string;
  name: string;
  blurb: string;
  accent: string;
  key: string;
  group: "core" | "framework";
  order: number;
};

export type WorkRoleItem = {
  id: string;
  period: string;
  title: string;
  place: string;
  summary: string;
  points: string[];
  order: number;
};

export type WorkFocusItem = {
  id: string;
  title: string;
  detail: string;
  order: number;
};

export type CertificateItem = {
  id: string;
  title: string;
  issuer: string;
  year: string;
  credentialId?: string;
  href?: string;
  order: number;
};

export type SendResult =
  | { ok: true; source: "firestore"; id: string; data: ContactMessage }
  | { ok: false; error: string };

// Manageable public contact info shown on the site's Contact section.
export type ContactInfoItem = {
  id: string;
  label: string;
  value: string;
  icon: string; // key into the icon map
  order: number;
};

// Administrator email. After Firebase Auth verifies the token (server-side),
// only this email is treated as admin. This is also mirrored in the Firestore
// Rules admin check. (Optionally, you can prefer a custom claim via the
// `admin: true` branch below and then remove this email fallback later.)
export const ADMIN_EMAIL = "hucainomar490@gmail.com";

// The client is NOT the security boundary — the Firestore Rules are.
// The UI gate: true if the verified ID token carries the custom claim
// `admin: true` OR if the verified token email matches ADMIN_EMAIL.
export async function hasAdminClaim(user: User): Promise<boolean> {
  try {
    const token = await getIdTokenResult(user, true);
    if (token.claims.admin === true) return true;
    return !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  } catch {
    // Fallback: if token refresh fails, still accept the email match.
    return !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  }
}

export function watchAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

function authError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  if (code.includes("missing-password")) {
    return "Please enter your password to unlock the studio vault.";
  }
  if (code.includes("missing-email") || code.includes("invalid-email")) {
    return "Please enter your studio email address.";
  }
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
    return "Incorrect email or password.";
  }
  if (code.includes("email-already-in-use")) return "This admin account already exists. Switch to 'Sign in' below.";
  if (code.includes("weak-password")) return "Use at least 6 characters for the password.";
  if (code.includes("operation-not-allowed")) {
    return "Turn on Email/Password in Firebase Authentication console first.";
  }
  if (code.includes("network")) return "Network dropped. Try again.";
  if (error instanceof Error) {
    const cleanMsg = error.message.replace(/^Firebase:\s*Error\s*\([^)]+\)\.?\s*/i, "");
    return cleanMsg || "Could not sign in.";
  }
  return "Could not sign in.";
}

export async function adminSignIn(email: string, password: string) {
  if (!email.trim()) throw new Error("Please enter your studio email address.");
  if (!password) throw new Error("Please enter your password to unlock the studio vault.");
  const session = await signInWithEmailAndPassword(auth, email.trim(), password);
  if (!(await hasAdminClaim(session.user))) {
    await signOut(auth);
    throw new Error("This account does not have administrator privileges.");
  }
}

export async function adminRegister(email: string, password: string) {
  if (!email.trim()) throw new Error("Please enter your studio email address.");
  if (!password) throw new Error("Please enter a password of at least 6 characters.");
  // Creates the account. Admin must then grant `admin: true` via the Admin SDK
  // (server-side). The dashboard stays locked until a fresh token carries the claim.
  await createUserWithEmailAndPassword(auth, email.trim(), password);
}

export async function adminSignOut() {
  await signOut(auth);
}

// Defense-in-depth: mirror the server-side validation in the client.
// The Firestore Security Rules remain the authoritative boundary
// (a user can always bypass these helpers), but these guards reduce
// junk writes and accidental malformed data reaching the database.
export function clean(payload: ContactMessage): ContactMessage {
  const name = payload.name.trim().slice(0, 80);
  const email = payload.email.trim().slice(0, 254);
  const subject = payload.subject.trim().slice(0, 200);
  const type = payload.type.trim().slice(0, 40);
  const message = payload.message.trim().slice(0, 5000);

  return {
    name,
    email,
    subject,
    type,
    message,
    createdAt: new Date().toISOString(),
    replied: false,
    reply: "",
  };
}

// Allow external links (https, http) and relative anchors only.
// Blocks javascript:, data:, vbscript: and other dangerous schemes.
export function safeExternalUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 500) return undefined;
  if (trimmed.startsWith("#") || trimmed.startsWith("/")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return trimmed;
  } catch {
    return undefined;
  }
  return undefined;
}

function asFields(data: ContactMessage) {
  return {
    name: { stringValue: data.name },
    email: { stringValue: data.email },
    subject: { stringValue: data.subject },
    type: { stringValue: data.type },
    message: { stringValue: data.message },
    createdAt: { timestampValue: data.createdAt ?? new Date().toISOString() },
    replied: { booleanValue: false },
    reply: { stringValue: "" },
  };
}

function explain() {
  return "Could not deliver your note right now. Please check your internet connection and try again.";
}

export async function sendContactMessage(payload: ContactMessage): Promise<SendResult> {
  const data = clean(payload);

  // -----------------------------------------------------------------------
  // Primary path: Cloud Function (rate-limited, server-side validated)
  // -----------------------------------------------------------------------
  try {
    const cfUrl = `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/handleContactForm`;
    const response = await fetch(cfUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const body = (await response.json().catch(() => null)) as {
      ok?: boolean;
      id?: string;
      data?: ContactMessage;
      error?: string;
    } | null;

    if (response.ok && body?.ok && body?.id) {
      return { ok: true, source: "firestore", id: body.id, data: body.data ?? { ...data, id: body.id } };
    }

    // If the Cloud Function returned a specific error (e.g. rate limit), surface it
    if (body?.error) {
      return { ok: false, error: body.error };
    }
  } catch {
    // Cloud Function not deployed yet or network error — fall through to REST fallback
  }

  // -----------------------------------------------------------------------
  // Fallback path: direct Firestore REST API (when Cloud Function is offline)
  // -----------------------------------------------------------------------
  const id = `msg_${Date.now()}`;
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/messages?documentId=${encodeURIComponent(id)}&key=${firebaseConfig.apiKey}`;
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    // Attach an App Check token when available so the public form can be
    // protected by App Check at the rules layer (`REQUIRE_APP_CHECK`).
    const appCheckToken = await getAppCheckAttestation();
    if (appCheckToken) headers["X-Firebase-AppCheck"] = appCheckToken;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ fields: asFields(data) }),
    });
    if (!response.ok) return { ok: false, error: explain() };

    // Send email notification to admin via EmailJS (client-side fallback)
    void sendContactEmailJS({
      name: data.name,
      email: data.email,
      subject: data.subject,
      type: data.type,
      message: data.message,
    });

    return { ok: true, source: "firestore", id, data: { ...data, id } };
  } catch {
    return { ok: false, error: "Could not deliver your note right now. Please try again." };
  }
}

export async function fetchDocs<T extends { id: string }>(name: string): Promise<T[]> {
  const snap = await getDocs(collection(db, name));
  const items = snap.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as T);
  return [...items].sort((a, b) => {
    const left = (a as { order?: number }).order ?? 0;
    const right = (b as { order?: number }).order ?? 0;
    return left - right;
  });
}

// Real-time listener: calls `onData` whenever the collection changes.
// Returns an unsubscribe function. Sorted by `order` field ascending,
// then by `createdAt` descending for messages.
export function watchDocs<T extends { id: string }>(
  name: string,
  onData: (items: T[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const colRef = collection(db, name);

  const sortItems = (items: T[]) =>
    [...items].sort((a, b) => ((a as { order?: number }).order ?? 0) - ((b as { order?: number }).order ?? 0));

  // Primary: ordered query.  If any document is missing the sort field,
  // Firestore rejects the entire query — so we fall back to an unordered
  // listener and sort client-side.
  const q = name === "messages"
    ? query(colRef, orderBy("createdAt", "desc"))
    : query(colRef, orderBy("order", "asc"));

  let fallbackUnsub: (() => void) | null = null;

  const unsub = onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((entry) => ({
        id: entry.id,
        ...entry.data(),
      }) as T);
      onData(name === "messages" ? items : sortItems(items));
    },
    (err) => {
      if (import.meta.env.DEV) console.warn(`watchDocs(${name}) ordered query failed, falling back to unordered`, err);
      // The ordered query broke (usually a document missing the sort field).
      // Switch to an unordered snapshot so data still flows to the component.
      fallbackUnsub?.();
      fallbackUnsub = onSnapshot(
        colRef,
        (snap) => {
          const items = snap.docs.map((entry) => ({
            id: entry.id,
            ...entry.data(),
          }) as T);
          onData(name === "messages" ? items : sortItems(items));
        },
        (fallbackErr) => {
          if (import.meta.env.DEV) console.error(`watchDocs(${name}) fallback also failed`, fallbackErr);
          onError?.(fallbackErr);
        },
      );
    },
  );

  return () => {
    unsub();
    fallbackUnsub?.();
  };
}

export async function createDoc(name: string, data: Record<string, unknown>) {
  const ref = await addDoc(collection(db, name), data);
  return ref.id;
}

export async function saveDoc(name: string, id: string, data: Record<string, unknown>) {
  await updateDoc(doc(db, name, id), data);
}

export async function removeDoc(name: string, id: string) {
  await deleteDoc(doc(db, name, id));
}

export async function fetchCertificates(): Promise<CertificateItem[]> {
  return fetchDocs<CertificateItem>("certificates");
}

export async function addCertificate(data: Omit<CertificateItem, "id">) {
  return createDoc("certificates", data);
}

export async function updateCertificate(id: string, data: Omit<CertificateItem, "id">) {
  await saveDoc("certificates", id, data);
}

export async function deleteCertificate(id: string) {
  await removeDoc("certificates", id);
}

export async function fetchContactInfo(): Promise<ContactInfoItem[]> {
  return fetchDocs<ContactInfoItem>("contactInfo");
}

export async function addContactInfo(data: Omit<ContactInfoItem, "id">) {
  return createDoc("contactInfo", data);
}

export async function updateContactInfo(id: string, data: Omit<ContactInfoItem, "id">) {
  await saveDoc("contactInfo", id, data);
}

export async function deleteContactInfo(id: string) {
  await removeDoc("contactInfo", id);
}

export async function fetchMessages(): Promise<ContactMessage[]> {
  const snap = await getDocs(collection(db, "messages"));
  return snap.docs
    .map((entry) => {
      const data = entry.data();
      return {
        id: entry.id,
        name: String(data.name || ""),
        email: String(data.email || ""),
        subject: String(data.subject || ""),
        type: String(data.type || ""),
        message: String(data.message || ""),
        createdAt: String(data.createdAt || ""),
        replied: Boolean(data.replied),
        reply: String(data.reply || ""),
        repliedAt: String(data.repliedAt || ""),
      };
    })
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export async function deleteMessage(id: string) {
  await deleteDoc(doc(db, "messages", id));
}

export async function replyToMessage(
  id: string,
  reply: string,
  clientMeta?: { email: string; name: string; subject: string; originalMessage: string },
) {
  // Primary path: Cloud Function (server-side email delivery, no CORS issues)
  try {
    const cfUrl = `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/handleReply`;
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;

    const response = await fetch(cfUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        messageId: id,
        reply: reply.trim(),
        visitorEmail: clientMeta?.email ?? "",
        visitorName: clientMeta?.name ?? "",
        subject: clientMeta?.subject ?? "",
        originalMessage: clientMeta?.originalMessage ?? "",
      }),
    });

    if (response.ok) return;
    // If Cloud Function fails, fall through to client-side save
  } catch {
    // Cloud Function not deployed yet — fall through
  }

  // Fallback: save to Firestore directly
  await updateDoc(doc(db, "messages", id), {
    reply: reply.trim(),
    replied: true,
    repliedAt: serverTimestamp(),
  });

  // Send reply email via EmailJS (client-side fallback)
  if (clientMeta?.email) {
    void sendReplyEmailJS({
      visitorEmail: clientMeta.email,
      subject: clientMeta.subject,
      reply: reply.trim(),
      originalMessage: clientMeta.originalMessage,
    });
  }
}

export { authError };
