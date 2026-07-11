import { ApiResponse, api } from "@/api";
import { AssetsPageList } from "@/types/assets";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useAssetsQuery = ({
  page,
  pageSize,
  search,
}: {
  page: number;
  pageSize: number;
  search: string | undefined;
}) => {
  return useQuery<ApiResponse<AssetsPageList>>({
    queryKey: ["assets", { page, pageSize, search }],
    queryFn: () =>
      api
        .get(`/api/assets?page=${page}&pageSize=${pageSize}&search=${search}`)
        .then((res) => res.data),
  });
};

export const useDeleteAssetsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<{}>, {}, string[]>({
    mutationFn: (data) =>
      api.post(`/api/assets/delete`, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
};
