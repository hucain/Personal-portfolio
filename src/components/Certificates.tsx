import { motion } from "framer-motion";
import { Award, ExternalLink, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { fallbackCertificates, watchCertificates } from "../content";
import { safeExternalUrl, type CertificateItem } from "../firebase";
import { SectionHeading } from "./ui";

export function Certificates() {
  const [items, setItems] = useState<CertificateItem[]>(fallbackCertificates);

  useEffect(() => {
    return watchCertificates(setItems);
  }, []);

  return (
    <section id="certificate" className="relative px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Certificates"
          title="Proof of the work I put in."
          description="Credentials from the courses, programs, and exams I've completed. Each one has a year and, where I can, a link to verify it."
        />

        {items.length === 0 ? (
          <motion.article
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card-glow-border relative overflow-hidden rounded-[1.8rem] border border-ink/10 bg-surface/80 p-8 text-center backdrop-blur-sm sm:p-10"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10 text-gold sm:h-14 sm:w-14">
              <Award className="h-5 w-5 sm:h-6 sm:w-6" />
            </span>
            <h3 className="mt-5 font-display text-2xl font-medium sm:text-3xl">Credentials are on the way</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
              I'll list my completed certificates here as they're issued. Right
              now I'm still finishing the work to earn them.
            </p>
          </motion.article>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 26, clipPath: "inset(8px round 1.6rem)" }}
                whileInView={{ opacity: 1, y: 0, clipPath: "inset(0px round 1.6rem)" }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6, scale: 1.01 }}
                className="card-glow-border card-inner-glow group relative flex flex-col justify-between overflow-hidden rounded-[1.6rem] border border-ink/10 bg-surface/80 p-6 backdrop-blur-sm transition-colors hover:border-gold/30"
              >
                {/* Shine sweep on hover */}
                <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10 text-gold">
                      <Award className="h-5 w-5" />
                    </span>
                    <span className="rounded-full border border-ink/10 bg-canvas/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                      {item.year || "Completed"}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-xl font-medium leading-snug">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted">{item.issuer}</p>
                  {item.credentialId ? (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-ink/50">
                      <ShieldCheck className="h-3.5 w-3.5 text-highlight" />
                      ID: {item.credentialId}
                    </p>
                  ) : null}
                </div>

                {safeExternalUrl(item.href) ? (
                  <a
                    href={safeExternalUrl(item.href)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-ink transition group-hover:text-gold"
                  >
                    Verify credential
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : item.href ? (
                  <span className="mt-5 inline-flex items-center gap-1.5 text-xs text-highlight">
                    Unsafe or malformed link hidden
                  </span>
                ) : (
                  <span className="mt-5 text-xs text-muted/50">Verification link pending</span>
                )}
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
