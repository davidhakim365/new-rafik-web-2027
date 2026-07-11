import { cn } from "@/lib/utils";
import * as React from "react";

export interface PlasticButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: "default" | "sm" | "lg" | "icon";
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
}

export function PlasticButton({
  children,
  className,
  size = "default",
  variant = "default",
  ...props
}: PlasticButtonProps) {
  const sizeClasses = {
    default: "px-4 py-1.75 text-sm",
    sm: "px-3 py-1.5 text-xs",
    lg: "px-6 py-2.5 text-base",
    icon: "w-9 h-9 p-0",
  };

  const variantStyles = {
    default: {
      className: "text-white [&>*]:text-white",
      style: {
        background: `linear-gradient(to bottom, rgb(59, 130, 246), rgb(37, 99, 235))`,
        boxShadow: `0 2px 8px 0 rgba(37, 99, 235, 0.35), 0 1.5px 0 0 rgba(255,255,255,0.25) inset, 0 -2px 8px 0 rgba(37, 99, 235, 0.5) inset`,
        color: "white",
      },
    },
    destructive: {
      className: "text-white [&>*]:text-white",
      style: {
        background: `linear-gradient(to bottom, rgb(239, 68, 68), rgb(220, 38, 38))`,
        boxShadow: `0 2px 8px 0 rgba(220, 38, 38, 0.35), 0 1.5px 0 0 rgba(255,255,255,0.25) inset, 0 -2px 8px 0 rgba(220, 38, 38, 0.5) inset`,
        color: "white",
      },
    },
    outline: {
      className: "text-primary bg-transparent border border-input",
      style: {
        background: `transparent`,
        boxShadow: `0 1px 3px 0 rgba(0, 0, 0, 0.1)`,
      },
    },
    secondary: {
      className: "text-white [&>*]:text-white",
      style: {
        background: `linear-gradient(to bottom, rgb(156, 163, 175), rgb(107, 114, 128))`,
        boxShadow: `0 2px 8px 0 rgba(107, 114, 128, 0.35), 0 1.5px 0 0 rgba(255,255,255,0.25) inset, 0 -2px 8px 0 rgba(107, 114, 128, 0.5) inset`,
        color: "white",
      },
    },
    ghost: {
      className: "text-foreground bg-transparent hover:bg-accent",
      style: {
        background: `transparent`,
        boxShadow: `none`,
      },
    },
    link: {
      className:
        "text-primary bg-transparent underline-offset-4 hover:underline",
      style: {
        background: `transparent`,
        boxShadow: `none`,
      },
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <button
      className={cn(
        "relative inline-flex rounded-full font-medium transition-all duration-200",
        "active:scale-[0.98] justify-center items-center gap-2 whitespace-nowrap",
        sizeClasses[size],
        currentVariant.className,
        className
      )}
      style={currentVariant.style}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {variant === "default" ||
      variant === "destructive" ||
      variant === "secondary" ? (
        <>
          <span
            className="absolute left-1/2 top-0 z-20 w-[80%] h-2/5 -translate-x-1/2 rounded-t-full pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 80%, transparent 100%)",
              filter: "blur(1.5px)",
            }}
          />
          <span
            className="absolute inset-0 z-0 rounded-full pointer-events-none"
            style={{
              boxShadow:
                "0 0 0 2px rgba(255,255,255,0.10) inset, 0 1.5px 0 0 rgba(255,255,255,0.18) inset",
            }}
          />
        </>
      ) : null}
    </button>
  );
}
