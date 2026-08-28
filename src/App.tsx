import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminApp, useAdminRoute } from "./admin/AdminApp";
import { About } from "./components/About";
import { Background } from "./components/Background";
import { Certificates } from "./components/Certificates";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Projects } from "./components/Projects";
import { Resume } from "./components/Resume";
import { TechStack } from "./components/TechStack";
import { Work } from "./components/Work";

function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{ duration: 0.25 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="back-to-top"
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5 text-accent" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  const admin = useAdminRoute();
  const [resumeOpen, setResumeOpen] = useState(false);

  if (admin) return <AdminApp />;

  return (
    <div className="relative min-h-screen bg-canvas font-sans text-ink">
      <Background />
      <a
        href="#top"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-canvas"
      >
        Skip to content
      </a>
      <div className="relative z-10">
        <Header />
        <main>
          <Hero onResume={() => setResumeOpen(true)} />
          <div className="section-divider mx-auto max-w-6xl" />
          <div className="section-alt">
            <About />
          </div>
          <div className="section-divider mx-auto max-w-6xl" />
          <TechStack />
          <div className="section-divider mx-auto max-w-6xl" />
          <div className="section-alt">
            <Work />
          </div>
          <div className="section-divider mx-auto max-w-6xl" />
          <Projects />
          <div className="section-divider mx-auto max-w-6xl" />
          <div className="section-alt">
            <Certificates />
          </div>
          <div className="section-divider mx-auto max-w-6xl" />
          <Contact />
        </main>
        <Footer />
      </div>
      <Resume open={resumeOpen} onClose={() => setResumeOpen(false)} />
      <BackToTop />
    </div>
  );
}
