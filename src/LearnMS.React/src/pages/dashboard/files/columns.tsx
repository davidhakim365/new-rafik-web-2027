import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Asset } from "@/types/assets";
import { ColumnDef, Row } from "@tanstack/react-table";
import { FaFile, FaFileImage, FaFilePdf } from "react-icons/fa";

// Define the columns
export const assetsColumns: ColumnDef<Asset>[] = [
  {
    id: "select",
    size: 40,
    header: ({ table }) => (
      <Checkbox
        checked={table?.getIsAllRowsSelected()}
        onCheckedChange={(value) => table?.toggleAllRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }: { row: Row<Asset> }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }: { row: Row<Asset> }) => {
      const type = row.original.type;

      return (
        <Button size="icon">
          <a href={`/api/assets/${row.original.id}`}>
            {type === "Pdf" && <FaFilePdf className="w-8 h-8" />}
            {type === "Image" && <FaFileImage className="w-8 h-8" />}
            {type === "Unknown" && <FaFile className="w-8 h-8" />}
          </a>
        </Button>
      );
    },
  },
];

type AssetsTableProps = {
  data: Asset[];
};

const AssetsTable = ({ data }: AssetsTableProps) => {
  return (
    <div
      style={{
        maxHeight: "400px", // Adjust the height as needed
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {assetsColumns.map((column) => (
              <th
                key={column.id}
                style={{
                  position: "sticky",
                  top: 0,
                  backgroundColor: "white",
                  zIndex: 1,
                  padding: "8px",
                  borderBottom: "1px solid #ddd",
                }}
              >

              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {assetsColumns.map((column) => (
                <td
                  key={column.id}
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #ddd",
                  }}
                >

                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssetsTable;
