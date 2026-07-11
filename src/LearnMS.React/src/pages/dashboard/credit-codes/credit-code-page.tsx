import { DataTable } from "@/components/data-table";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import Loading from "@/components/loading/loading";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import {
  getGetCreditCodesQueryKey,
  useGenerateCreditCodes,
  useGetCreditCodes,
  useSellCreditCodes,
} from "@/generated/api";
import useDownloadFile from "@/hooks/useDownloadFile";
import { creditCodesColumns } from "@/pages/dashboard/credit-codes/columns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  PaginationState,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";
import { Download, FileWarningIcon, Loader2, QrCode, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";

const GenerateCreditCodeRequest = z.object({
  count: z.coerce
    .number()
    .min(1, { message: "Count must be greater than 0" })
    .max(1000, { message: "Count must be less than 100" }),
  value: z.coerce
    .number()
    .positive()
    .max(1000, { message: "Value must be less than 1000" }),
});

export type GenerateCreditCodeRequest = z.infer<
  typeof GenerateCreditCodeRequest
>;

const CreditCodesPage = () => {
  const { download, isDownloading } = useDownloadFile();
  const form = useForm({
    resolver: zodResolver(GenerateCreditCodeRequest),
    defaultValues: { count: 0, value: 0 },
  });
  const qc = useQueryClient();

  const generateCreditCodesMutation = useGenerateCreditCodes({
    mutation: {
      onSuccess: (data) => {
        toast({ title: data.message ?? "Credit codes generated" });
        form.reset();
        qc.invalidateQueries({ queryKey: getGetCreditCodesQueryKey() });
      },
    },
  });

  const sellCreditCodesMutation = useSellCreditCodes({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Credit codes sold", description: data.message });
        qc.invalidateQueries({ queryKey: getGetCreditCodesQueryKey() });
      },
    },
  });

  const [searchParams, setSearchParams] = useSearchParams({});
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: Number(searchParams.get("page") ?? 1) - 1,
    pageSize: Number(searchParams.get("pageSize") ?? 10),
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    setSearchParams({
      page: `${pageIndex + 1}`,
      pageSize: `${pageSize}`,
      ...(search ? { search } : {}),
    });
  }, [pageIndex, pageSize, search]);

  const sortOrder =
    sorting.find((s) => s.id === "status")?.desc === true
      ? "desc"
      : sorting.find((s) => s.id === "status")?.desc === false
        ? "asc"
        : undefined;

  const query = useGetCreditCodes({
    page: pageIndex + 1,
    pageSize,
    search,
    sortOrder,
  });

  if (query.isError) {
    return (
      <DashboardPageShell title="Credit Codes" icon={QrCode}>
        <DashboardCard className="flex flex-col items-center gap-2 text-center">
          <FileWarningIcon className="h-8 w-8 text-destructive" />
          <p>Error loading credit codes</p>
          <p className="text-sm text-muted-foreground">{query.error.message}</p>
        </DashboardCard>
      </DashboardPageShell>
    );
  }

  if (query.isLoading || !query.data) return <Loading />;

  const onExport = async () => {
    await download(`/api/credit-codes/export`, "credits.csv");
  };

  const selectedCodes =
    Object.keys(rowSelection).length > 0 ? Object.keys(rowSelection) : null;

  return (
    <DashboardPageShell
      title="Credit Codes"
      description="Generate, sell, and export credit codes for students."
      icon={QrCode}
      fullWidth
    >
      <DashboardCard>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) =>
              generateCreditCodesMutation.mutate({ data })
            )}
            className="space-y-4"
          >
            <fieldset
              disabled={generateCreditCodesMutation.isPending}
              className="grid gap-4 sm:grid-cols-2"
            >
              <FormField
                control={form.control}
                name="count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Count</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value (LE)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>
            <Button
              type="submit"
              disabled={generateCreditCodesMutation.isPending}
              className="bg-gradient-to-r from-color1 to-color2 shadow-md shadow-color2/20 hover:opacity-90"
            >
              {generateCreditCodesMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Codes"
              )}
            </Button>
          </form>
        </Form>
      </DashboardCard>

      <DashboardCard>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Filter codes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedCodes && (
              <Button
                onClick={() =>
                  sellCreditCodesMutation.mutate({ data: { codes: selectedCodes } })
                }
                disabled={sellCreditCodesMutation.isPending}
                className="bg-gradient-to-r from-color1 to-color2 hover:opacity-90"
              >
                Sell Selected ({selectedCodes.length})
              </Button>
            )}
            <Button
              disabled={isDownloading}
              variant="outline"
              className="border-color2/20"
              onClick={onExport}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="ml-2">Export</span>
            </Button>
          </div>
        </div>

        <DataTable
          getRowId={(row) => row.code}
          sorting={sorting}
          setSorting={setSorting}
          pagination={{
            hasNextPage: query.data.data!.hasNextPage,
            hasPreviousPage: query.data.data!.hasPreviousPage,
            pageIndex,
            pageSize,
            pageCount: query.data.data!.totalCount,
          }}
          columns={creditCodesColumns}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
          data={query.data.data!.items}
          setPagination={setPagination}
        />
      </DashboardCard>
    </DashboardPageShell>
  );
};

export default CreditCodesPage;
