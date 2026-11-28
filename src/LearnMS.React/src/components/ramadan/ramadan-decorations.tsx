import { useRamadanDecorations } from "@/api/ramadan-api";
import type { CSSProperties } from "react";

const LANTERNS = [
  { id: 0, left: "6%", length: 28, delay: "0s" },
  { id: 1, left: "18%", length: 48, delay: "0.35s" },
  { id: 2, left: "32%", length: 34, delay: "0.15s" },
  { id: 3, left: "46%", length: 56, delay: "0.6s" },
  { id: 4, left: "60%", length: 30, delay: "0.2s" },
  { id: 5, left: "74%", length: 50, delay: "0.45s" },
  { id: 6, left: "88%", length: 36, delay: "0.1s" },
];

const STARS = Array.from({ length: 22 }, (_, index) => ({
  id: index,
  left: `${(index * 29) % 100}%`,
  delay: `${(index * 0.47) % 10}s`,
  duration: `${12 + (index % 7)}s`,
  size: index % 4 === 0 ? 16 : 8 + (index % 3) * 3,
  drift: `${(index % 2 === 0 ? 1 : -1) * (10 + (index % 16))}px`,
  rest: `${8 + ((index * 19) % 74)}%`,
  crescent: index % 5 === 0,
}));

function Fanous() {
  return (
    <svg className="ramadan-fanous-svg" viewBox="0 0 36 48" fill="none" aria-hidden>
      <path d="M18 2 L22 8 H14 Z" fill="#b45309" />
      <path d="M8 14 Q18 6 28 14 L30 30 Q18 40 6 30 Z" fill="#f59e0b" />
      <path d="M12 16 Q18 12 24 16 L25 28 Q18 34 11 28 Z" fill="#fde68a" />
      <circle cx="18" cy="22" r="2.4" fill="#047857" />
      <path d="M14 38 H22 L20 46 H16 Z" fill="#b45309" />
    </svg>
  );
}

function CrescentMark() {
  return (
    <svg className="ramadan-crescent" viewBox="0 0 120 120" fill="none" aria-hidden>
      <path
        d="M78 14a46 46 0 1 0 18 78 36 36 0 1 1-18-78Z"
        fill="#fbbf24"
      />
      <polygon
        points="92,18 95,28 106,28 97,34 100,44 92,38 84,44 87,34 78,28 89,28"
        fill="#fde68a"
      />
    </svg>
  );
}

export function RamadanDecorations() {
  const { data } = useRamadanDecorations();
  if (!data?.enabled) return null;

  return (
    <div className="ramadan-overlay" aria-hidden="true">
      <div className="ramadan-lanterns">
        {LANTERNS.map((lantern) => (
          <span
            key={lantern.id}
            className="ramadan-lantern"
            style={{ left: lantern.left, animationDelay: lantern.delay }}
          >
            <span className="ramadan-lantern-string" style={{ height: lantern.length }} />
            <Fanous />
          </span>
        ))}
      </div>

      <div className="ramadan-sky">
        {STARS.map((star) => (
          <span
            key={star.id}
            className={star.crescent ? "ramadan-star ramadan-star-crescent" : "ramadan-star"}
            style={
              {
                left: star.left,
                fontSize: star.size,
                animationDelay: star.delay,
                animationDuration: star.duration,
                "--drift": star.drift,
                "--rest": star.rest,
              } as CSSProperties
            }
          >
            {star.crescent ? "☽" : "✦"}
          </span>
        ))}
      </div>

      <CrescentMark />
    </div>
  );
}
