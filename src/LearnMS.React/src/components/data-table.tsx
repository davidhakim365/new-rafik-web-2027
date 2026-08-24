import {
  Column,
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  RowSelectionState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DataTablePagination,
  DataTableViewOptions,
} from "./data-table-components";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: Readonly<TData[]>;
  sorting?: SortingState;
  setSorting?: OnChangeFn<SortingState>;
  columnFilters?: ColumnFiltersState;
  setColumnFilters?: OnChangeFn<ColumnFiltersState>;
  getRowId?: (row: TData) => string;
  pagination?: {
    pageIndex: number;
    pageSize: number;
    pageCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  rowSelection?: RowSelectionState;
  setRowSelection?: OnChangeFn<RowSelectionState>;
  setPagination?: OnChangeFn<PaginationState>;
  rowCount?: number;
}

function getColumnLabel<TData>(column: Column<TData, unknown>) {
  const header = column.columnDef.header;
  if (typeof header === "string") return header;
  return column.id
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export function DataTable<TData, TValue>({
  columns,
  data,
  setColumnFilters,
  columnFilters,
  pagination,
  setRowSelection,
  setPagination,
  rowSelection,
  rowCount,
  setSorting,
  getRowId,
  sorting,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data: data as any,
    getRowId,
    columns,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    manualPagination: true,
    manualSorting: true,
    onRowSelectionChange: setRowSelection,
    manualFiltering: true,
    onColumnFiltersChange: setColumnFilters,
    rowCount,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      pagination,
      rowSelection: rowSelection ?? {},
      sorting,
      columnFilters,
    },
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="w-full min-w-0">
      <div className="mb-3 flex items-center justify-end">
        <DataTableViewOptions table={table} />
      </div>

      <div className="space-y-2 lg:hidden">
        {rows.length ? (
          rows.map((row) => {
            const cells = row.getVisibleCells();
            const selectCell = cells.find((cell) => cell.column.id === "select");
            const otherCells = cells.filter((cell) => cell.column.id !== "select");

            return (
              <div
                key={row.id}
                className="flex items-start gap-3 rounded-xl border border-color2/10 bg-card/50 p-3 shadow-sm"
              >
                {selectCell && (
                  <div className="shrink-0 pt-1">
                    {flexRender(
                      selectCell.column.columnDef.cell,
                      selectCell.getContext()
                    )}
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  {otherCells.map((cell) => (
                    <div
                      key={cell.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <p className="w-16 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {getColumnLabel(cell.column)}
                      </p>
                      <div className="min-w-0 flex-1 text-right text-sm [overflow-wrap:anywhere]">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-color2/10 bg-card/50 p-8 text-center text-muted-foreground">
            No results.
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-color2/10 bg-card/50 shadow-sm backdrop-blur-sm lg:block">
        <div className="max-h-[calc(100dvh-14rem)] overflow-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-color2/10 bg-color2/5 hover:bg-color2/5"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="whitespace-nowrap text-xs font-medium text-muted-foreground sm:text-sm"
                      style={{
                        width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined,
                        minWidth: "60px",
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.length ? (
                rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="border-color2/5 transition-colors hover:bg-color2/5"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="p-2 text-center sm:p-3"
                        style={{
                          width:
                            cell.column.getSize() !== 150
                              ? `${cell.column.getSize()}px`
                              : undefined,
                          minWidth: "60px",
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {(pagination || rowCount) && <DataTablePagination table={table} />}
    </div>
  );
}
