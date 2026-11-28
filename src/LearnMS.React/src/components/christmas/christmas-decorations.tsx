import { useChristmasDecorations } from "@/api/christmas-api";
import type { CSSProperties } from "react";

const BULB_COLORS = ["#ef4444", "#facc15", "#22c55e", "#38bdf8", "#fb923c", "#e879f9"];

const BULBS = Array.from({ length: 22 }, (_, index) => ({
  id: index,
  color: BULB_COLORS[index % BULB_COLORS.length],
  delay: `${(index % 6) * 0.22}s`,
}));

const ORNAMENTS = [
  { id: 0, left: "8%", length: 46, color: "#ef4444", delay: "0s" },
  { id: 1, left: "22%", length: 68, color: "#facc15", delay: "0.4s" },
  { id: 2, left: "41%", length: 52, color: "#38bdf8", delay: "0.15s" },
  { id: 3, left: "58%", length: 74, color: "#22c55e", delay: "0.55s" },
  { id: 4, left: "76%", length: 48, color: "#e879f9", delay: "0.25s" },
  { id: 5, left: "90%", length: 64, color: "#fb923c", delay: "0.7s" },
];

const FLAKES = Array.from({ length: 32 }, (_, index) => ({
  id: index,
  left: `${(index * 31) % 100}%`,
  delay: `${(index * 0.41) % 9}s`,
  duration: `${9 + (index % 8)}s`,
  size: index % 6 === 0 ? 14 : 4 + (index % 5) * 2,
  drift: `${(index % 2 === 0 ? 1 : -1) * (14 + (index % 18))}px`,
  rest: `${6 + ((index * 17) % 78)}%`,
  opacity: 0.55 + (index % 4) * 0.1,
  shape: index % 6 === 0 ? "flake" : "dot",
}));

function ChristmasTree() {
  return (
    <svg className="christmas-tree" viewBox="0 0 120 156" fill="none">
      <polygon points="60,22 96,62 84,62 108,96 92,96 120,136 0,136 28,96 12,96 36,62 24,62" fill="#166534" />
      <polygon points="60,34 88,62 32,62" fill="#4ade80" opacity="0.45" />
      <polygon points="60,70 100,96 20,96" fill="#22c55e" opacity="0.35" />
      <rect x="50" y="136" width="20" height="16" rx="2" fill="#92400e" />
      <polygon points="60,2 65,14 78,14 68,22 72,34 60,26 48,34 52,22 42,14 55,14" fill="#fde68a" />
      <circle cx="48" cy="78" r="4.5" fill="#ef4444" />
      <circle cx="72" cy="84" r="4.5" fill="#facc15" />
      <circle cx="58" cy="100" r="4.5" fill="#38bdf8" />
      <circle cx="40" cy="112" r="4.5" fill="#e879f9" />
      <circle cx="80" cy="116" r="4.5" fill="#fb923c" />
      <circle cx="60" cy="122" r="4.5" fill="#facc15" />
    </svg>
  );
}

export function ChristmasDecorations() {
  const { data } = useChristmasDecorations();
  if (!data?.enabled) return null;

  return (
    <div className="christmas-overlay" aria-hidden="true">
      <div className="christmas-lights">
        {BULBS.map((bulb) => (
          <span
            key={bulb.id}
            className="christmas-bulb"
            style={{ backgroundColor: bulb.color, animationDelay: bulb.delay, color: bulb.color }}
          />
        ))}
      </div>

      <div className="christmas-ornaments">
        {ORNAMENTS.map((ornament) => (
          <span
            key={ornament.id}
            className="christmas-ornament"
            style={{
              left: ornament.left,
              animationDelay: ornament.delay,
            }}
          >
            <span className="christmas-ornament-string" style={{ height: ornament.length }} />
            <span className="christmas-ornament-ball" style={{ backgroundColor: ornament.color }} />
          </span>
        ))}
      </div>

      <div className="christmas-snow">
        {FLAKES.map((flake) => (
          <span
            key={flake.id}
            className={flake.shape === "flake" ? "christmas-flake christmas-flake-shape" : "christmas-flake"}
            style={
              {
                left: flake.left,
                width: flake.shape === "flake" ? flake.size + 6 : flake.size,
                height: flake.shape === "flake" ? flake.size + 6 : flake.size,
                fontSize: flake.size + 4,
                animationDelay: flake.delay,
                animationDuration: flake.duration,
                opacity: flake.opacity,
                "--drift": flake.drift,
                "--rest": flake.rest,
              } as CSSProperties
            }
          >
            {flake.shape === "flake" ? "❄" : null}
          </span>
        ))}
      </div>

      <ChristmasTree />
    </div>
  );
}
