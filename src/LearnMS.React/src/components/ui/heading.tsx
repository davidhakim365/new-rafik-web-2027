import { cn } from "@/lib/utils";

interface HeadingProps {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export const Heading: React.FC<HeadingProps> = ({
  as: Tag = "h1",
  children,
  className,
}) => {
  return (
    <Tag
      className={cn(
        "font-heading text-4xl font-semibold tracking-tight text-heading md:text-7xl",
        className
      )}
    >
      {children}
    </Tag>
  );
};
