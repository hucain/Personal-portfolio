import { motion } from "framer-motion";
import { profile } from "../data";

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative px-4 py-8 sm:px-6"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 text-sm text-muted sm:flex-row sm:items-center">
        <a href="#top" className="transition-transform hover:scale-105">
          <img
            src="/logo.png"
            alt="HU logo"
            className="h-8 w-8 rounded-lg object-contain"
            width={32}
            height={32}
          />
        </a>
        <p>
          {profile.name} · {profile.location}
        </p>
        <p>© {new Date().getFullYear()}. Made slowly, on purpose.</p>
      </div>
    </motion.footer>
  );
}
