import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ToastProvider } from "./components/ui";
import { initSecurity } from "./security";
import { initScrollBackground } from "./scrollBackground";

// Initialize client-side security layer (console warning, obfuscation)
initSecurity();

// Initialize scroll-driven background frame animation
initScrollBackground();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>
);
