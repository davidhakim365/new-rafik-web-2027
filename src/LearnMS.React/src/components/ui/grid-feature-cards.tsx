import { cn } from "@/lib/utils";
import { useId, useState } from "react";
import { motion } from "framer-motion";
import { Heading } from "./heading";
import { Paragraph } from "./paragraph";
import { useNavigate } from "react-router-dom";

type FeatureType = {
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
  level: number;
};

type FeatureCardPorps = React.ComponentProps<"div"> & {
  feature: FeatureType;
};

export const FeatureCard = ({
  feature,
  className,
  ...props
}: FeatureCardPorps) => {
  const p = genRandomPattern(20);
  const [hovered, setHovered] = useState<boolean>(false);

  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "relative overflow-hidden px-16 py-10 cursor-pointer",
        className
      )}
      {...props}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/courses/levels/${feature.level}`)}
    >
      <div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)]">
        <div className="from-foreground/5 to-foreground/1 absolute inset-0 bg-gradient-to-r [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] opacity-100">
          <GridPattern
            width={35}
            height={35}
            x="-12"
            y="4"
            squares={p}
            className="absolute inset-0 w-full h-full fill-foreground/5 stroke-foreground/25 mix-blend-overlay"
          />
        </div>
      </div>

      <feature.icon
        className="text-foreground/75 size-6"
        strokeWidth={1}
        aria-hidden
      />
      <motion.div
        animate={
          hovered
            ? { x: 30, transition: { ease: "easeInOut", duration: 0.2 } }
            : { x: 0, transition: { ease: "easeInOut", duration: 0.2 } }
        }
      >
        <Heading className="mt-10 text-xl md:text-3xl">{feature.title}</Heading>
        <Paragraph className="relative z-20 mt-2">
          {feature.description}
        </Paragraph>
      </motion.div>
    </div>
  );
};

export function GridPattern({
  width,
  height,
  x,
  y,
  squares,
  ...props
}: React.ComponentProps<"svg"> & {
  width: number;
  height: number;
  x: string;
  y: string;
  squares?: number[][];
}) {
  const patternId = useId();

  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        strokeWidth={0}
        fill={`url(#${patternId})`}
      />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([x, y], index) => (
            <rect
              strokeWidth="0"
              key={index}
              width={width + 1}
              height={height + 1}
              x={x * width}
              y={y * height}
            />
          ))}
        </svg>
      )}
    </svg>
  );
}

export function genRandomPattern(length?: number): number[][] {
  length = length ?? 5;
  return Array.from({ length }, () => [
    Math.floor(Math.random() * 4) + 7,
    Math.floor(Math.random() * 6) + 1,
  ]);
}
