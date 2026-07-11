import { toast } from "@/components/ui/use-toast";
import { clsx, type ClassValue } from "clsx";
import { toast as sonner } from "sonner";
import { twMerge } from "tailwind-merge";

// Function to merge class names using tailwind-merge and clsx
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to get the first characters of the first and last name
export function getFirstCharacters(inputString: string): string {
  const [firstName, lastName] = inputString.split(" ");

  // Return the first letter of the first name and the first letter of the last name (if present)
  return (firstName?.[0] ?? "") + (lastName?.[0] ?? "");
}

// Exporting the `sonner` and `toast` utilities
export { sonner, toast };
