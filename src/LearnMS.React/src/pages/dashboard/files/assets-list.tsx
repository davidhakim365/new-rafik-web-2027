import Uppy from "@uppy/core";
import Tus from "@uppy/tus";
import Dashboard from "@uppy/dashboard";
import DropTarget from "@uppy/drop-target";

import { useEffect, useMemo, useState } from "react";
import { useAssetsQuery, useDeleteAssetsMutation } from "@/api/assets-api";
import { DataTable } from "@/components/data-table";
import Loading from "@/components/loading/loading";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/utils";
import { assetsColumns } from "@/pages/dashboard/files/columns";
import { useAssetsStore } from "@/store/use-assets-store";
import { useQueryClient } from "@tanstack/react-query";
import { PaginationState, RowSelectionState } from "@tanstack/react-table";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import "@uppy/drop-target/dist/style.css";

const AssetsList = () => {
  const { addAssets } = useAssetsStore();
  const queryClient = useQueryClient();

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
    addAssets(selected);
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

  // Initialize Uppy within the component
  const uppy = new Uppy({
    restrictions: {
      allowedFileTypes: ["image/*", "application/pdf"],
      maxTotalFileSize: 50 * 1024 * 1024,
    },
  }).use(Tus, {
    endpoint: "/api/assets",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    onShouldRetry() {
      return false;
    },
    onAfterResponse(_, res) {
      if (res.getStatus() === 204) {
        toast({
          title: "File uploaded successfully",
        });
        queryClient.invalidateQueries({
          queryKey: ["assets"],
        });
      }
    },
  });

  useEffect(() => {
    uppy
      .use(DropTarget, {
        target: "#files-drop-zone",
        onDrop: () => {
          const plugin = uppy.getPlugin("Dashboard");
          if (plugin) {
            plugin.openModal();
          }
        },
      })
      .use(Dashboard, {
        inline: false,
        target: "#files-drop-zone",
        height: 200,
      });

    return () => {
      uppy.close();
    };
  }, [uppy]);

  const openUppyDashboard = () => {
    const plugin = uppy.getPlugin("Dashboard");
    if (plugin) {
      plugin.openModal();
    }
  };
  return (
    <div className="w-full h-full text-foreground" id="files-drop-zone">
      <h1 className="mb-4">Assets</h1>
      {isLoading ? (
        <Loading />
      ) : (
        <div className="relative">
          <Button onClick={openUppyDashboard} className="mb-4">
            Upload Files
          </Button>
          <Button
            onClick={onDelete}
            variant="destructive"
            disabled={
              deleteAssetsMutation.isPending ||
              Object.keys(rowSelection).length === 0
            }
          >
            Delete
          </Button>
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
          {Object.keys(rowSelection).length > 0 && (
            <div className="absolute flex gap-2 mt-12 top-4 left-6">
              <Button
                onClick={onSelectAssets}
                disabled={deleteAssetsMutation.isPending}
                className="mr-2"
              >
                Add Assets
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssetsList;
