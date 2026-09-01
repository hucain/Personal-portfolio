/**
 * Embedded logo as inline SVG data URIs.
 * These are compiled into the JS bundle — they NEVER disappear
 * regardless of deployment path (GitHub Pages, Firebase, subdirectory, etc.)
 */

const SVG_LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#c8b8ff"/>
      <stop offset="50%" stop-color="#9b87ff"/>
      <stop offset="100%" stop-color="#e08b7a"/>
    </linearGradient>
    <radialGradient id="glow" cx="60" cy="60" r="56" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="rgba(155,135,255,0.25)"/>
      <stop offset="100%" stop-color="rgba(155,135,255,0)"/>
    </radialGradient>
  </defs>
  <circle cx="60" cy="60" r="56" fill="#1a1726" stroke="url(#g)" stroke-width="2.5"/>
  <circle cx="60" cy="60" r="50" fill="url(#glow)"/>
  <text x="60" y="70" text-anchor="middle" font-family="Georgia,serif" font-size="38" font-weight="700" fill="url(#g)">HU</text>
  <circle cx="60" cy="60" r="56" fill="none" stroke="url(#g)" stroke-width="1" opacity="0.3"/>
</svg>`;

const SVG_LOGO_SMALL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#c8b8ff"/>
      <stop offset="50%" stop-color="#9b87ff"/>
      <stop offset="100%" stop-color="#e08b7a"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="56" fill="#1a1726" stroke="url(#g)" stroke-width="2.5"/>
  <text x="60" y="70" text-anchor="middle" font-family="Georgia,serif" font-size="38" font-weight="700" fill="url(#g)">HU</text>
</svg>`;

/** Data URI for the full logo with glow — used in navbar and footer */
export const LOGO_URI = `data:image/svg+xml,${encodeURIComponent(SVG_LOGO)}`;

/** Data URI for the compact logo — used in admin panels */
export const LOGO_SMALL_URI = `data:image/svg+xml,${encodeURIComponent(SVG_LOGO_SMALL)}`;

/** Favicon as data URI — embedded in index.html <link> */
export const FAVICON_URI = `data:image/svg+xml,${encodeURIComponent(SVG_LOGO_SMALL)}`;
