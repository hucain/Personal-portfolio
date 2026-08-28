import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Award,
  Briefcase,
  Database,
  FolderKanban,
  Inbox,
  KeyRound,
  Layers3,
  Loader2,
  Lock,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { seedAll } from "../content";
import { CertificatesPanel } from "./CertificatesPanel";
import { ContactPanel } from "./ContactPanel";
import {
  adminRegister,
  adminSignIn,
  adminSignOut,
  auth,
  authError,
  hasAdminClaim,
  watchAuth,
} from "../firebase";
import { MessagesPanel } from "./MessagesPanel";
import { ProjectsPanel } from "./ProjectsPanel";
import { StackPanel } from "./StackPanel";
import { WorkPanel } from "./WorkPanel";
import { useToast } from "../components/ui";

type Tab = "messages" | "projects" | "stack" | "work" | "certificates" | "contact";

const tabs: { id: Tab; label: string; icon: typeof Inbox; badge?: string }[] = [
  { id: "messages", label: "Messages", icon: Inbox },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "stack", label: "Stack", icon: Layers3 },
  { id: "work", label: "Work", icon: Briefcase },
  { id: "certificates", label: "Certificates", icon: Award },
  { id: "contact", label: "Contact", icon: KeyRound },
];

const IDLE_TIMEOUT_SECONDS = 300; // 5 minutes inactivity auto-lock

function SeedAllButton() {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const handleSeed = async () => {
    setBusy(true);
    try {
      const results = await seedAll();
      if (results.length === 0) {
        toast("All collections already have data — nothing to seed.", "info");
      } else {
        const summary = results.map((r) => `${r.collection} (${r.count})`).join(", ");
        toast(`Seeded: ${summary}`, "success");
      }
    } catch {
      toast("Seeding failed. Check admin permissions.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void handleSeed()}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-gold/25 bg-gold/10 px-4 py-3 text-xs font-semibold text-gold transition hover:bg-gold/20 disabled:opacity-60"
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Database className="h-3.5 w-3.5" />
      )}
      Seed All Data
    </button>
  );
}

export function AdminApp() {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [tab, setTab] = useState<Tab>("messages");
  const [idleSecondsLeft, setIdleSecondsLeft] = useState(IDLE_TIMEOUT_SECONDS);

  useEffect(() => {
    const unsubscribe = watchAuth(async (user) => {
      // UI gate only. The authoritative admin boundary is the Firestore Rules,
      // which require the custom claim `admin: true` on the verified ID token.
      if (user) {
        setAllowed(await hasAdminClaim(user));
      } else {
        setAllowed(false);
      }
      setReady(true);
    });
    return unsubscribe;
  }, []);

  // Periodic admin claim re-verification (every 5 minutes)
  useEffect(() => {
    if (!allowed) return;
    const interval = setInterval(async () => {
      const user = auth.currentUser;
      if (!user) {
        setAllowed(false);
        return;
      }
      const stillAdmin = await hasAdminClaim(user);
      if (!stillAdmin) {
        await adminSignOut();
        setAllowed(false);
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [allowed]);

  // Automatic Vault Lock on Inactivity
  useEffect(() => {
    if (!allowed) return;
    let lastActive = Date.now();

    const resetIdle = () => {
      lastActive = Date.now();
      setIdleSecondsLeft(IDLE_TIMEOUT_SECONDS);
    };

    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    events.forEach((evt) => window.addEventListener(evt, resetIdle, { passive: true }));

    const timer = setInterval(() => {
      const remaining = Math.max(
        0,
        IDLE_TIMEOUT_SECONDS - Math.floor((Date.now() - lastActive) / 1000),
      );
      setIdleSecondsLeft(remaining);
      if (remaining === 0) {
        void adminSignOut();
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      events.forEach((evt) => window.removeEventListener(evt, resetIdle));
    };
  }, [allowed]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-ink">
        <motion.div
          animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-3"
        >
          <img
            src="/logo.png"
            alt="HU logo"
            className="h-12 w-12 rounded-2xl object-contain"
            width={48}
            height={48}
          />
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
            Verifying Studio Access
          </p>
        </motion.div>
      </div>
    );
  }

  if (!allowed) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-canvas pb-24 text-ink lg:pb-12">
      {/* Top Studio Header bar */}
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="HU logo"
              className="h-9 w-9 rounded-xl object-contain"
              width={36}
              height={36}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-semibold sm:text-lg">Studio Vault</span>
                <span className="hidden rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold sm:inline-flex">
                  Encrypted Admin
                </span>
                <span
                  title="Vault automatically locks after 5 minutes of inactivity"
                  className="hidden rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400 md:inline-flex"
                >
                  Auto-lock Active
                </span>
              </div>
              <p className="text-xs text-muted">M. Hussain Umer • Live Management</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="#top"
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-surface/70 px-3.5 py-2 text-xs font-medium text-ink transition hover:border-gold/40 hover:text-gold"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">View Public Portfolio</span>
              <span className="sm:hidden">Site</span>
            </a>
            <button
              type="button"
              onClick={() => void adminSignOut()}
              className="inline-flex items-center gap-1.5 rounded-full border border-highlight/25 bg-highlight/10 px-3.5 py-2 text-xs font-semibold text-highlight transition hover:bg-highlight/20"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Lock Vault</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio layout */}
      <div className="mx-auto mt-6 flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-start">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 lg:sticky lg:top-24 lg:block">
          <div className="overflow-hidden rounded-[1.6rem] border border-ink/10 bg-surface/85 p-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <div className="mb-2 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
                Control Panels
              </p>
            </div>
            <nav className="space-y-1">
              {tabs.map((item) => {
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`relative flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                      active
                        ? "bg-ink text-canvas shadow-md"
                        : "text-muted hover:bg-canvas/50 hover:text-ink"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    {active && (
                      <motion.span
                        layoutId="sidebar-dot"
                        className="h-2 w-2 rounded-full bg-gold"
                      />
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="mt-4 px-3">
              <SeedAllButton />
            </div>

          </div>
        </aside>

        {/* Dynamic Studio Workspace */}
        <main className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              {tab === "messages" && <MessagesPanel />}
              {tab === "projects" && <ProjectsPanel />}
              {tab === "stack" && <StackPanel />}
              {tab === "work" && <WorkPanel />}
              {tab === "certificates" && <CertificatesPanel />}
              {tab === "contact" && <ContactPanel />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Inactivity Auto-Lock Warning Toast (shows in final 60 seconds) */}
      <AnimatePresence>
        {idleSecondsLeft <= 60 ? (
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            className="fixed bottom-20 right-4 z-50 flex items-center gap-3 rounded-2xl border border-highlight/40 bg-surface/95 px-5 py-3.5 shadow-2xl backdrop-blur-xl sm:bottom-6 sm:right-6"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-highlight/15 text-highlight">
              <Lock className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-semibold text-highlight">
                Vault Auto-Locking in {idleSecondsLeft}s
              </p>
              <p className="text-[11px] text-muted">No activity detected.</p>
            </div>
            <button
              type="button"
              onClick={() => setIdleSecondsLeft(IDLE_TIMEOUT_SECONDS)}
              className="ml-2 rounded-full bg-ink px-3.5 py-1.5 text-xs font-semibold text-canvas hover:bg-gold"
            >
              Keep Unlocked
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Mobile Floating Bottom Bar */}
      <nav className="fixed inset-x-2 bottom-3 z-40 flex items-center justify-around rounded-full border border-ink/15 bg-surface/95 p-1 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:inset-x-4 sm:bottom-4 sm:p-1.5 lg:hidden">
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[10px] font-medium transition-all sm:gap-1 sm:py-2.5 sm:text-xs ${
                active ? "bg-ink text-canvas" : "text-muted hover:text-ink"
              }`}
            >
              <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden">{item.label.charAt(0)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// Rate limiting: max 5 attempts per 5-minute window
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

function getLoginAttempts(): { count: number; firstAttempt: number } {
  try {
    const raw = localStorage.getItem("_vault_attempts");
    if (!raw) return { count: 0, firstAttempt: 0 };
    return JSON.parse(raw) as { count: number; firstAttempt: number };
  } catch {
    return { count: 0, firstAttempt: 0 };
  }
}

function recordLoginAttempt(): { locked: boolean; remaining: number } {
  const now = Date.now();
  const stored = getLoginAttempts();

  // Reset if lockout window has passed
  if (now - stored.firstAttempt > LOCKOUT_DURATION_MS) {
    const fresh = { count: 1, firstAttempt: now };
    localStorage.setItem("_vault_attempts", JSON.stringify(fresh));
    return { locked: false, remaining: MAX_LOGIN_ATTEMPTS - 1 };
  }

  const next = { count: stored.count + 1, firstAttempt: stored.firstAttempt };
  localStorage.setItem("_vault_attempts", JSON.stringify(next));
  return {
    locked: next.count >= MAX_LOGIN_ATTEMPTS,
    remaining: Math.max(0, MAX_LOGIN_ATTEMPTS - next.count),
  };
}

function clearLoginAttempts() {
  localStorage.removeItem("_vault_attempts");
}

// Admin registration is disabled after initial setup.
// To re-enable, set this to true temporarily, register, then set back to false.
const ADMIN_REGISTRATION_ENABLED = false;

function LoginScreen() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [lockout, setLockout] = useState(() => {
    const stored = getLoginAttempts();
    if (stored.count >= MAX_LOGIN_ATTEMPTS && Date.now() - stored.firstAttempt < LOCKOUT_DURATION_MS) {
      return Math.ceil((LOCKOUT_DURATION_MS - (Date.now() - stored.firstAttempt)) / 1000);
    }
    return 0;
  });

  // Countdown timer for lockout
  useEffect(() => {
    if (lockout <= 0) return;
    const timer = setInterval(() => {
      setLockout((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockout > 0]);

  const submit = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your admin credentials.");
      return;
    }

    // Check rate limit
    const { locked, remaining } = recordLoginAttempt();
    if (locked) {
      const seconds = Math.ceil(LOCKOUT_DURATION_MS / 1000);
      setLockout(seconds);
      setError(`Too many failed attempts. Locked for ${Math.ceil(seconds / 60)} minutes.`);
      return;
    }

    setBusy(true);
    try {
      if (mode === "up") {
        if (!ADMIN_REGISTRATION_ENABLED) {
          setError("Admin registration is disabled. Use an existing admin account.");
          setBusy(false);
          return;
        }
        await adminRegister(email.trim(), password);
      } else {
        await adminSignIn(email.trim(), password);
      }
      clearLoginAttempts(); // Success — reset counter
    } catch (err) {
      setError(authError(err));
      if (remaining <= 1) {
        const seconds = Math.ceil(LOCKOUT_DURATION_MS / 1000);
        setLockout(seconds);
        setError(`Account locked for ${Math.ceil(seconds / 60)} minutes due to too many failed attempts.`);
      } else {
        setError(`${authError(err)} (${remaining} attempts remaining)`);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-12 text-ink">
      {/* Subtle atmospheric glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent/15 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-10 h-72 w-72 rounded-full bg-gold/10 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] border border-ink/12 bg-surface/90 p-8 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
      >
        <div className="flex items-center justify-between">
          <img
            src="/logo.png"
            alt="HU logo"
            className="h-12 w-12 rounded-2xl object-contain shadow-sm"
            width={48}
            height={48}
          />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-canvas/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            <Sparkles className="h-3 w-3 text-gold" />
            Hidden Keyhole
          </span>
        </div>

        <h1 className="mt-5 font-display text-3xl font-medium tracking-tight">
          Studio Command Center
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Private administrative vault. Enter your credentials to inspect client notes or modify live portfolio modules.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <label className="block text-sm">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Studio Email
            </span>
            <input
              className="field"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Vault Key
            </span>
            <input
              className="field"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>

          {lockout > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-highlight/40 bg-highlight/10 px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-highlight" />
                <p className="text-xs font-semibold text-highlight">
                  Vault Locked — {Math.floor(lockout / 60)}m {lockout % 60}s remaining
                </p>
              </div>
              <p className="mt-1 text-[11px] text-highlight/70">
                Too many failed login attempts. This is a security measure.
              </p>
            </motion.div>
          ) : error ? (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-highlight/30 bg-highlight/10 px-3.5 py-2.5 text-xs font-medium text-highlight"
            >
              {error}
            </motion.p>
          ) : null}

          <motion.button
            type="submit"
            disabled={busy || lockout > 0}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold via-accent to-gold bg-[length:200%_auto] px-5 py-3.5 text-sm font-semibold text-canvas shadow-[0_12px_32px_rgba(212,180,131,0.22)] transition-all hover:bg-right disabled:opacity-40"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            {mode === "up" ? "Initialize Admin Key" : "Unlock Studio Vault"}
          </motion.button>
        </form>

        <div className="mt-5 border-t border-ink/10 pt-4">
          {ADMIN_REGISTRATION_ENABLED ? (
            <button
              type="button"
              onClick={() => setMode((value) => (value === "in" ? "up" : "in"))}
              className="w-full text-center text-xs font-medium text-muted transition hover:text-gold"
            >
              {mode === "in"
                ? "Need to create an admin account?"
                : "Already have an account? Sign in"}
            </button>
          ) : (
            <p className="w-full text-center text-[11px] text-muted/50">
              Registration is disabled for security.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Secret admin access flag
// Only the triple-tap on "HU." and the keyboard shortcut set this.
// No URL hash detection — the admin dashboard is completely invisible
// to anyone who doesn't know the secret entry methods.
// --------------------------------------------------------------------------
let _adminAccessGranted = false;

export function grantAdminAccess() {
  _adminAccessGranted = true;
  // Clear after 30 seconds if not used — prevents stale grants
  setTimeout(() => { _adminAccessGranted = false; }, 30_000);
}

export function useAdminRoute() {
  const [admin, setAdmin] = useState(() => _adminAccessGranted);

  useEffect(() => {
    // Poll the flag every 500ms (the only reliable way since it's set externally)
    const interval = setInterval(() => {
      if (_adminAccessGranted && !admin) {
        setAdmin(true);
        // Clear the URL hash if someone somehow ended up with one
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [admin]);

  return admin;
}
