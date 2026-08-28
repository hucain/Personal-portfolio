import { AnimatePresence, motion, type HTMLMotionProps } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../utils/cn";

// --------------------------------------------------------------------------
// Toast System
// --------------------------------------------------------------------------

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
};

let toastId = 0;

const ToastContext = createContext<{
  toast: (message: string, variant?: ToastVariant) => void;
}>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = ++toastId;
    setItems((prev) => [...prev, { id, message, variant }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[200] flex flex-col-reverse gap-3">
        <AnimatePresence>
          {items.map((item) => (
            <Toast key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const colors: Record<ToastVariant, string> = {
    success: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
    error: "border-highlight/30 bg-highlight/15 text-highlight",
    info: "border-gold/30 bg-gold/15 text-gold",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className={cn(
        "pointer-events-auto flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-2xl backdrop-blur-xl",
        "bg-surface/95",
        colors[item.variant],
      )}
    >
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      <span className="text-xs font-semibold">{item.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-2 shrink-0 rounded-full p-0.5 hover:bg-white/10"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

export const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0 },
};

export const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.06 },
  },
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      className={cn("mb-12 max-w-2xl", align === "center" && "mx-auto text-center")}
    >
      <motion.p
        variants={fadeUp}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="eyebrow-dot mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold"
      >
        {eyebrow}
      </motion.p>
      <motion.h2
        variants={fadeUp}
        transition={{ duration: 0.65, ease: "easeOut" }}
        className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl lg:text-[2.75rem] lg:leading-tight"
      >
        {title}
      </motion.h2>
      <motion.div
        variants={fadeUp}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mt-4 flex items-center gap-3"
      >
        <div className="h-px w-12 bg-gradient-to-r from-accent to-transparent" />
      </motion.div>
      {description ? (
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-4 text-base leading-relaxed text-muted sm:text-lg"
        >
          {description}
        </motion.p>
      ) : null}
    </motion.div>
  );
}

export function GlowCard({
  children,
  className,
  ...props
}: HTMLMotionProps<"div"> & { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={fadeUp}
      transition={{ duration: 0.55, ease: "easeOut" }}
      whileHover={{ y: -5 }}
      onMouseMove={(event) => {
        const node = ref.current;
        const inner = innerRef.current;
        if (!node || !inner) return;
        const rect = node.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        node.style.setProperty("--x", `${x}px`);
        node.style.setProperty("--y", `${y}px`);
        // 3D tilt: map mouse position to rotateX/Y
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateY = ((x - centerX) / centerX) * 6;
        const rotateX = ((centerY - y) / centerY) * 6;
        inner.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`;
      }}
      onMouseLeave={() => {
        const inner = innerRef.current;
        if (inner) inner.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
      }}
      className={cn(
        "card-glow-border card-inner-glow group relative overflow-hidden rounded-3xl border border-ink/10 bg-surface/80 p-6 backdrop-blur-sm",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-3xl before:opacity-0 before:transition-opacity before:duration-500",
        "before:bg-[radial-gradient(420px_circle_at_var(--x,50%)_var(--y,0%),rgba(155,135,255,0.16),transparent_52%)]",
        "hover:border-accent/40 hover:before:opacity-100",
        className,
      )}
      {...props}
    >
      <div ref={innerRef} className="transition-transform duration-150 ease-out" style={{ transformStyle: "preserve-3d" }}>
        {children}
      </div>
    </motion.div>
  );
}

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-ink/10 bg-void-soft/80 px-3.5 py-1.5 text-xs font-medium tracking-wide text-ink/90",
        className,
      )}
    >
      {children}
    </span>
  );
}
