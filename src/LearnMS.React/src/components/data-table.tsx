import {
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

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-end">
        <DataTableViewOptions table={table} />
      </div>

      <div className="overflow-hidden rounded-xl border border-color2/10 bg-card/50 shadow-sm backdrop-blur-sm">
        <div className="max-h-[calc(100vh-12rem)] overflow-auto">
          <div className="min-w-full">
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
                        className="text-xs sm:text-sm font-medium text-muted-foreground"
                        style={{
                          width: `${header.getSize()}px`,
                          minWidth: "60px",
                          maxWidth: `${header.getSize()}px`,
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
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="border-color2/5 transition-colors hover:bg-color2/5"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="p-2 sm:p-3 text-center"
                          style={{
                            width: `${cell.getContext().column.getSize()}px`,
                            minWidth: "60px",
                            maxWidth: `${cell.getContext().column.getSize()}px`,
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
      </div>
      
      {/* Pagination */}
      {(pagination || rowCount) && <DataTablePagination table={table} />}
    </div>
  );
}
