import { cn } from "@/lib/utils";
import { useId, useState } from "react";
import { motion } from "framer-motion";
import { Heading } from "./heading";
import { Paragraph } from "./paragraph";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

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
  const [hovered, setHovered] = useState<boolean>(false);
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "group relative overflow-hidden px-8 py-8 cursor-pointer rounded-2xl",
        "bg-background/70 backdrop-blur-sm border border-color2/10",
        "hover:border-color2/30 hover:shadow-xl hover:shadow-color2/5 transition-all duration-300",
        "hover:-translate-y-1",
        className
      )}
      {...props}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/courses/levels/${feature.level}`)}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-color2/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center justify-center size-14 rounded-xl bg-gradient-to-br from-color1 to-color2 text-white shadow-md shadow-color2/20 group-hover:scale-110 transition-transform duration-300">
          <feature.icon className="size-7" strokeWidth={1.5} aria-hidden />
        </div>
        <ArrowUpRight className="size-5 text-color2/40 group-hover:text-color2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
      </div>

      <motion.div
        animate={
          hovered
            ? { x: 4, transition: { ease: "easeInOut", duration: 0.2 } }
            : { x: 0, transition: { ease: "easeInOut", duration: 0.2 } }
        }
      >
        <Heading className="text-xl md:text-2xl font-bold">{feature.title}</Heading>
        <Paragraph className="relative z-20 mt-2 text-sm leading-relaxed">
          {feature.description}
        </Paragraph>
      </motion.div>

      <div className="mt-4 text-xs font-semibold text-color2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        Explore courses →
      </div>
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
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${patternId})`} />
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
