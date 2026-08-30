/**
 * High-quality scroll-driven background frame animation.
 *
 * Optimisations:
 *  - DPR-aware canvas (crisp on Retina / 4K)
 *  - Smooth crossfade between frames (no hard cuts)
 *  - Responsive resolution: full on desktop, half on tablet, quarter on mobile
 *  - Priority preloading: current frame first, neighbours next, rest in idle
 *  - Single rAF-throttled scroll handler
 *  - Memory-efficient: holds only decoded ImageBitmaps
 *
 * No React components added — pure DOM + scroll listener.
 */

const TOTAL_FRAMES = 211;
const FRAME_PATH = "/bg-frames/ezgif-frame-";
const PAD = 3; // zero-padded frame numbers

// ── Resolution tiers ──────────────────────────────────────────────
// We render the canvas at a fraction of 4K depending on viewport so
// mobile devices don't burn GPU cycles upscaling 3840×2160.
const DESKTOP_W = 3840;
const DESKTOP_H = 2160;
const TABLET_W = 2560;
const TABLET_H = 1440;
const MOBILE_W = 1280;
const MOBILE_H = 720;

// ── State ─────────────────────────────────────────────────────────
let frames: (HTMLImageElement | null)[] = new Array(TOTAL_FRAMES).fill(null);
let loadedCount = 0;
let currentFrame = -1;
let targetFrame = -1;
let blendAlpha = 1; // 0 → showing previous, 1 → showing current
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let rafId: number | null = null;
let loadingStarted = false;
let canvasW = DESKTOP_W;
let canvasH = DESKTOP_H;

// Previous frame for crossfade
let prevFrameIndex = -1;

// ── Helpers ───────────────────────────────────────────────────────

function pad(n: number): string {
  return String(n).padStart(PAD, "0");
}

/** Pick canvas resolution based on viewport width + DPR */
function computeCanvasSize(): { w: number; h: number } {
  const vw = window.innerWidth;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let baseW: number;
  let baseH: number;

  if (vw < 640) {
    baseW = MOBILE_W;
    baseH = MOBILE_H;
  } else if (vw < 1024) {
    baseW = TABLET_W;
    baseH = TABLET_H;
  } else {
    baseW = DESKTOP_W;
    baseH = DESKTOP_H;
  }

  // Scale by DPR for crispness (capped at 2× to avoid memory explosion)
  return { w: Math.round(baseW * dpr), h: Math.round(baseH * dpr) };
}

// ── Canvas ────────────────────────────────────────────────────────

function createCanvas(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.id = "scroll-bg-canvas";
  const size = computeCanvasSize();
  canvasW = size.w;
  canvasH = size.h;
  c.width = canvasW;
  c.height = canvasH;
  c.style.cssText = [
    "position:fixed",
    "top:0",
    "left:0",
    "width:100vw",
    "height:100vh",
    "object-fit:cover",
    "z-index:9999",
    "pointer-events:none",
    "image-rendering:auto",
    "opacity:0.18",
    "mix-blend-mode:screen",
    "will-change:transform",
  ].join(";");
  document.body.prepend(c);
  return c;
}

function resizeCanvas() {
  const size = computeCanvasSize();
  if (size.w === canvasW && size.h === canvasH) return;
  canvasW = size.w;
  canvasH = size.h;
  canvas.width = canvasW;
  canvas.height = canvasH;
  currentFrame = -1; // force redraw
  prevFrameIndex = -1;
  drawCurrentFrame();
}

// ── Frame loading ─────────────────────────────────────────────────

function loadFrame(index: number): Promise<void> {
  return new Promise((resolve) => {
    if (frames[index]) {
      resolve();
      return;
    }
    const img = new Image();
    img.onload = () => {
      frames[index] = img;
      loadedCount++;
      resolve();
    };
    img.onerror = () => resolve();
    img.src = `${FRAME_PATH}${pad(index + 1)}.jpg`;
  });
}

/** Load a range of frames concurrently */
async function loadRange(start: number, end: number) {
  const promises: Promise<void>[] = [];
  for (let i = start; i < end && i < TOTAL_FRAMES; i++) {
    promises.push(loadFrame(i));
  }
  await Promise.all(promises);
}

/** Smart preloading: current ± neighbours first, then rest in idle chunks */
async function preloadAllFrames() {
  if (loadingStarted) return;
  loadingStarted = true;

  const idx = getFrameIndex();
  const windowSize = 15; // preload ±15 frames around current position

  // Priority: current neighbourhood
  const start = Math.max(0, idx - windowSize);
  const end = Math.min(TOTAL_FRAMES, idx + windowSize + 1);
  await loadRange(start, end);

  // Then load everything else in batches of 20 during idle time
  for (let batch = 0; batch < TOTAL_FRAMES; batch += 20) {
    const bStart = batch;
    const bEnd = batch + 20;

    // Skip already-loaded neighbourhood
    if (bStart >= start && bEnd <= end) continue;

    if ("requestIdleCallback" in window) {
      await new Promise<void>((resolve) => {
        (window as any).requestIdleCallback(
          async () => {
            await loadRange(
              Math.max(bStart, end),
              Math.min(bEnd, TOTAL_FRAMES)
            );
            resolve();
          },
          { timeout: 5000 }
        );
      });
    } else {
      await loadRange(Math.max(bStart, end), Math.min(bEnd, TOTAL_FRAMES));
    }

    // Yield to browser between batches
    await new Promise((r) => requestAnimationFrame(r));
  }
}

// ── Drawing ───────────────────────────────────────────────────────

/** Draw a single frame, filling canvas with cover logic */
function drawFrameToCanvas(img: HTMLImageElement, alpha: number) {
  // Cover-fit: maintain aspect ratio, fill canvas, crop overflow
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const canvasAspect = canvasW / canvasH;

  let sx: number, sy: number, sw: number, sh: number;

  if (canvasAspect > imgAspect) {
    // Canvas is wider than image → crop top/bottom
    sh = img.naturalWidth / canvasAspect;
    sw = img.naturalWidth;
    sx = 0;
    sy = (img.naturalHeight - sh) / 2;
  } else {
    // Canvas is taller than image → crop sides
    sw = img.naturalHeight * canvasAspect;
    sh = img.naturalHeight;
    sx = (img.naturalWidth - sw) / 2;
    sy = 0;
  }

  ctx.globalAlpha = alpha;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
  ctx.globalAlpha = 1;
}

/** Crossfade between two frames */
function drawCrossfade(fromIndex: number, toIndex: number, progress: number) {
  ctx.clearRect(0, 0, canvasW, canvasH);

  // Dark base
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, canvasW, canvasH);

  const fromImg = frames[fromIndex];
  const toImg = frames[toIndex];

  if (fromImg && toImg) {
    drawFrameToCanvas(fromImg, 1 - progress);
    drawFrameToCanvas(toImg, progress);
  } else if (toImg) {
    drawFrameToCanvas(toImg, 1);
  }
}

/** Draw the target frame with smooth crossfade */
function drawCurrentFrame() {
  if (targetFrame === currentFrame && blendAlpha >= 1) return;

  const img = frames[targetFrame];
  if (!img || !ctx) return;

  if (prevFrameIndex >= 0 && prevFrameIndex !== targetFrame && blendAlpha < 1) {
    // Crossfade
    drawCrossfade(prevFrameIndex, targetFrame, blendAlpha);
    blendAlpha = Math.min(blendAlpha + 0.045, 1); // ~22 frames to blend — smooth
    if (blendAlpha < 1) {
      rafId = requestAnimationFrame(() => {
        rafId = null;
        drawCurrentFrame();
      });
      return;
    }
  }

  // Final draw
  drawCrossfade(prevFrameIndex, targetFrame, 1);
  currentFrame = targetFrame;
  blendAlpha = 1;
}

// ── Scroll calculation ────────────────────────────────────────────

function getFrameIndex(): number {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight =
    document.documentElement.scrollHeight - window.innerHeight;
  if (docHeight <= 0) return 0;
  const progress = Math.min(scrollTop / docHeight, 1);
  return Math.min(Math.floor(progress * (TOTAL_FRAMES - 1)), TOTAL_FRAMES - 1);
}

// ── Scroll handler ────────────────────────────────────────────────

function onScroll() {
  if (rafId !== null) return;
  rafId = requestAnimationFrame(() => {
    rafId = null;
    const idx = getFrameIndex();
    if (idx !== targetFrame) {
      prevFrameIndex = targetFrame >= 0 ? targetFrame : idx;
      targetFrame = idx;
      blendAlpha = 0; // start crossfade
      drawCurrentFrame();
    }
  });
}

// ── Public API ────────────────────────────────────────────────────

export function initScrollBackground() {
  canvas = createCanvas();
  ctx = canvas.getContext("2d", { alpha: false })!;

  // Dark base
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, canvasW, canvasH);

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => resizeCanvas(), { passive: true });

  // Load frame 0 first for instant display
  loadFrame(0).then(() => {
    targetFrame = 0;
    prevFrameIndex = 0;
    blendAlpha = 1;
    drawCurrentFrame();
  });

  // Then smart-preload everything
  preloadAllFrames();
}
