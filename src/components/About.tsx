import { motion, useScroll, useTransform } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { useRef } from "react";
import { education, profile } from "../data";
import { fadeUp, SectionHeading, stagger } from "./ui";

export function About() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const orbY = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <section id="about" ref={sectionRef} className="relative px-4 py-20 sm:px-6 lg:py-28">
      {/* Parallax accent orb */}
      <motion.div
        style={{ y: orbY }}
        className="pointer-events-none absolute -left-16 top-1/3 h-52 w-52 rounded-full bg-gold/8 blur-[90px]"
      />
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="A bit about me"
          title="I like work that looks finished. Not loud. Just right."
          description="AI web development, modern frontend, and a Computer Science path I actually sat through."
        />

        <div className="grid items-start gap-6 sm:gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
          >
            <motion.div
              variants={fadeUp}
              className="card-glow-border rounded-3xl border border-ink/10 bg-surface/70 p-7 backdrop-blur-sm sm:p-8"
            >
              <p className="text-base leading-relaxed text-ink/90 sm:text-lg">
                I’m Hussain. I live in {profile.location} and I build websites — mostly the
                frontend, often with a bit of AI in the mix. I care about how a page feels
                when someone actually clicks around: the type, the gaps, whether a button
                behaves like it meant to.
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
                I’ve been doing this for a year now. School gave me the ground — Matric
                with Computer Science in 2025, then Intermediate in ICS in 2026. Building
                things taught me the rest. I’m not trying to sound bigger than I am. I just
                like sitting with the details instead of rushing a template out the door.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="card-glow-border rounded-3xl border border-gold/20 bg-gradient-to-br from-surface via-void-soft to-highlight/10 p-6 backdrop-blur-sm sm:p-7"
          >
            <motion.p variants={fadeUp} className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
              School, briefly
            </motion.p>
            <div className="mt-5 space-y-6">
              {education.map((item, index) => (
                <motion.div key={item.year} variants={fadeUp} transition={{ duration: 0.5, delay: index * 0.08 }} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: 6 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      className="flex h-10 w-10 items-center justify-center rounded-2xl border border-ink/10 bg-canvas"
                    >
                      <GraduationCap className="h-4 w-4 text-highlight" />
                    </motion.div>
                    {index < education.length - 1 ? (
                      <motion.div
                        initial={{ scaleY: 0 }}
                        whileInView={{ scaleY: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 + index * 0.15, ease: "easeOut" }}
                        className="timeline-line mt-1 h-full min-h-[40px] w-px origin-top"
                      />
                    ) : null}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gold">{item.year}</p>
                    <p className="mt-1 font-display text-xl font-medium">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{item.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
