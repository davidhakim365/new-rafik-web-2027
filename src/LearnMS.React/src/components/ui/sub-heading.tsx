import { cn } from "@/lib/utils";

interface SubheadingProps {
  className?: string;
  children: React.ReactNode;
  as?: "h2" | "h3" | "h4" | "h5" | "h6";
}

export const SubHeading: React.FC<SubheadingProps> = ({
  className,
  children,
  as: Tag = "h2",
}) => {
  return (
    <Tag
      className={cn(
        "font-sans text-2xl font-medium tracking-tight text-subheading md:text-4xl",
        className
      )}
    >
      {children}
    </Tag>
  );
};
