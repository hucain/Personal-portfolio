import { motion } from "framer-motion";
import { ArrowUpRight, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { fallbackProjects, watchProjects } from "../content";
import { safeExternalUrl, type ProjectItem } from "../firebase";
import { SectionHeading } from "./ui";

export function Projects() {
  const [items, setItems] = useState<ProjectItem[]>(fallbackProjects);

  useEffect(() => {
    return watchProjects(setItems);
  }, []);

  return (
    <section id="project" className="relative px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Project"
          title={items.length ? "A few things I can stand behind." : "Nothing public yet. I’m not going to fake a case study."}
          description={
            items.length
              ? "These are the pieces I have ready to show. More will land here when they’re finished."
              : "I’m building. When a piece is ready to be looked at, it’ll live here."
          }
        />

        {items.length === 0 ? (
          <motion.article
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card-glow-border relative overflow-hidden rounded-[1.8rem] border border-ink/10 bg-surface/80 p-8 backdrop-blur-sm sm:p-10"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-gold to-highlight" />
            <span className="inline-flex items-center gap-2 rounded-full border border-highlight/25 bg-highlight/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-highlight">
              <Clock className="h-3.5 w-3.5" />
              Still cooking
            </span>
            <h3 className="mt-6 font-display text-2xl font-medium tracking-tight sm:text-3xl lg:text-5xl">
              Projects arriving soon
            </h3>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
              If you want to hear what I’m working on, the contact form below is the honest version.
            </p>
          </motion.article>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {items.map((item) => {
              const safeHref = safeExternalUrl(item.href);
              return (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 26, clipPath: "inset(8px round 1.6rem)" }}
                  whileInView={{ opacity: 1, y: 0, clipPath: "inset(0px round 1.6rem)" }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -6, scale: 1.01 }}
                  className="card-glow-border card-inner-glow group relative overflow-hidden rounded-[1.6rem] border border-ink/10 bg-surface/80 p-6 backdrop-blur-sm transition-colors hover:border-accent/30"
                >
                  {/* Shine sweep on hover */}
                  <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">{item.status}</p>
                  <h3 className="mt-3 font-display text-2xl">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.detail}</p>
                  {safeHref ? (
                    <a href={safeHref} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-ink">
                      Have a look
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  ) : null}
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
