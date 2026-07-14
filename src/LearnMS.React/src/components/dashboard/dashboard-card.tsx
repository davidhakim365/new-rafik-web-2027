import { cn } from "@/lib/utils";
import { ReactNode, useRef, useState } from "react";

type DashboardCardProps = {
  children: ReactNode;
  className?: string;
  spotlight?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
};

const paddingMap = {
  none: "p-0",
  sm: "p-3 sm:p-4",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-6",
};

export function DashboardCard({
  children,
  className,
  spotlight = true,
  padding = "md",
}: DashboardCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!divRef.current || !spotlight) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => spotlight && setOpacity(0.5)}
      onMouseLeave={() => setOpacity(0)}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-color2/10 bg-card/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-color2/20 hover:shadow-md",
        paddingMap[padding],
        className
      )}
    >
      {spotlight && (
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-500"
          style={{
            opacity,
            background: `radial-gradient(500px circle at ${position.x}px ${position.y}px, hsl(var(--color2) / 0.08), transparent 40%)`,
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
