import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  Mail,
  MessageSquareReply,
  RefreshCw,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../components/ui";
import { openGmailReply, sendReplyEmailJS } from "../emailjs";
import {
  deleteMessage,
  fetchMessages,
  replyToMessage,
  type ContactMessage,
} from "../firebase";
import { sanitizeHTML } from "../security";

export function MessagesPanel() {
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "replied">("all");
  const [active, setActive] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await fetchMessages());
    } catch {
      setError("Could not load messages. Verify authentication.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const replied = items.filter((m) => m.replied).length;
    const pending = total - replied;
    return { total, replied, pending };
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !search.trim() ||
        `${item.name} ${item.email} ${item.subject} ${item.message}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchFilter =
        filter === "all" ||
        (filter === "replied" && item.replied) ||
        (filter === "pending" && !item.replied);
      return matchSearch && matchFilter;
    });
  }, [items, search, filter]);

  const onDelete = async (id?: string) => {
    if (!id || !window.confirm("Permanently delete this inquiry from the database?")) return;
    await deleteMessage(id);
    setItems((list) => list.filter((item) => item.id !== id));
    if (active?.id === id) setActive(null);
    toast("Message deleted.", "info");
  };

  const [directSentToast, setDirectSentToast] = useState("");

  const onSendReply = async (mode: "direct" | "gmail" | "mailto") => {
    if (!active?.id || replyText.trim().length < 2) return;
    setBusy(true);
    setDirectSentToast("");
    try {
      // Save reply to Firestore + try Cloud Function email
      await replyToMessage(active.id, replyText, {
        email: active.email,
        name: active.name,
        subject: active.subject,
        originalMessage: active.message,
      });

      // Also try EmailJS (client-side email)
      const emailSent = await sendReplyEmailJS({
        visitorEmail: active.email,
        subject: active.subject,
        reply: replyText.trim(),
        originalMessage: active.message,
      });

      const replyBody = replyText.trim();

      if (mode === "gmail" || (!emailSent && mode === "direct")) {
        // Open Gmail compose as backup or when user explicitly requests
        openGmailReply({
          visitorEmail: active.email,
          visitorName: active.name,
          subject: active.subject,
          reply: replyBody,
        });
        setDirectSentToast(emailSent
          ? `✓ Email sent to ${active.email}. Gmail opened for notes.`
          : `✓ Reply saved. Gmail opened to send to ${active.email}.`);
      } else if (mode === "mailto") {
        window.location.href = `mailto:${active.email}?subject=${encodeURIComponent(
          `Re: ${active.subject}`,
        )}&body=${encodeURIComponent(replyBody)}`;
        setDirectSentToast(`✓ Reply saved. Opening mail app to send to ${active.email}.`);
      } else {
        setDirectSentToast(`✓ Email sent to ${active.email}`);
      }

      setItems((list) =>
        list.map((item) =>
          item.id === active.id
            ? { ...item, replied: true, reply: replyText.trim() }
            : item,
        ),
      );
      setActive((current) =>
        current ? { ...current, replied: true, reply: replyText.trim() } : current,
      );
      toast(`Reply sent to ${active.email}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-[1.8rem] border border-ink/10 bg-surface/85 p-6 shadow-[0_16px_50px_rgba(0,0,0,0.35)] sm:flex-row sm:items-center sm:p-7">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
            Client Inquiries
          </p>
          <h2 className="mt-1 font-display text-2xl font-medium sm:text-3xl">
            Messages & Notes
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:flex sm:items-center">
          <div className="rounded-2xl border border-ink/10 bg-canvas/60 px-4 py-2.5 text-center sm:text-left">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Total</p>
            <p className="font-display text-2xl font-semibold text-ink">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-gold/25 bg-gold/10 px-4 py-2.5 text-center sm:text-left">
            <p className="text-[10px] uppercase tracking-[0.14em] text-gold">Pending</p>
            <p className="font-display text-2xl font-semibold text-gold">{stats.pending}</p>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-canvas/60 px-4 py-2.5 text-center sm:text-left">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Replied</p>
            <p className="font-display text-2xl font-semibold text-ink/80">{stats.replied}</p>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-ink/12 bg-canvas/80 text-ink transition hover:border-gold/40 hover:text-gold"
            title="Refresh messages"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, subject or message text..."
            className="field pl-11"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-ink/10 bg-surface/80 p-1">
          <Filter className="ml-2.5 mr-1 h-3.5 w-3.5 text-muted" />
          {(
            [
              { key: "all", label: "All" },
              { key: "pending", label: "Awaiting Reply" },
              { key: "replied", label: "Replied" },
            ] as const
          ).map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => setFilter(pill.key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                filter === pill.key
                  ? "bg-ink text-canvas font-semibold"
                  : "text-muted hover:text-ink"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-highlight/30 bg-highlight/10 p-4 text-sm text-highlight">
          {error}
        </div>
      ) : null}

      {/* Messages List */}
      {loading ? (
        <div className="flex h-56 items-center justify-center rounded-[1.8rem] border border-ink/10 bg-surface/50">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[1.8rem] border border-dashed border-ink/15 bg-surface/40 py-16 text-center">
          <p className="font-display text-xl text-ink">No notes found</p>
          <p className="mt-1 text-sm text-muted">
            {search || filter !== "all"
              ? "Try resetting your search or filter pills."
              : "When a visitor sends a note through the contact form, it lands right here."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {filtered.map((item, index) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.22, delay: index * 0.03 }}
                className="group relative overflow-hidden rounded-[1.6rem] border border-ink/10 bg-surface/80 p-6 transition-all hover:border-gold/30 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="font-display text-xl font-medium text-ink">
                        {item.name}
                      </h3>
                      <span className="rounded-full border border-ink/12 bg-canvas/70 px-2.5 py-0.5 text-[11px] font-medium text-gold">
                        {item.type || "Inquiry"}
                      </span>
                      {item.replied ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Replied
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-0.5 text-[11px] font-semibold text-gold">
                          <Clock className="h-3 w-3" />
                          Pending Reply
                        </span>
                      )}
                    </div>
                    <a
                      href={`mailto:${item.email}`}
                      className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-gold"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {item.email}
                    </a>
                  </div>

                  <span className="text-xs text-muted/70">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Recent"}
                  </span>
                </div>

                <div className="mt-4 rounded-2xl border border-ink/10 bg-canvas/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">
                    {sanitizeHTML(item.subject)}
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink/90">
                    {sanitizeHTML(item.message)}
                  </p>
                </div>

                {item.replied && item.reply ? (
                  <div className="mt-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-3.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-400">
                      Your Saved Response
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-ink/80">
                      {item.reply}
                    </p>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setActive(item);
                        setReplyText(
                          item.reply ||
                            `Hi ${item.name.split(" ")[0]},\n\nThanks for reaching out about ${item.subject}. `,
                        );
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-canvas transition hover:bg-gold"
                    >
                      <MessageSquareReply className="h-3.5 w-3.5" />
                      {item.replied ? "View / Update Reply" : "Compose Reply"}
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        openGmailReply({
                          visitorEmail: item.email,
                          visitorName: item.name,
                          subject: item.subject,
                          reply: item.reply ||
                            `Hi ${item.name.split(" ")[0]},\n\nThanks for reaching out about ${item.subject}.`,
                        });
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-2 text-xs font-medium text-gold transition hover:bg-gold/20"
                    >
                      <Mail className="h-3 w-3" />
                      <span>Reply in Gmail</span>
                    </motion.button>
                  </div>

                  <button
                    type="button"
                    onClick={() => void onDelete(item.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-highlight/25 px-3.5 py-2 text-xs font-medium text-highlight transition hover:bg-highlight/15"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Reply Slide-over / Modal */}
      <AnimatePresence>
        {active ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-ink/12 bg-surface/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.65)] sm:p-8"
            >
              <div className="flex items-center justify-between border-b border-ink/10 pb-4">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                    Send Studio Reply
                  </span>
                  <h3 className="font-display text-2xl font-medium">
                    Reply to {active.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-muted transition hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-ink/10 bg-canvas/70 p-3.5 text-xs text-muted">
                <span className="font-semibold text-ink">Original Note ({sanitizeHTML(active.subject)}):</span>{" "}
                {sanitizeHTML(active.message)}
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Your Response to {active.email}
                </label>
                <textarea
                  className="field min-h-40 font-sans text-sm leading-relaxed"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your message to the client..."
                />
              </div>

              {directSentToast ? (
                <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-400">
                  {directSentToast}
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="rounded-full border border-ink/12 px-4 py-2.5 text-xs font-semibold text-ink"
                >
                  Close
                </button>
                <motion.button
                  type="button"
                  disabled={busy || replyText.trim().length < 2}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => void onSendReply("direct")}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-gold to-accent px-5 py-2.5 text-xs font-semibold text-canvas shadow-md disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>Send Email to Client</span>
                </motion.button>
                <motion.button
                  type="button"
                  disabled={busy || replyText.trim().length < 2}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => void onSendReply("gmail")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-4 py-2.5 text-xs font-semibold text-gold transition hover:bg-gold/20 disabled:opacity-50"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Reply via Gmail</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
