import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { fallbackStack, watchStack } from "../content";
import type { StackItem } from "../firebase";
import { TechGlyph } from "./TechIcons";
import { GlowCard, SectionHeading } from "./ui";

export function TechStack() {
  const [items, setItems] = useState<StackItem[]>(fallbackStack);

  useEffect(() => {
    return watchStack(setItems);
  }, []);

  const core = items.filter((item) => item.group !== "framework");
  const tools = items.filter((item) => item.group === "framework");

  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const bgX = useTransform(scrollYProgress, [0, 1], [-30, 30]);

  return (
    <section id="stack" ref={sectionRef} className="relative px-4 py-20 sm:px-6 lg:py-28">
      {/* Parallax accent orb behind the stack section */}
      <motion.div
        style={{ x: bgX }}
        className="pointer-events-none absolute -right-20 top-1/4 h-64 w-64 rounded-full bg-accent/10 blur-[100px]"
      />
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="What I use"
          title="A small set of tools I actually know my way around."
          description="I don’t collect logos. These are the ones that show up in my week."
        />

        {/* Scrolling icon marquee */}
        <div className="mb-8 overflow-hidden rounded-xl border border-ink/8 bg-surface/40 py-3 sm:mb-12 sm:rounded-2xl sm:py-4">
          <div className="marquee-track flex w-max gap-4 sm:gap-8">
            {[...items, ...items].map((item, i) => (
              <div
                key={`m-${item.id || item.name}-${i}`}
                className="flex shrink-0 items-center gap-2 rounded-lg border border-ink/8 bg-canvas/60 px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-accent/30 hover:text-ink sm:gap-2.5 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
              >
                <span style={{ color: item.accent }}><TechGlyph name={item.key} /></span>
                <span className="whitespace-nowrap text-ink/80">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-12">
          <StackGrid title="The basics" items={core} />
          <StackGrid title="Where I build" items={tools} columns="four" />
        </div>
      </div>
    </section>
  );
}

function StackGrid({
  title,
  items,
  columns = "three",
}: {
  title: string;
  items: StackItem[];
  columns?: "three" | "four";
}) {
  if (!items.length) return null;
  return (
    <div>
      <motion.p
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-gold"
      >
        {title}
      </motion.p>
      <div
        className={
          columns === "four"
            ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        }
      >
        {items.map((item) => (
          <GlowCard key={item.id || item.name}>
            <div
              className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-ink/10 bg-canvas"
              style={{ color: item.accent, boxShadow: `0 0 24px ${item.accent}22` }}
            >
              <TechGlyph name={item.key} />
            </div>
            <h3 className="font-display text-xl font-medium tracking-tight">{item.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.blurb}</p>
          </GlowCard>
        ))}
      </div>
    </div>
  );
}
