import { cn } from "@/lib/utils";

const formulas = [
  { text: "E = mc²", top: "12%", left: "8%", delay: "0s", size: "text-lg md:text-xl" },
  { text: "F = ma", top: "28%", right: "6%", delay: "1.2s", size: "text-base md:text-lg" },
  { text: "π", top: "55%", left: "4%", delay: "2.4s", size: "text-2xl md:text-3xl" },
  { text: "∫ f(x)dx", top: "70%", right: "10%", delay: "0.8s", size: "text-sm md:text-base" },
  { text: "v = u + at", top: "85%", left: "15%", delay: "1.8s", size: "text-sm md:text-base" },
  { text: "ΔE = hf", top: "18%", right: "18%", delay: "3s", size: "text-sm md:text-base" },
  { text: "λ = h/p", top: "45%", right: "4%", delay: "2s", size: "text-sm md:text-base" },
];

export function FloatingFormulas({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {formulas.map(({ text, top, left, right, delay, size }) => (
        <span
          key={text}
          style={{ top, left, right, animationDelay: delay }}
          className={cn(
            "absolute font-mono font-medium text-color2/20 dark:text-color2/30 animate-float select-none",
            size
          )}
        >
          {text}
        </span>
      ))}
    </div>
  );
}

export function AtomOrbit({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      className={cn("size-48 md:size-64 opacity-30 dark:opacity-20", className)}
      fill="none"
    >
      <circle cx="100" cy="100" r="6" fill="currentColor" className="text-color2" />
      <ellipse
        cx="100"
        cy="100"
        rx="80"
        ry="30"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-color2 animate-orbit origin-center"
        style={{ transformOrigin: "100px 100px" }}
      />
      <ellipse
        cx="100"
        cy="100"
        rx="80"
        ry="30"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-color1 animate-orbit origin-center"
        style={{ transformOrigin: "100px 100px", transform: "rotate(60deg)" }}
      />
      <ellipse
        cx="100"
        cy="100"
        rx="80"
        ry="30"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-color2/70 animate-orbit origin-center"
        style={{ transformOrigin: "100px 100px", transform: "rotate(120deg)" }}
      />
      <circle cx="180" cy="100" r="4" fill="currentColor" className="text-color2 animate-pulse-glow" />
    </svg>
  );
}

export function WavePattern({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className={cn("absolute bottom-0 left-0 w-full h-24 md:h-32", className)}
    >
      <path
        d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,30 1440,60 L1440,120 L0,120 Z"
        className="fill-hero"
      />
      <path
        d="M0,80 C360,40 720,100 1080,70 C1260,50 1380,90 1440,70 L1440,120 L0,120 Z"
        className="fill-color2/5 dark:fill-color2/10"
      />
    </svg>
  );
}

export function PhysicsGrid({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0",
        "[background-size:60px_60px]",
        "[background-image:linear-gradient(to_right,hsl(var(--color2)/0.06)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--color2)/0.06)_1px,transparent_1px)]",
        className
      )}
    />
  );
}

export function GlowOrb({
  className,
  color = "from-color2/30 to-color1/20",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute rounded-full bg-gradient-to-br blur-3xl animate-pulse-glow",
        color,
        className
      )}
    />
  );
}

export function PhysicsDivider() {
  return (
    <div aria-hidden className="relative flex items-center justify-center py-4">
      <div className="h-px w-full max-w-xs bg-gradient-to-r from-transparent via-color2/40 to-transparent" />
      <svg viewBox="0 0 24 24" className="mx-4 size-5 text-color2/60 shrink-0" fill="currentColor">
        <circle cx="12" cy="12" r="2" />
        <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1" />
        <ellipse
          cx="12"
          cy="12"
          rx="10"
          ry="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          transform="rotate(60 12 12)"
        />
        <ellipse
          cx="12"
          cy="12"
          rx="10"
          ry="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          transform="rotate(120 12 12)"
        />
      </svg>
      <div className="h-px w-full max-w-xs bg-gradient-to-r from-transparent via-color2/40 to-transparent" />
    </div>
  );
}
