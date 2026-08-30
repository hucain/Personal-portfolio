export function TechGlyph({ name }: { name: string }) {
  const common = {
    viewBox: "0 0 32 32",
    className: "h-7 w-7",
    fill: "none",
    "aria-hidden": true,
  } as const;

  switch (name) {
    case "html":
      return (
        <svg {...common}>
          <path d="M6 4h20l-1.8 20.4L16 28l-8.2-3.6L6 4z" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10 11h12M11 17h10M12.2 23 16 24.4 19.8 23" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "css":
      return (
        <svg {...common}>
          <path d="M6 4h20l-1.8 20.4L16 28l-8.2-3.6L6 4z" stroke="currentColor" strokeWidth="1.6" />
          <path d="M11 12h10M12 18h6.5" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "js":
      return (
        <svg {...common}>
          <rect x="5" y="5" width="22" height="22" rx="5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M13 12v8.2c0 1.6-.8 2.4-2.2 2.4M19 16.2c.7-1 1.9-1.5 3-1 .9.4 1.2 1.3 1.2 2.2 0 2.2-3.4 2-3.4 4.2 0 .8.6 1.5 1.8 1.5 1.2 0 2-.5 2.6-1.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "react":
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="2.2" fill="currentColor" />
          <ellipse cx="16" cy="16" rx="11" ry="4.4" stroke="currentColor" strokeWidth="1.5" />
          <ellipse cx="16" cy="16" rx="11" ry="4.4" transform="rotate(60 16 16)" stroke="currentColor" strokeWidth="1.5" />
          <ellipse cx="16" cy="16" rx="11" ry="4.4" transform="rotate(120 16 16)" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "angular":
      return (
        <svg {...common}>
          <path d="M16 4 6 8.2l1.6 14.2L16 28l8.4-5.6L26 8.2 16 4z" stroke="currentColor" strokeWidth="1.6" />
          <path d="m12 19 4-10 4 10M13.4 16h5.2" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "vue":
      return (
        <svg {...common}>
          <path d="M4 7h6.2L16 17.4 21.8 7H28L16 28 4 7z" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10.8 7 16 16.2 21.2 7" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "ts":
      return (
        <svg {...common}>
          <rect x="5" y="5" width="22" height="22" rx="5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M9 14h8M13 14v8M18 17.2c.6-.8 1.6-1.2 2.6-.9.8.3 1.2 1 1.2 1.8 0 1.8-2.8 1.7-2.8 3.5 0 .7.6 1.3 1.6 1.3 1.1 0 1.9-.5 2.4-1.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    default:
      // Custom icon — render the key as stylized text (e.g. "PY", "RB", "GO")
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.2" opacity={0.3} />
          <text
            x="16"
            y="17"
            textAnchor="middle"
            dominantBaseline="central"
            fill="currentColor"
            fontSize={name.length > 2 ? "10" : "12"}
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
          >
            {name.slice(0, 3).toUpperCase()}
          </text>
        </svg>
      );
  }
}
