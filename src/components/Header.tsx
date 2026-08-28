import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Mail, Menu, X } from "lucide-react";
import { useEffect, useState, type MouseEvent } from "react";
import { grantAdminAccess } from "../admin/AdminApp";
import { navLinks } from "../data";

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("top");
  const [secretCount, setSecretCount] = useState(0);
  const { scrollY, scrollYProgress } = useScroll();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.altKey && e.shiftKey && e.key.toLowerCase() === "a") || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "l")) {
        grantAdminAccess();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 12);
  });

  useEffect(() => {
    const ids = ["top", "about", "stack", "work", "project", "certificate", "contact"];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-28% 0px -58% 0px", threshold: [0.15, 0.4, 0.7] },
    );

    ids.forEach((id) => {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, []);

  const goTo = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    const id = href.replace("#", "") || "top";
    setOpen(false);
    setActive(id);

    const move = () => {
      const target = document.getElementById(id);
      if (!target) return;
      const offset = 72;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      window.history.pushState(null, "", `#${id}`);
    };

    window.setTimeout(move, 30);
  };

  return (
    <header className="sticky top-0 z-50">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`border-b transition-colors duration-500 ${
          scrolled ? "glass border-ink/10" : "border-transparent bg-canvas/40"
        }`}
      >
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6">
          <a
            href="#top"
            onClick={(event) => {
              const next = secretCount + 1;
              if (next >= 5) {
                event.preventDefault();
                setSecretCount(0);
                grantAdminAccess();
                return;
              }
              setSecretCount(next);
              setTimeout(() => setSecretCount(0), 1600);
              goTo(event, "#top");
            }}
            title="HU."
            className="select-none transition-transform active:scale-95"
            aria-label="Back to top"
          >
            <img
              src="/logo.png"
              alt="HU logo"
              className="h-10 w-10 rounded-xl object-contain"
              width={40}
              height={40}
              loading="eager"
            />
          </a>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {navLinks.map((link) => {
              const id = link.href.slice(1);
              const isActive = active === id;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(event) => goTo(event, link.href)}
                  className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive ? "text-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  {link.label}
                  {isActive ? (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-ink/6 ring-1 ring-ink/10"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  ) : null}
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="#contact"
              onClick={(event) => goTo(event, "#contact")}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-3 py-2 text-sm font-semibold text-canvas transition hover:bg-gold sm:px-4"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              <span>Contact Me</span>
            </a>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-void-soft text-ink md:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <motion.div
          className="h-[2px] origin-left bg-gradient-to-r from-accent via-gold to-highlight"
          style={{ scaleX: scrollYProgress }}
        />
      </motion.div>

      <AnimatePresence>
        {open ? (
          <motion.nav
            id="mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b border-ink/10 bg-canvas md:hidden"
            aria-label="Mobile"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {navLinks.map((link, index) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={(event) => goTo(event, link.href)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * index }}
                  className={`rounded-2xl px-3 py-3 font-display text-2xl ${
                    active === link.href.slice(1) ? "text-gold" : "text-ink"
                  }`}
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.a
                href="#contact"
                onClick={(event) => goTo(event, "#contact")}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3 text-base font-semibold text-canvas"
              >
                <Mail className="h-4 w-4" />
                Contact Me
              </motion.a>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
