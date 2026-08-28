import { AnimatePresence, motion } from "framer-motion";
import {
  ExternalLink,
  FolderPlus,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useToast } from "../components/ui";
import { auth, createDoc, fetchDocs, hasAdminClaim, removeDoc, saveDoc, type ProjectItem } from "../firebase";

const empty: {
  title: string;
  detail: string;
  status: string;
  href: string;
  order: number;
} = {
  title: "",
  detail: "",
  status: "Live & Refined",
  href: "",
  order: 0,
};

export function ProjectsPanel() {
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [form, setForm] = useState({ ...empty });
  const [editing, setEditing] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const load = async () => setItems(await fetchDocs<ProjectItem>("projects"));

  useEffect(() => {
    void load().catch(() => setError("Could not load projects."));
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...empty, order: items.length + 1 });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (item: ProjectItem) => {
    setEditing(item.id);
    setForm({
      title: item.title,
      detail: item.detail,
      status: item.status || "Live & Refined",
      href: item.href || "",
      order: item.order ?? 0,
    });
    setError("");
    setModalOpen(true);
  };

  const submit = async () => {
    if (form.title.trim().length < 2 || form.detail.trim().length < 4) {
      setError("Please enter a title and a description.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        detail: form.detail.trim(),
        status: form.status.trim() || "Live & Refined",
        href: form.href.trim(),
        order: Number(form.order) || items.length,
      };
      if (editing) {
        await saveDoc("projects", editing, payload);
        toast("Project updated successfully.");
      } else {
        await createDoc("projects", payload);
        toast("Project published!");
      }
      setModalOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      // Surface the real reason so you aren't left guessing.
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (/permission|denied/i.test(msg)) {
        // Distinguish "you're not signed in" from "rules don't recognize you".
        const user = auth.currentUser;
        const isAdminFlag = user ? await hasAdminClaim(user).catch(() => false) : false;
        if (!user) {
          setError(
            "Not signed in. Open #studio-vault and sign in with the admin account before saving projects.",
          );
        } else if (!isAdminFlag) {
          setError(
            "Signed in, but this account is not recognized as admin. The Firestore Rules must allow your email (hucainomar490@gmail.com) OR an admin:true custom claim. Publish the email-aware rules.",
          );
        } else {
          setError(
            "Signed in as admin, but the published Firestore Rules still deny the write. Open Firebase console -> Firestore -> Rules and re-publish the rules that allow isAdmin() on projects.",
          );
        }
      } else {
        setError("Could not save project: " + msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-[1.8rem] border border-ink/10 bg-surface/85 p-6 sm:flex-row sm:items-center sm:p-7">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
            Live Showcase
          </p>
          <h2 className="mt-1 font-display text-2xl font-medium sm:text-3xl">
            Projects Portfolio
          </h2>
          <p className="mt-1 text-xs text-muted">
            Add or edit projects shown publicly under the #project section.
          </p>
        </div>
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-accent px-5 py-3 text-xs font-semibold text-canvas shadow-md"
        >
          <FolderPlus className="h-4 w-4" />
          <span>New Project Case</span>
        </motion.button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[1.8rem] border border-dashed border-ink/15 bg-surface/40 py-16 text-center">
          <p className="font-display text-xl text-ink">No custom projects added yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Click "New Project Case" above to publish your first portfolio showcase item.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence>
            {items.map((item, index) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.22, delay: index * 0.04 }}
                className="group flex flex-col justify-between rounded-[1.6rem] border border-ink/10 bg-surface/80 p-6 transition-all hover:border-gold/30 hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
                      {item.status}
                    </span>
                    <span className="text-[11px] font-mono text-muted">#{item.order + 1}</span>
                  </div>
                  <h3 className="mt-3.5 font-display text-2xl font-medium text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.detail}</p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-ink/10 pt-4">
                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline"
                    >
                      <span>Live link</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-muted/60">No URL link</span>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-canvas/70 px-3.5 py-1.5 text-xs font-medium text-ink hover:border-gold/40 hover:text-gold"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm(`Delete "${item.title}"?`)) return;
                        await removeDoc("projects", item.id);
                        toast("Project removed.", "info");
                        await load();
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-highlight/25 text-highlight hover:bg-highlight/15"
                      title="Remove project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Slide-Over Modal for Add/Edit */}
      <AnimatePresence>
        {modalOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-ink/12 bg-surface/95 p-6 shadow-2xl sm:p-8"
            >
              <div className="flex items-center justify-between border-b border-ink/10 pb-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                    {editing ? "Update Case" : "New Showcase Item"}
                  </p>
                  <h3 className="font-display text-2xl font-medium">
                    {editing ? "Edit Project" : "Add Project"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-muted hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form
                className="mt-5 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
              >
                <Field
                  label="Project Title"
                  value={form.title}
                  onChange={(title) => setForm((f) => ({ ...f, title }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Status Badge"
                    value={form.status}
                    onChange={(status) => setForm((f) => ({ ...f, status }))}
                  />
                  <Field
                    label="Live URL (optional)"
                    value={form.href}
                    onChange={(href) => setForm((f) => ({ ...f, href }))}
                  />
                </div>
                <Field
                  label="Description / Case Note"
                  value={form.detail}
                  onChange={(detail) => setForm((f) => ({ ...f, detail }))}
                  area
                />
                {error ? (
                  <p className="text-xs font-medium text-highlight">{error}</p>
                ) : null}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-full border border-ink/12 px-5 py-2.5 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={busy}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-xs font-semibold text-canvas"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{editing ? "Save Changes" : "Publish Project"}</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  area,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  area?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      {area ? (
        <textarea
          className="field min-h-24 font-sans text-sm"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className="field font-sans text-sm"
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

export function ManageShell({
  eyebrow,
  title,
  error,
  children,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  eyebrow: string;
  title: string;
  error?: string;
  children: ReactNode;
  onSubmit: () => void;
  submitLabel: string;
  onCancel?: () => void;
}) {
  const fields = Array.isArray(children) ? children.slice(0, -1) : children;
  const list = Array.isArray(children) ? children[children.length - 1] : null;

  return (
    <section>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">{eyebrow}</p>
      <h2 className="mt-1 font-display text-3xl">{title}</h2>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          className="space-y-4 rounded-[1.5rem] border border-ink/10 bg-surface/80 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          {fields}
          {error ? <p className="text-sm text-highlight">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-canvas"
            >
              <Plus className="h-4 w-4" />
              {submitLabel}
            </button>
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full border border-ink/12 px-4 py-2 text-sm"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
        <div>{list}</div>
      </div>
    </section>
  );
}
