import { DataTable } from "@/components/data-table";
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
import { FileWarningIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FaFileExport } from "react-icons/fa";
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
    defaultValues: {
      count: 0,
      value: 0,
    },
  });

  const qc = useQueryClient();

  const generateCreditCodesMutation = useGenerateCreditCodes({
    mutation: {
      onSuccess: (data) => {
        toast({
          title: data.message ?? "Credit codes generated",
        });
        form.reset();
        qc.invalidateQueries({
          queryKey: getGetCreditCodesQueryKey(),
        });
      },
    },
  });

  const sellCreditCodesMutation = useSellCreditCodes({
    mutation: {
      onSuccess: (data) => {
        {
          toast({
            title: "Credit codes sold",
            description: data.message,
          });
          qc.invalidateQueries({
            queryKey: getGetCreditCodesQueryKey(),
          });
        }
      },
    },
  });

  const onSell = (codes: string[]) => {
    sellCreditCodesMutation.mutate({
      data: {
        codes,
      },
    });
  };

  const onSubmit = (data: GenerateCreditCodeRequest) => {
    generateCreditCodesMutation.mutate({
      data,
    });
  };

  const [searchParams, setSearchParams] = useSearchParams({});
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: Number(searchParams.get("page") ?? 1) - 1,
    pageSize: Number(searchParams.get("pageSize") ?? 10),
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [sorting, setStorting] = useState<SortingState>([]);

  useEffect(() => {
    setSearchParams({
      page: `${pageIndex + 1}`,
      pageSize: `${pageSize}`,
      ...(search ? { search } : {}),
    });
  }, [pageIndex, pageSize, search]);

  var sortOrder: any;
  if (sorting.filter((s) => s.id === "status")[0]?.desc === true) {
    sortOrder = "desc";
  } else if (sorting.filter((s) => s.id === "status")[0]?.desc === false) {
    sortOrder = "asc";
  }

  const query = useGetCreditCodes({
    page: pageIndex + 1,
    pageSize: pageSize,
    search,
    sortOrder,
  });

  if (query.isError) {
    <div className="flex flex-col items-center justify-center w-full h-full">
      <FileWarningIcon className="w-4 h-4 text-pink-800" />
      <p>Error loading credit codes</p>
      <div>{query.error.message}</div>
    </div>;
  }

  if (query.isLoading || !query.data) return <Loading />;

  const onExport = async () => {
    await download(`/api/credit-codes/export`, "credits.csv");
  };

  const selectedCodes =
    Object.keys(rowSelection).length > 0 ? Object.keys(rowSelection) : null;

  return (
    <div className="w-full h-full p-4 w-[150vh]">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col items-center gap-2 py-4"
        >
          <fieldset
            disabled={generateCreditCodesMutation.isPending}
            className="grid grid-cols-2 gap-2 w-[80%] m-auto text-foreground"
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
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </fieldset>
          <Button
            disabled={generateCreditCodesMutation.isPending}
            className="transition-all duration-200 hover:scale-105"
          >
            {generateCreditCodesMutation.isPending ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" />
                Generating...
              </div>
            ) : (
              <>Generate</>
            )}
          </Button>
        </form>
      </Form>
      <div className="flex flex-col items-center gap-4 mx-6">
        {selectedCodes && (
          <Button
            type="button"
            onClick={() => onSell(selectedCodes)}
            disabled={sellCreditCodesMutation.isPending}
            className={`text-3xl text-blue-600 transition-all duration-300 bg-blue-300 border-2 border-blue-600 hover:text-white hover:scale-105 h-14 ${
              !selectedCodes ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Sell
          </Button>
        )}
        <div className="w-[40%] px-2 py-2 bg-blue-300 border border-blue-500 rounded-xl">
          <input
            placeholder="Filter Codes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 text-blue-500 rounded-xl focus:outline-none focus:border-none"
          />
        </div>
      </div>

      {query.isLoading ? (
        <Loading />
      ) : (
        <div className="relative w-[120vh]">
          <Button
            disabled={isDownloading}
            variant="outline"
            className="absolute w-fit h-fit top-4 right-24 text-primary"
            onClick={onExport}
          >
            {(!isDownloading && <FaFileExport />) || (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
          </Button>
          <DataTable
            getRowId={(row) => row.code}
            sorting={sorting}
            setSorting={setStorting}
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
        </div>
      )}
    </div>
  );
};

export default CreditCodesPage;
