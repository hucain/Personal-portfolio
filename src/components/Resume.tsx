import { AnimatePresence, motion } from "framer-motion";
import { Printer, X } from "lucide-react";
import { useEffect } from "react";
import {
  coreFrontend,
  education,
  frameworks,
  profile,
  workRoles,
} from "../data";

export function Resume({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const skills = [...coreFrontend, ...frameworks].map((item) => item.name);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-canvas/70 p-3 backdrop-blur-md sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="resume-title"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[1.6rem] border border-ink/10 bg-void-soft shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-4 py-3 sm:px-5 print:hidden">
              <p className="text-sm font-medium">Resume</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-canvas hover:bg-gold"
                >
                  <Printer className="h-4 w-4" />
                  Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/10"
                  aria-label="Close resume"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-3 sm:p-5">
              <article
                id="resume-sheet"
                className="resume-sheet rounded-2xl bg-[#f6f1e8] px-6 py-8 text-[#1b1712] sm:px-10 sm:py-10"
              >
                <header className="border-b border-[#1b1712]/15 pb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a5a3b]">
                    {profile.role}
                  </p>
                  <h2 id="resume-title" className="mt-2 font-display text-3xl font-medium sm:text-4xl">
                    {profile.name}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed">
                    {profile.location} ·{" "}
                    <a href={`mailto:${profile.email}`} className="underline decoration-[#8a5a3b]/40">
                      {profile.email}
                    </a>
                    {" · "}
                    {profile.experienceDetail}
                  </p>
                </header>

                <section className="mt-6">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a5a3b]">
                    Summary
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed">
                    Frontend specialist based in Lahore. I build websites and product
                    interfaces — especially ones that sit next to AI — and I care about
                    how they feel when someone actually uses them. One year in. Still
                    picky about the details.
                  </p>
                </section>

                <section className="mt-6">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a5a3b]">
                    Experience
                  </h3>
                  {workRoles.map((role) => (
                    <div key={role.title} className="mt-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-display text-lg font-medium">{role.title}</p>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a5a3b]">
                          {role.period}
                        </p>
                      </div>
                      <p className="text-sm text-[#5c564e]">{role.place}</p>
                      <p className="mt-2 text-sm leading-relaxed">{role.summary}</p>
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed">
                        {role.points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </section>

                <section className="mt-6">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a5a3b]">
                    Education
                  </h3>
                  <div className="mt-3 space-y-3">
                    {education.map((item) => (
                      <div key={item.year}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-medium">{item.title}</p>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a5a3b]">
                            {item.year}
                          </p>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-[#5c564e]">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="mt-6">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a5a3b]">
                    Skills
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed">{skills.join(" · ")}</p>
                </section>
              </article>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
