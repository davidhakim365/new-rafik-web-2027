import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Course } from "@/types/courses";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";

const levelMap: Record<string, string> = {
  Level0: "3rd Prep",
  Level1: "1st Secondary",
  Level2: "2nd Secondary",
  Level3: "3rd Secondary",
};

export const coursesColumns: ColumnDef<Course>[] = [
  {
    id: "actions",
    cell: ({ row }) => {
      const course = row.original;

      return (
        <Link
          to={`/dashboard/courses/${course.id}`}
          style={{
            backgroundColor: "#10b981",
            color: "#fff",
            padding: "0.5rem 1rem",
            borderRadius: "0.25rem",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          View
        </Link>
      );
    },
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      const title = row.getValue<string>("title");
      return <span className="text-foreground">{title}</span>;
    },
  },
  {
    accessorKey: "level",
    header: "Level",
    cell: ({ row }) => {
      const level = row.getValue<string>("level");
      // Ensure level is properly looked up and return a fallback if necessary
      return (
        <span className="text-foreground">
          {levelMap[level as keyof typeof levelMap] || "Unknown Level"}
        </span>
      );
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = row.getValue<number>("price");
      return <span className="text-foreground">{price.toFixed(2)} EGP</span>;
    },
  },
  {
    accessorKey: "renewalPrice",
    header: "Renewal Price",
    cell: ({ row }) => {
      const renewalPrice = row.getValue<number>("renewalPrice");
      return (
        <span className="text-foreground">{renewalPrice.toFixed(2)} EGP</span>
      );
    },
  },
  {
    accessorKey: "imageUrl",
    header: "Cover",
    cell: ({ row }) => {
      return (
        <img
          src={row.getValue<string>("imageUrl")}
          className="w-10 h-10 rounded"
        />
      );
    },
  },
];
