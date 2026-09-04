import { useEffect, useMemo, useState } from "react";
import { useAssetsQuery, useDeleteAssetsMutation } from "@/api/assets-api";
import { DataTable } from "@/components/data-table";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import Loading from "@/components/loading/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/utils";
import { assetsColumns } from "@/pages/dashboard/files/columns";
import { useAssetsStore, useQuizAnswerAssetsStore } from "@/store/use-assets-store";
import { PaginationState, RowSelectionState } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";

type AssetsListProps = {
  enableSelect?: boolean;
  selectTarget?: "assets" | "quizAnswers";
};

const AssetsList = ({
  enableSelect = false,
  selectTarget = "assets",
}: AssetsListProps) => {
  const { addAssets } = useAssetsStore();
  const { addAssets: addQuizAnswerAssets } = useQuizAnswerAssetsStore();

  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [search, setSearch] = useState("");

  const { data, isLoading } = useAssetsQuery({
    page: pageIndex + 1,
    pageSize,
    search,
  });

  const deleteAssetsMutation = useDeleteAssetsMutation();

  const selectedIds = useMemo(() => {
    return Object.entries(rowSelection)
      .filter(([_, value]) => value === true)
      .map(([key]) => key);
  }, [rowSelection]);

  const onSelectAssets = () => {
    const selected =
      data!.data.items?.filter((q) => selectedIds.includes(q.id)) ?? [];
    if (selectTarget === "quizAnswers") {
      addQuizAnswerAssets(selected);
    } else {
      addAssets(selected);
    }
    setRowSelection({});
  };

  const onDelete = () => {
    deleteAssetsMutation.mutate(selectedIds, {
      onSuccess: (res) => {
        toast({
          title: "Assets deleted",
          description: res.message,
        });
      },
    });
  };

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [search]);

  return (
    <div className="w-full min-w-0 text-foreground">
      {isLoading ? (
        <Loading />
      ) : (
        <DashboardCard className="overflow-auto">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Input
              className="w-full min-w-0 sm:max-w-sm"
              placeholder="Search by title or lecture..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button
              onClick={onDelete}
              variant="destructive"
              className="w-full sm:w-auto"
              disabled={
                deleteAssetsMutation.isPending ||
                Object.keys(rowSelection).length === 0
              }
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </div>
          <div className="relative min-w-0">
            <DataTable
              columns={assetsColumns}
              data={data?.data.items ?? []}
              pagination={{
                pageIndex,
                pageSize,
                pageCount: data?.data.pageSize ?? 0,
                hasNextPage: data?.data.hasNextPage ?? false,
                hasPreviousPage: data?.data.hasPreviousPage ?? false,
              }}
              setPagination={setPagination}
              rowSelection={rowSelection}
              setRowSelection={setRowSelection}
              getRowId={(row) => row.id}
            />
            {enableSelect && Object.keys(rowSelection).length > 0 && (
              <div className="sticky bottom-2 z-10 mt-3 flex justify-center sm:absolute sm:bottom-auto sm:left-6 sm:top-4 sm:mt-0 sm:justify-start">
                <Button
                  onClick={onSelectAssets}
                  disabled={deleteAssetsMutation.isPending}
                >
                  Add to {selectTarget === "quizAnswers" ? "Quiz Answers" : "Lecture"}
                </Button>
              </div>
            )}
          </div>
        </DashboardCard>
      )}
    </div>
  );
};

export default AssetsList;
