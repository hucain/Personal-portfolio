import { AnimatePresence, motion } from "framer-motion";
import { AtSign, Check, Clock3, Globe, Mail, MapPin, Phone, Send } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { fallbackContactInfo, watchContactInfo } from "../content";
import { openGmailContact, sendContactEmailJS } from "../emailjs";
import { sendContactMessage, type ContactMessage, type ContactInfoItem } from "../firebase";
import { canSendContactForm, recordContactSend } from "../security";
import { SectionHeading, fadeUp, stagger } from "./ui";

// Admin-managed contact info is stored in Firestore (contactInfo) and rendered here.
const contactIcons: Record<string, typeof Mail> = {
  Mail,
  MapPin,
  Clock3,
  Phone,
  Globe,
};

type FormState = {
  name: string;
  email: string;
  subject: string;
  type: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const initial: FormState = {
  name: "",
  email: "",
  subject: "",
  type: "A project",
  message: "",
};

const types = ["A project", "A collaboration", "An internship", "Just saying hi"];

function validate(values: FormState): FormErrors {
  const errors: FormErrors = {};
  if (values.name.trim().length < 2) errors.name = "I'd like to know who I'm writing back to.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "That email doesn't look quite right.";
  }
  if (values.subject.trim().length < 3) errors.subject = "A short subject helps me find this later.";
  if (values.message.trim().length < 10) {
    errors.message = "A couple of honest sentences is enough — just a bit more.";
  }
  return errors;
}

export function Contact() {
  const [values, setValues] = useState<FormState>(initial);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [saved, setSaved] = useState<ContactMessage | null>(null);
  const [contactItems, setContactItems] = useState<ContactInfoItem[]>(fallbackContactInfo);

  // Real-time admin-managed contact info (email, location, response time) from Firestore.
  useEffect(() => {
    return watchContactInfo(setContactItems);
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length > 0) return;

    // Rate limit: prevent spam submissions
    const { allowed, waitSeconds } = canSendContactForm();
    if (!allowed) {
      setSubmitError(`Please wait ${waitSeconds} seconds before sending another message.`);
      return;
    }

    setSending(true);
    try {
      const result = await sendContactMessage(values);
      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }
      setSaved(result.data);
      setSubmitted(true);
      recordContactSend();

      // Also try to send email notification
      // If EmailJS is configured → send silently in background
      // If not → open Gmail compose so admin sees it
      const emailSent = await sendContactEmailJS(values);
      if (!emailSent) {
        // EmailJS not configured — open Gmail so admin gets notified
        openGmailContact(values);
      }
    } catch {
      setSubmitError("Could not deliver your note right now. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="relative px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Contact"
          title="If you've got something in mind, write."
          description="Leave your name, email, subject, and a few sentences. It comes straight to me."
        />

        <div className="grid items-start gap-6 sm:gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="card-glow-border rounded-[1.8rem] border border-ink/10 bg-surface/80 p-6 backdrop-blur-sm sm:p-8"
          >
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="ok"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex min-h-[380px] flex-col justify-center"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                    <Check className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 font-display text-3xl font-medium">
                    Message sent successfully!
                  </h3>
                  <p className="mt-3 max-w-md text-muted">
                    Thank you for reaching out. I'll get back to you as soon as possible.
                  </p>
                  {saved ? (
                    <dl className="mt-5 space-y-2 text-sm">
                      <div>
                        <dt className="text-muted">Name</dt>
                        <dd className="font-medium">{saved.name}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Email</dt>
                        <dd className="font-medium">{saved.email}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Subject</dt>
                        <dd className="font-medium">{saved.subject}</dd>
                      </div>
                    </dl>
                  ) : null}
                  <div className="mt-7">
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setSaved(null);
                        setSubmitError("");
                        setValues(initial);
                      }}
                      className="inline-flex rounded-full border border-ink/12 px-5 py-2.5 text-sm font-semibold"
                    >
                      Send another message
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={onSubmit}
                  noValidate
                  className="space-y-5"
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Your name" error={errors.name} htmlFor="name">
                      <input
                        id="name"
                        value={values.name}
                        onChange={(event) => setValues((v) => ({ ...v, name: event.target.value }))}
                        className={`field ${errors.name ? "field-error" : ""}`}
                        placeholder="What should I call you?"
                        autoComplete="name"
                      />
                    </Field>
                    <Field label="Your email" error={errors.email} htmlFor="email">
                      <input
                        id="email"
                        type="email"
                        value={values.email}
                        onChange={(event) => setValues((v) => ({ ...v, email: event.target.value }))}
                        className={`field ${errors.email ? "field-error" : ""}`}
                        placeholder="you@there.com"
                        autoComplete="email"
                      />
                    </Field>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Subject" error={errors.subject} htmlFor="subject">
                      <input
                        id="subject"
                        value={values.subject}
                        onChange={(event) =>
                          setValues((v) => ({ ...v, subject: event.target.value }))
                        }
                        className={`field ${errors.subject ? "field-error" : ""}`}
                        placeholder="What's this about?"
                      />
                    </Field>
                    <Field label="This is" htmlFor="type">
                      <select
                        id="type"
                        value={values.type}
                        onChange={(event) => setValues((v) => ({ ...v, type: event.target.value }))}
                        className="field appearance-none"
                      >
                        {types.map((type) => (
                          <option key={type}>{type}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <Field label="A few sentences" error={errors.message} htmlFor="message">
                    <textarea
                      id="message"
                      rows={6}
                      value={values.message}
                      onChange={(event) =>
                        setValues((v) => ({ ...v, message: event.target.value }))
                      }
                      className={`field resize-y ${errors.message ? "field-error" : ""}`}
                      placeholder="Tell me what you're making, or just say hello."
                    />
                  </Field>
                  {submitError ? (
                    <p className="text-sm font-medium text-highlight" role="alert">
                      {submitError}
                    </p>
                  ) : null}
                  <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted">I usually write back within a day.</p>
                    <motion.button
                      type="submit"
                      disabled={sending}
                      whileHover={sending ? undefined : { y: -2, boxShadow: "0 0 28px rgba(212,180,131,0.3)" }}
                      whileTap={sending ? undefined : { scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      className="ripple-container inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-canvas shadow-[0_8px_24px_rgba(243,239,230,0.06)] transition-colors hover:bg-gold disabled:cursor-wait disabled:opacity-70"
                    >
                      {sending ? (
                        <span className="inline-flex items-center gap-1">
                          Sending
                          <span className="typing-dot inline-block h-1 w-1 rounded-full bg-current" />
                          <span className="typing-dot inline-block h-1 w-1 rounded-full bg-current" />
                          <span className="typing-dot inline-block h-1 w-1 rounded-full bg-current" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          Send it
                          <Send className="h-4 w-4" />
                        </span>
                      )}
                    </motion.button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.aside
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="space-y-3 sm:space-y-4"
          >
            {contactItems.map((item) => {
              const Icon = contactIcons[item.icon] || AtSign;
              return (
                <motion.div
                  key={item.id || item.label}
                  variants={fadeUp}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  whileHover={{ y: -3, scale: 1.01 }}
                  className="card-glow-border flex items-start gap-3 rounded-3xl border border-ink/10 bg-surface/70 px-5 py-4 backdrop-blur-sm transition-colors hover:border-accent/25"
                >
                  <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-canvas text-accent">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted sm:text-xs sm:tracking-[0.16em]">
                      {item.label}
                    </p>
                    <p className="mt-1 break-all text-sm font-medium sm:text-base">{item.value}</p>
                  </div>
                </motion.div>
              );
            })}

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.55, ease: "easeOut" }}
              whileHover={{ scale: 1.01 }}
              className="card-glow-border rounded-3xl border border-accent/20 bg-accent/8 p-6 backdrop-blur-sm transition-colors hover:border-accent/35"
            >
              <p className="font-display text-2xl font-medium leading-snug">
                Use the form. That's the best way to reach me.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Fill in your name, email, subject, and a short note. I'll get back within a day.
              </p>
            </motion.div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs font-medium text-highlight" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
