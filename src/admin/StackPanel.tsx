import { AnimatePresence, motion } from "framer-motion";
import { Download, Layers, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { fallbackStack } from "../content";
import { useToast } from "../components/ui";
import { createDoc, fetchDocs, removeDoc, saveDoc, type StackItem } from "../firebase";
import { TechGlyph } from "../components/TechIcons";
import { Field } from "./ProjectsPanel";

const empty = {
  name: "",
  blurb: "",
  accent: "#d4b483",
  key: "js",
  group: "core" as StackItem["group"],
  order: 0,
  customIcon: "",
};

const iconPresets = [
  { key: "html", label: "HTML5", accent: "#f2a36b" },
  { key: "css", label: "CSS3", accent: "#7eb8ff" },
  { key: "js", label: "JavaScript", accent: "#e8c872" },
  { key: "ts", label: "TypeScript", accent: "#8fb4ff" },
  { key: "react", label: "React.js", accent: "#7dd3e8" },
  { key: "angular", label: "Angular", accent: "#f08a9a" },
  { key: "vue", label: "Vue.js", accent: "#7dcea0" },
  { key: "custom", label: "Custom (upload icon)", accent: "#d4b483" },
];

export function StackPanel() {
  const [items, setItems] = useState<StackItem[]>([]);
  const [form, setForm] = useState({ ...empty });
  const [editing, setEditing] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const load = async () => setItems(await fetchDocs<StackItem>("stack"));

  useEffect(() => {
    void load().catch(() => setError("Could not load stack."));
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...empty, order: items.length + 1 });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (item: StackItem) => {
    setEditing(item.id);
    const isCustom = !iconPresets.some((p) => p.key === item.key);
    setForm({
      name: item.name,
      blurb: item.blurb,
      accent: item.accent || "#d4b483",
      key: isCustom ? "custom" : item.key,
      group: item.group || "core",
      order: item.order ?? 0,
      customIcon: isCustom ? item.key : "",
    });
    setError("");
    setModalOpen(true);
  };

  const submit = async () => {
    if (form.name.trim().length < 2) {
      setError("Give the tool a name.");
      return;
    }
    setBusy(true);
    try {
    const iconKey = form.key === "custom"
      ? (form.customIcon.trim() || form.name.trim().slice(0, 2).toUpperCase())
      : form.key;
    const payload = {
      name: form.name.trim(),
      blurb: form.blurb.trim(),
      accent: form.accent.trim() || "#d4b483",
      key: iconKey,
      group: form.group,
      order: Number(form.order) || items.length,
    };
      if (editing) {
        await saveDoc("stack", editing, payload);
        toast("Stack item updated.");
      } else {
        await createDoc("stack", payload);
        toast("New technology added to stack!");
      }
      setModalOpen(false);
      setEditing(null);
      setError("");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const seed = async () => {
    setBusy(true);
    try {
      for (const item of fallbackStack) {
        const { id: _id, ...rest } = item;
        await createDoc("stack", rest);
      }
      toast(`Imported ${fallbackStack.length} default stack items.`);
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
            Frontend Arsenal
          </p>
          <h2 className="mt-1 font-display text-2xl font-medium sm:text-3xl">
            Tech Stack Grid
          </h2>
          <p className="mt-1 text-xs text-muted">
            Add or edit tools displayed in "The basics" or "Where I build".
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {items.length === 0 ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void seed()}
              className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2.5 text-xs font-semibold text-gold hover:bg-gold/20"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Import Default Stack</span>
            </button>
          ) : null}
          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-accent px-5 py-3 text-xs font-semibold text-canvas shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Add Technology</span>
          </motion.button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[1.8rem] border border-dashed border-ink/15 bg-surface/40 py-16 text-center">
          <Layers className="h-10 w-10 text-muted/40" />
          <p className="mt-3 font-display text-xl text-ink">No stack items in database</p>
          <p className="mt-1 text-sm text-muted">
            Click "Import Default Stack" or add a new custom tech card.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {items.map((item, index) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="group flex flex-col justify-between rounded-[1.6rem] border border-ink/10 bg-surface/80 p-5 transition-all hover:border-gold/30 hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-ink/10 bg-canvas"
                      style={{ color: item.accent, boxShadow: `0 0 20px ${item.accent}22` }}
                    >
                      <TechGlyph name={item.key} />
                    </div>
                    <span className="rounded-full border border-ink/10 bg-canvas/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
                      {item.group === "core" ? "Core" : "Framework"}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-xl font-medium text-ink">
                    {item.name}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">
                    {item.blurb}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2 border-t border-ink/10 pt-3">
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
                      if (!window.confirm(`Remove "${item.name}" from stack?`)) return;
                      await removeDoc("stack", item.id);
                      toast("Removed from stack.", "info");
                      await load();
                    }}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-highlight/25 text-highlight hover:bg-highlight/15"
                    title="Remove item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
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
                    {editing ? "Update Stack Tool" : "Add New Technology"}
                  </p>
                  <h3 className="font-display text-2xl font-medium">
                    {editing ? "Edit Tech Card" : "New Tech Card"}
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
                  label="Technology Name"
                  value={form.name}
                  onChange={(name) => setForm((f) => ({ ...f, name }))}
                />

                <div className="grid grid-cols-2 gap-4">
                  <label className="block text-sm">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Category
                    </span>
                    <select
                      className="field font-sans text-sm"
                      value={form.group}
                      onChange={(event) =>
                        setForm((f) => ({
                          ...f,
                          group: event.target.value as StackItem["group"],
                        }))
                      }
                    >
                      <option value="core">The basics (Core Frontend)</option>
                      <option value="framework">Where I build (JS/TS Frameworks)</option>
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Icon Preset
                    </span>
                    <select
                      className="field font-sans text-sm"
                      value={form.key}
                      onChange={(event) => {
                        const preset = iconPresets.find(
                          (p) => p.key === event.target.value,
                        );
                        setForm((f) => ({
                          ...f,
                          key: event.target.value,
                          accent: preset ? preset.accent : f.accent,
                        }));
                      }}
                    >
                      {iconPresets.map((preset) => (
                        <option key={preset.key} value={preset.key}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {form.key === "custom" ? (
                  <Field
                    label="Custom Icon (first 2 letters, e.g. PY, RB, GO)"
                    value={form.customIcon || ""}
                    onChange={(val) => setForm((f) => ({ ...f, customIcon: val }))}
                  />
                ) : null}

                <Field
                  label="Human Commentary (blurb)"
                  value={form.blurb}
                  onChange={(blurb) => setForm((f) => ({ ...f, blurb }))}
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
                    <span>{editing ? "Save Card" : "Add to Stack"}</span>
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
