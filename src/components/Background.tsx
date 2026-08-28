import { useEffect, useRef } from "react";

export function Background() {
  const layerRef = useRef<HTMLDivElement>(null);
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);
  const auroraRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Mouse spotlight
    const onMove = (event: MouseEvent) => {
      layer.style.setProperty("--mx", `${event.clientX}px`);
      layer.style.setProperty("--my", `${event.clientY}px`);
    };

    // Scroll-responsive parallax
    const onScroll = () => {
      const y = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? y / maxScroll : 0;

      // Parallax blobs move at different speeds
      if (blob1Ref.current) {
        blob1Ref.current.style.transform = `translateY(${y * 0.08}px) scale(${1 + progress * 0.15})`;
      }
      if (blob2Ref.current) {
        blob2Ref.current.style.transform = `translateY(${y * -0.05}px) translateX(${Math.sin(progress * Math.PI) * 30}px) scale(${1 + progress * 0.1})`;
      }
      if (blob3Ref.current) {
        blob3Ref.current.style.transform = `translateY(${y * 0.12}px) scale(${1 - progress * 0.2})`;
      }

      // Aurora gradient shifts with scroll
      if (auroraRef.current) {
        auroraRef.current.style.background = `linear-gradient(
          ${120 + progress * 60}deg,
          rgba(155, 135, 255, ${0.04 + progress * 0.06}) 0%,
          rgba(224, 139, 122, ${0.02 + progress * 0.04}) 35%,
          rgba(212, 180, 131, ${0.03 + progress * 0.03}) 65%,
          transparent 100%
        )`;
        auroraRef.current.style.opacity = `${0.3 + progress * 0.5}`;
      }

      // Particles move faster when scrolling
      if (particlesRef.current) {
        const speed = 1 + progress * 2;
        particlesRef.current.style.animationDuration = `${20 / speed}s`;
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div ref={layerRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-canvas" />
      <div ref={blob1Ref} className="absolute -left-28 top-0 will-change-transform">
        <div className="blob-a h-80 w-80 rounded-full bg-accent/25 blur-[120px]" />
      </div>
      <div ref={blob2Ref} className="absolute right-[-70px] top-32 will-change-transform">
        <div className="blob-b h-96 w-96 rounded-full bg-highlight/18 blur-[130px]" />
      </div>
      <div ref={blob3Ref} className="absolute bottom-8 left-1/3 will-change-transform">
        <div className="blob-a h-72 w-72 rounded-full bg-gold/10 blur-[110px]" />
      </div>
      <div ref={auroraRef} className="absolute inset-0 pointer-events-none scroll-aurora" />
      <div className="absolute inset-0 grid-mesh" />
      <div className="absolute inset-0 spotlight" />
      {/* Floating particles with scroll-reactive speed */}
      <div ref={particlesRef} className="absolute inset-0 particle-layer">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-accent/30"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              left: `${8 + i * 12}%`,
              bottom: `-${i * 4}%`,
              animation: `float-particle ${12 + i * 3}s linear infinite`,
              animationDelay: `${i * 2.5}s`,
            }}
          />
        ))}
      </div>
      <div className="absolute inset-0 noise" />
    </div>
  );
}
