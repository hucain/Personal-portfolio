/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Optional ReCAPTCHA v3 **site key** for Firebase App Check.
   * This is public client configuration (the reCAPTCHA secret stays server-side).
   * When unset, App Check is not initialized and stays OFF in the rules toggle.
   */
  readonly VITE_RECAPTCHA_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
