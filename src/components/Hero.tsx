import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDownRight, ArrowDown, FileText, MapPin, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { profile, stats } from "../data";
import { Badge, fadeUp, stagger } from "./ui";

function Typewriter({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) return;
    const timer = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1));
    }, 55);
    return () => clearTimeout(timer);
  }, [displayed, started, text]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && started && (
        <span className="cursor-blink" />
      )}
    </span>
  );
}

function CountUp({
  target,
  duration = 1.8,
  suffix = "",
}: {
  target: number;
  duration?: number;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const elapsed = (now - start) / (duration * 1000);
            if (elapsed >= 1) {
              setCount(target);
              return;
            }
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - elapsed, 3);
            setCount(Math.round(target * eased));
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

function MagneticButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof motion.button> & { children: React.ReactNode }) {
  return (
    <motion.button
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`pulse-ring ${className ?? ""}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

function MagneticLink({
  children,
  className,
  ...props
}: React.ComponentProps<typeof motion.a> & { children: React.ReactNode }) {
  return (
    <motion.a
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`pulse-ring ${className ?? ""}`}
      {...props}
    >
      {children}
    </motion.a>
  );
}

export function Hero({ onResume }: { onResume: () => void }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.7], [1, 0.96]);

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative overflow-hidden px-4 pb-16 pt-16 sm:px-6 lg:pb-24 lg:pt-24"
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
          className="max-w-3xl"
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.55 }}>
            <Badge className="border-accent/20 bg-accent/8 backdrop-blur-sm">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-highlight" />
              <span className="text-ink/80">Around, and taking on work</span>
            </Badge>
          </motion.div>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.55 }}
            className="mt-8 text-sm font-semibold uppercase tracking-[0.28em] text-gold"
          >
            <Typewriter text={profile.role} delay={400} />
          </motion.p>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.7 }}
            className="mt-4 font-display text-[2rem] font-medium leading-[1.02] tracking-tight sm:text-[2.7rem] sm:leading-[1.02] md:text-6xl lg:text-7xl"
          >
            <span className="text-gradient-animated name-glow">{profile.name}</span>
          </motion.h1>

          {/* Hero accent glow line */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hero-glow-line mt-5 max-w-xs"
          />

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.65 }}
            className="mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-[1.15rem]"
          >
            I spend most days shaping websites that feel calm, look finished, and don&apos;t
            fight the person using them. I work from Lahore. One year in, and I&apos;m still
            oddly picky about spacing.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-7 flex flex-wrap items-center gap-3"
          >
            <Badge className="border-accent/25 bg-accent/10 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              {profile.experienceLabel}
            </Badge>
            <Badge className="backdrop-blur-sm">
              <MapPin className="h-3.5 w-3.5 text-highlight" aria-hidden="true" />
              {profile.location}
            </Badge>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-3 sm:gap-4">
            <MagneticLink
              href="#contact"
              className="btn-glow inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-canvas transition hover:bg-gold sm:px-6 sm:py-3"
            >
              Say hello
            </MagneticLink>
            <MagneticButton
              type="button"
              onClick={onResume}
              className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/10 px-4 py-2.5 text-sm font-semibold text-ink backdrop-blur-sm transition hover:bg-gold/20 sm:px-6 sm:py-3"
            >
              <FileText className="h-4 w-4 text-gold" />
              Resume
            </MagneticButton>
            <MagneticLink
              href="#project"
              className="inline-flex items-center gap-2 rounded-full border border-ink/12 bg-void-soft/80 px-4 py-2.5 text-sm font-semibold text-ink backdrop-blur-sm transition hover:border-accent/25 sm:px-6 sm:py-3"
            >
              What&apos;s on the desk
              <ArrowDownRight className="h-4 w-4" />
            </MagneticLink>
          </motion.div>
        </motion.div>

        <div className="mt-14 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {stats.map((stat, index) => {
            const numericPart = parseInt(stat.value.replace(/[^0-9]/g, ""));
            const suffix = stat.value.replace(/[0-9]/g, "");
            const isNumeric = !isNaN(numericPart);

            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 22, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.55,
                  delay: 0.28 + index * 0.1,
                  ease: "easeOut",
                }}
                className="card-glow-border stat-accent rounded-3xl border border-ink/10 bg-surface/70 px-5 py-5 backdrop-blur-sm transition-all hover:border-accent/30 hover:bg-surface/90"
              >
                <p className="font-display text-4xl font-medium text-gold">
                  {isNumeric ? (
                    <CountUp target={numericPart} suffix={suffix} />
                  ) : (
                    stat.value
                  )}
                </p>
                <p className="mt-2 text-sm font-medium">{stat.label}</p>
                <p className="mt-1 text-xs text-muted">{stat.detail}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Scroll-down indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.8 }}
        className="mt-12 flex justify-center"
      >
        <a
          href="#about"
          className="bounce-down flex flex-col items-center gap-2 text-muted transition hover:text-gold"
        >
          <span className="text-[10px] uppercase tracking-[0.24em]">Scroll</span>
          <ArrowDown className="h-4 w-4" />
        </a>
      </motion.div>
    </section>
  );
}
