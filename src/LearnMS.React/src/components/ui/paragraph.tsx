import { cn } from "@/lib/utils";

interface ParagraphProps {
  children: React.ReactNode;
  className?: string;
  as?: "p" | "span" | "div";
}

export const Paragraph: React.FC<ParagraphProps> = ({
  as: Tag = "p",
  children,
  className,
}) => {
  return (
    <Tag className={cn("text-lg md:text-xl text-paragraph", className)}>
      {children}
    </Tag>
  );
};
