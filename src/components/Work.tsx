import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { fallbackWorkFocus, fallbackWorkRoles, watchWorkFocus, watchWorkRoles } from "../content";
import type { WorkFocusItem, WorkRoleItem } from "../firebase";
import { SectionHeading, fadeUp, stagger } from "./ui";

export function Work() {
  const [roles, setRoles] = useState<WorkRoleItem[]>(fallbackWorkRoles);
  const [focus, setFocus] = useState<WorkFocusItem[]>(fallbackWorkFocus);

  useEffect(() => {
    const unsubs = [
      watchWorkRoles(setRoles),
      watchWorkFocus(setFocus),
    ];
    return () => { unsubs.forEach((u) => u()); };
  }, []);

  return (
    <section id="work" className="relative px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Work"
          title="What I actually do with a weekday."
          description="One year in AI web development. I build the frontend, keep it tidy, and stay close to how it feels in a browser."
        />

        <div className="grid items-start gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="space-y-5"
          >
            {roles.map((role) => (
              <motion.article
                key={role.id || role.title}
                variants={fadeUp}
                transition={{ duration: 0.55, ease: "easeOut" }}
                whileHover={{ y: -4 }}
                className="card-glow-border card-inner-glow hover-glow rounded-[1.8rem] border border-ink/10 bg-surface/80 p-7 backdrop-blur-sm transition-colors hover:border-accent/20 sm:p-8"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">{role.period}</p>
                <h3 className="mt-3 font-display text-2xl font-medium sm:text-3xl">{role.title}</h3>
                <p className="mt-1 text-sm text-muted">{role.place}</p>
                <p className="mt-5 text-base leading-relaxed text-ink/90">{role.summary}</p>
                <motion.ul
                  variants={stagger}
                  initial="hidden"
                  animate="visible"
                  className="mt-6 space-y-3"
                >
                  {(role.points || []).map((point) => (
                    <motion.li key={point} variants={fadeUp} transition={{ duration: 0.4 }} className="flex gap-3 text-sm leading-relaxed text-muted">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-highlight" />
                      <span>{point}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.article>
            ))}
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {focus.map((item) => (
              <motion.article
                key={item.id || item.title}
                variants={fadeUp}
                transition={{ duration: 0.55, ease: "easeOut" }}
                whileHover={{ y: -5, scale: 1.015 }}
                className="card-glow-border card-inner-glow rounded-[1.6rem] border border-ink/10 bg-void-soft/80 p-6 backdrop-blur-sm transition-colors hover:border-accent/25"
              >
                <h3 className="font-display text-xl font-medium">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.detail}</p>
              </motion.article>
            ))}

            <motion.a
              href="#contact"
              variants={fadeUp}
              transition={{ duration: 0.55, ease: "easeOut" }}
              whileHover={{ y: -3, scale: 1.01 }}
              className="card-glow-border flex items-center justify-between rounded-[1.6rem] border border-gold/25 bg-gold/10 px-6 py-5 backdrop-blur-sm transition-shadow hover:shadow-[0_0_30px_rgba(212,180,131,0.15)]"
            >
              <span>
                <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-gold">Available</span>
                <span className="mt-1 block font-display text-lg font-medium">Need a pair of hands?</span>
              </span>
              <ArrowUpRight className="h-5 w-5 text-gold" />
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
