import { AnimatePresence, motion } from "framer-motion";
import { AtSign, MapPin, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "../components/ui";
import {
  addContactInfo,
  deleteContactInfo,
  fetchContactInfo,
  updateContactInfo,
  type ContactInfoItem,
} from "../firebase";
import { Field } from "./ProjectsPanel";

const empty = {
  label: "",
  value: "",
  icon: "Mail",
  iconOptions: "Mail",
  iconCustom: "",
  order: 0,
};

const iconOptions = [
  { key: "Mail", label: "Mail" },
  { key: "MapPin", label: "Map pin" },
  { key: "Clock3", label: "Clock" },
  { key: "Phone", label: "Phone" },
  { key: "Globe", label: "Globe" },
  { key: "custom", label: "Custom (emoji or text)" },
];

export function ContactPanel() {
  const [items, setItems] = useState<ContactInfoItem[]>([]);
  const [form, setForm] = useState<typeof empty>({ ...empty });
  const [editing, setEditing] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    try {
      setItems(await fetchContactInfo());
    } catch {
      setError("Could not load contact info. Check that you are signed in and the rules allow reading contactInfo.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...empty, order: items.length + 1 });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (item: ContactInfoItem) => {
    setEditing(item.id);
    const isCustom = !iconOptions.some((opt) => opt.key === item.icon);
    setForm({
      label: item.label,
      value: item.value,
      icon: item.icon || "Mail",
      iconOptions: isCustom ? "custom" : item.icon,
      iconCustom: isCustom ? item.icon : "",
      order: item.order ?? 0,
    });
    setError("");
    setModalOpen(true);
  };

  const submit = async () => {
    if (form.label.trim().length < 2 || form.value.trim().length < 2) {
      setError("Please give the contact field a label and a value.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = {
        label: form.label.trim(),
        value: form.value.trim(),
        icon: form.icon.trim() || "Mail",
        order: Number(form.order) || items.length,
      };
      if (editing) {
        await updateContactInfo(editing, payload);
        toast("Contact field updated.");
      } else {
        await addContactInfo(payload);
        toast("Contact field added!");
      }
      setModalOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(/permission|denied/i.test(msg)
        ? "Permission denied by Firestore Rules. Publish the contactInfo rules and ensure only your admin account writes here."
        : "Could not save contact info: " + msg);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id?: string) => {
    if (!id) return;      if (!window.confirm("Remove this contact field from the public site?")) return;
      try {
        await deleteContactInfo(id);
        toast("Contact field removed.", "info");
        await load();
      } catch {
        setError("Could not delete that contact field.");
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-[1.8rem] border border-ink/10 bg-surface/85 p-6 sm:flex-row sm:items-center sm:p-7">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
            Site Contact Info
          </p>
          <h2 className="mt-1 font-display text-2xl font-medium sm:text-3xl">Contact</h2>
          <p className="mt-1 text-xs text-muted">
            Edit the email, location, and response-time cards shown on the public Contact section.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-accent px-5 py-3 text-xs font-semibold text-canvas shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Add Contact Field</span>
          </motion.button>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/12 text-ink"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-highlight/30 bg-highlight/10 px-4 py-3 text-sm text-highlight" role="alert">
          {error}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[1.8rem] border border-dashed border-ink/15 bg-surface/40 py-16 text-center">
          <AtSign className="h-9 w-9 text-muted/40" />
          <p className="mt-3 font-display text-xl text-ink">No contact fields yet</p>
          <p className="mt-1 text-sm text-muted">Click "Add Contact Field" to publish your email, location, and more.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence>
            {items.map((item) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-start justify-between gap-4 rounded-[1.6rem] border border-ink/10 bg-surface/80 p-5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold">
                      {item.icon === "MapPin" ? <MapPin className="h-4 w-4" /> : item.icon === "Mail" ? <AtSign className="h-4 w-4" /> : item.icon === "Phone" ? <AtSign className="h-4 w-4" /> : item.icon === "Globe" ? <AtSign className="h-4 w-4" /> : item.icon === "Clock3" ? <AtSign className="h-4 w-4" /> : <span className="text-lg" role="img" aria-label={item.label}>{item.icon}</span>}
                    </span>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                      {item.label}
                    </p>
                  </div>
                  <p className="mt-3 break-all text-sm font-medium text-ink">{item.value}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink/12 text-ink hover:text-gold"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(item.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-highlight/25 text-highlight"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}

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
              className="w-full max-w-md overflow-hidden rounded-[2rem] border border-ink/12 bg-surface/95 p-6 shadow-2xl sm:p-8"
            >
              <div className="flex items-center justify-between border-b border-ink/10 pb-4">
                <h3 className="font-display text-2xl font-medium">
                  {editing ? "Edit Contact Field" : "Add Contact Field"}
                </h3>
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
                  label="Label"
                  value={form.label}
                  onChange={(label) => setForm((f) => ({ ...f, label }))}
                />
                <Field
                  label="Value (email, location, or text)"
                  value={form.value}
                  onChange={(value) => setForm((f) => ({ ...f, value }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <label className="block text-sm">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Icon
                    </span>
                    <select
                      className="field font-sans text-sm"
                      value={form.iconOptions === "custom" ? "custom" : form.icon}
                      onChange={(event) => {
                        const val = event.target.value;
                        if (val === "custom") {
                          setForm((f) => ({ ...f, iconOptions: "custom", icon: f.iconCustom || "\u2709" }));
                        } else {
                          setForm((f) => ({ ...f, iconOptions: val, icon: val }));
                        }
                      }}
                    >
                      {iconOptions.map((opt) => (
                        <option key={opt.key} value={opt.key}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Field
                    label="Order"
                    type="number"
                    value={String(form.order)}
                    onChange={(value) => setForm((f) => ({ ...f, order: Number(value) }))}
                  />
                </div>
                {form.iconOptions === "custom" ? (
                  <Field
                    label="Custom Icon (emoji or text, e.g. \u2709 \ud83d\udce7 \ud83d\udccd)"
                    value={form.iconCustom || ""}
                    onChange={(val) => setForm((f) => ({ ...f, iconCustom: val, icon: val || "\u2709" }))}
                  />
                ) : null}

                {error ? <p className="text-xs font-medium text-highlight">{error}</p> : null}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-full border border-ink/12 px-5 py-2.5 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-full bg-ink px-6 py-2.5 text-xs font-semibold text-canvas"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
