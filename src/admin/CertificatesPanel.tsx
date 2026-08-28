import { AnimatePresence, motion } from "framer-motion";
import { Award, ExternalLink, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "../components/ui";
import {
  addCertificate,
  deleteCertificate,
  fetchCertificates,
  updateCertificate,
  type CertificateItem,
} from "../firebase";
import { Field } from "./ProjectsPanel";

const empty = {
  title: "",
  issuer: "",
  year: "",
  credentialId: "",
  href: "",
  order: 0,
};

export function CertificatesPanel() {
  const [items, setItems] = useState<CertificateItem[]>([]);
  const [form, setForm] = useState<typeof empty>({ ...empty });
  const [editing, setEditing] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const remote = await fetchCertificates();
    setItems(remote);
  };

  useEffect(() => {
    void load().catch(() => setError("Could not load certificates."));
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...empty, order: items.length + 1 });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (item: CertificateItem) => {
    setEditing(item.id);
    setForm({
      title: item.title,
      issuer: item.issuer,
      year: item.year,
      credentialId: item.credentialId || "",
      href: item.href || "",
      order: item.order ?? 0,
    });
    setError("");
    setModalOpen(true);
  };

  const submit = async () => {
    if (form.title.trim().length < 2 || form.issuer.trim().length < 2) {
      setError("Give the certificate a title and an issuer.");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        issuer: form.issuer.trim(),
        year: form.year.trim(),
        credentialId: form.credentialId.trim(),
        href: form.href.trim(),
        order: Number(form.order) || items.length,
      };
      if (editing) {
        await updateCertificate(editing, payload);
        toast("Certificate updated.");
      } else {
        await addCertificate(payload);
        toast("Certificate published!");
      }
      setModalOpen(false);
      setEditing(null);
      setError("");
      await load();
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
            Credentials & Awards
          </p>
          <h2 className="mt-1 font-display text-2xl font-medium sm:text-3xl">
            Certificates
          </h2>
          <p className="mt-1 text-xs text-muted">
            Add, edit, or remove certificates shown publicly under the #certificate section.
          </p>
        </div>

        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-accent px-5 py-3 text-xs font-semibold text-canvas shadow-md"
        >
          <Plus className="h-4 w-4" />
          <span>Add Certificate</span>
        </motion.button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[1.8rem] border border-dashed border-ink/15 bg-surface/40 py-16 text-center">
          <Award className="h-10 w-10 text-muted/40" />
          <p className="mt-3 font-display text-xl text-ink">No certificates added yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Click "Add Certificate" above to publish your first credential.
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
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="flex flex-col justify-between rounded-[1.6rem] border border-ink/10 bg-surface/80 p-6 transition-all hover:border-gold/30 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10 text-gold">
                    <Award className="h-5 w-5" />
                  </span>
                  <span className="rounded-full border border-ink/10 bg-canvas/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    {item.year || "Year?"}
                  </span>
                </div>

                <h3 className="mt-4 font-display text-xl font-medium text-ink">{item.title}</h3>
                <p className="mt-1 text-xs text-muted">Issued by {item.issuer}</p>

                {item.credentialId ? (
                  <p className="mt-2 text-xs font-mono text-ink/50">ID: {item.credentialId}</p>
                ) : null}

                <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-3">
                  <div>
                    {item.href ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline"
                      >
                        <span>Verify / Open PDF</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted/60">No link or PDF attached</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-canvas/70 px-3 py-1.5 text-xs font-medium text-ink hover:border-gold/40 hover:text-gold"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm(`Delete "${item.title}"?`)) return;
                        await deleteCertificate(item.id);
                        toast("Certificate removed.", "info");
                        await load();
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-highlight/25 text-highlight hover:bg-highlight/15"
                      title="Remove certificate"
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

      {/* Add / Edit Modal */}
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
                    {editing ? "Update Credential" : "New Credential"}
                  </p>
                  <h3 className="font-display text-2xl font-medium">
                    {editing ? "Edit Certificate" : "Add Certificate"}
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
                  label="Certificate Title"
                  value={form.title}
                  onChange={(title) => setForm((f) => ({ ...f, title }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Issuer / Institute"
                    value={form.issuer}
                    onChange={(issuer) => setForm((f) => ({ ...f, issuer }))}
                  />
                  <Field
                    label="Year Completed"
                    value={form.year}
                    onChange={(year) => setForm((f) => ({ ...f, year }))}
                  />
                </div>
                <Field
                  label="Credential / Certificate ID (optional)"
                  value={form.credentialId}
                  onChange={(credentialId) => setForm((f) => ({ ...f, credentialId }))}
                />
                <Field
                  label="Verify / PDF URL (optional)"
                  value={form.href}
                  onChange={(href) => setForm((f) => ({ ...f, href }))}
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
                    <span>{editing ? "Save Changes" : "Publish Certificate"}</span>
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
