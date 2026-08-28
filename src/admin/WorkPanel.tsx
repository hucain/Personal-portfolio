import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  Download,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { fallbackWorkFocus, fallbackWorkRoles } from "../content";
import { useToast } from "../components/ui";
import {
  createDoc,
  fetchDocs,
  removeDoc,
  saveDoc,
  type WorkFocusItem,
  type WorkRoleItem,
} from "../firebase";
import { Field } from "./ProjectsPanel";

export function WorkPanel() {
  const [roles, setRoles] = useState<WorkRoleItem[]>([]);
  const [focus, setFocus] = useState<WorkFocusItem[]>([]);
  const [roleForm, setRoleForm] = useState({
    period: "",
    title: "",
    place: "",
    summary: "",
    points: "",
  });
  const [focusForm, setFocusForm] = useState({ title: "", detail: "" });
  const [roleModal, setRoleModal] = useState(false);
  const [focusModal, setFocusModal] = useState(false);
  const [roleEdit, setRoleEdit] = useState<string | null>(null);
  const [focusEdit, setFocusEdit] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setRoles(await fetchDocs<WorkRoleItem>("workRoles"));
    setFocus(await fetchDocs<WorkFocusItem>("workFocus"));
  };

  useEffect(() => {
    void load().catch(() => setError("Could not load work."));
  }, []);

  const saveRole = async () => {
    if (roleForm.title.trim().length < 2) {
      setError("Give the role a title.");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        period: roleForm.period.trim() || "2025 — now",
        title: roleForm.title.trim(),
        place: roleForm.place.trim() || "Lahore, Pakistan",
        summary: roleForm.summary.trim(),
        points: roleForm.points
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        order: roles.length,
      };
      if (roleEdit) {
        await saveDoc("workRoles", roleEdit, payload);
        toast("Work role updated.");
      } else {
        await createDoc("workRoles", payload);
        toast("New work role added!");
      }
      setRoleModal(false);
      setRoleEdit(null);
      setError("");
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save.";
      setError(msg);
      if (import.meta.env.DEV) console.error("saveRole failed", err);
    } finally {
      setBusy(false);
    }
  };

  const saveFocus = async () => {
    if (focusForm.title.trim().length < 2) {
      setError("Give the focus a title.");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        title: focusForm.title.trim(),
        detail: focusForm.detail.trim(),
        order: focus.length,
      };
      if (focusEdit) {
        await saveDoc("workFocus", focusEdit, payload);
        toast("Focus pillar updated.");
      } else {
        await createDoc("workFocus", payload);
        toast("New focus pillar added!");
      }
      setFocusModal(false);
      setFocusEdit(null);
      setError("");
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save.";
      setError(msg);
      if (import.meta.env.DEV) console.error("saveFocus failed", err);
    } finally {
      setBusy(false);
    }
  };

  const seed = async () => {
    setBusy(true);
    try {
      for (const item of fallbackWorkRoles) {
        const { id: _id, ...rest } = item;
        await createDoc("workRoles", rest);
      }
      for (const item of fallbackWorkFocus) {
        const { id: _id, ...rest } = item;
        await createDoc("workFocus", rest);
      }
      toast(`Imported ${fallbackWorkRoles.length} roles and ${fallbackWorkFocus.length} focus pillars.`);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not import.";
      setError(msg);
      if (import.meta.env.DEV) console.error("seed failed", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-[1.8rem] border border-ink/10 bg-surface/85 p-6 sm:flex-row sm:items-center sm:p-7">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
            Experience & Focus
          </p>
          <h2 className="mt-1 font-display text-2xl font-medium sm:text-3xl">
            Work History & Specialties
          </h2>
          <p className="mt-1 text-xs text-muted">
            Manage your timeline roles and the 3 studio highlight cards shown on #work.
          </p>
          {error ? <p className="mt-2 text-xs text-highlight">{error}</p> : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {roles.length === 0 && focus.length === 0 ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void seed()}
              className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2.5 text-xs font-semibold text-gold hover:bg-gold/20"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Import Default Work Profile</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Roles Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-gold" />
            <h3 className="font-display text-xl font-medium">Work Roles</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setRoleEdit(null);
              setRoleForm({
                period: "2025 — now",
                title: "",
                place: "Lahore, Pakistan",
                summary: "",
                points: "",
              });
              setRoleModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-canvas transition hover:bg-gold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Work Role</span>
          </button>
        </div>

        <div className="grid gap-4">
          {roles.map((item) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col justify-between gap-4 rounded-[1.6rem] border border-ink/10 bg-surface/80 p-6 sm:flex-row sm:items-start"
            >
              <div className="flex-1">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
                  {item.period}
                </span>
                <h4 className="mt-1 font-display text-2xl font-medium text-ink">
                  {item.title}
                </h4>
                <p className="text-xs text-muted">{item.place}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink/90">
                  {item.summary}
                </p>
                {item.points && item.points.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {item.points.map((pt) => (
                      <li
                        key={pt}
                        className="rounded-full border border-ink/10 bg-canvas/60 px-3 py-1 text-xs text-muted"
                      >
                        • {pt}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRoleEdit(item.id);
                    setRoleForm({
                      period: item.period,
                      title: item.title,
                      place: item.place,
                      summary: item.summary,
                      points: (item.points || []).join("\n"),
                    });
                    setRoleModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-canvas/70 px-3.5 py-1.5 text-xs font-medium text-ink hover:border-gold/40 hover:text-gold"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm("Remove this role?")) return;
                    await removeDoc("workRoles", item.id);
                    toast("Work role removed.", "info");
                    await load();
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-highlight/25 text-highlight hover:bg-highlight/15"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      {/* Focus Pillars Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <h3 className="font-display text-xl font-medium">Focus Pillars</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setFocusEdit(null);
              setFocusForm({ title: "", detail: "" });
              setFocusModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-canvas transition hover:bg-gold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Focus Pillar</span>
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {focus.map((item) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col justify-between rounded-[1.6rem] border border-ink/10 bg-surface/80 p-5"
            >
              <div>
                <h4 className="font-display text-lg font-medium text-ink">
                  {item.title}
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  {item.detail}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2 border-t border-ink/10 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setFocusEdit(item.id);
                    setFocusForm({ title: item.title, detail: item.detail });
                    setFocusModal(true);
                  }}
                  className="rounded-full border border-ink/12 px-3 py-1 text-xs hover:text-gold"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm("Remove this focus pillar?")) return;
                    await removeDoc("workFocus", item.id);
                    toast("Focus pillar removed.", "info");
                    await load();
                  }}
                  className="text-highlight hover:opacity-80"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      {/* Role Modal */}
      <AnimatePresence>
        {roleModal ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRoleModal(false)}
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
                    {roleEdit ? "Update Role" : "New Career Chapter"}
                  </p>
                  <h3 className="font-display text-2xl font-medium">
                    {roleEdit ? "Edit Work Role" : "Add Work Role"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setRoleModal(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-muted hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form
                className="mt-5 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveRole();
                }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Period / Years"
                    value={roleForm.period}
                    onChange={(period) => setRoleForm((f) => ({ ...f, period }))}
                  />
                  <Field
                    label="Location"
                    value={roleForm.place}
                    onChange={(place) => setRoleForm((f) => ({ ...f, place }))}
                  />
                </div>
                <Field
                  label="Role Title"
                  value={roleForm.title}
                  onChange={(title) => setRoleForm((f) => ({ ...f, title }))}
                />
                <Field
                  label="Summary Paragraph"
                  value={roleForm.summary}
                  onChange={(summary) => setRoleForm((f) => ({ ...f, summary }))}
                  area
                />
                <Field
                  label="Key Bullet Points (one per line)"
                  value={roleForm.points}
                  onChange={(points) => setRoleForm((f) => ({ ...f, points }))}
                  area
                />

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRoleModal(false)}
                    className="rounded-full border border-ink/12 px-5 py-2.5 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-full bg-ink px-6 py-2.5 text-xs font-semibold text-canvas"
                  >
                    Save Role
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Focus Modal */}
      <AnimatePresence>
        {focusModal ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFocusModal(false)}
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
                  {focusEdit ? "Edit Focus Pillar" : "Add Focus Pillar"}
                </h3>
                <button
                  type="button"
                  onClick={() => setFocusModal(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-muted hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form
                className="mt-5 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveFocus();
                }}
              >
                <Field
                  label="Title"
                  value={focusForm.title}
                  onChange={(title) => setFocusForm((f) => ({ ...f, title }))}
                />
                <Field
                  label="Short Description"
                  value={focusForm.detail}
                  onChange={(detail) => setFocusForm((f) => ({ ...f, detail }))}
                  area
                />
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setFocusModal(false)}
                    className="rounded-full border border-ink/12 px-5 py-2.5 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-full bg-ink px-6 py-2.5 text-xs font-semibold text-canvas"
                  >
                    Save Pillar
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
