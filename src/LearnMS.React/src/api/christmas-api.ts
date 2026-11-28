import { api } from "@/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export type ChristmasSettings = {
  enabled: boolean;
  updatedAt: string;
};

type ApiSuccess<T> = {
  data: T;
};

export const CHRISTMAS_QUERY_KEY = ["christmas-decorations"] as const;

async function fetchChristmasDecorations(): Promise<ChristmasSettings> {
  const { data } = await axios.get<ApiSuccess<ChristmasSettings>>("/api/christmas");
  return data.data;
}

async function updateChristmasDecorations(enabled: boolean): Promise<ChristmasSettings> {
  const { data } = await api.put<ApiSuccess<ChristmasSettings>>("/api/christmas", { enabled });
  return data.data;
}

export function useChristmasDecorations() {
  return useQuery({
    queryKey: CHRISTMAS_QUERY_KEY,
    queryFn: fetchChristmasDecorations,
    staleTime: 20_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    retry: 1,
    throwOnError: false,
  });
}

export function useUpdateChristmasDecorations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateChristmasDecorations,
    onMutate: async (enabled) => {
      await queryClient.cancelQueries({ queryKey: CHRISTMAS_QUERY_KEY });
      const previous = queryClient.getQueryData<ChristmasSettings>(CHRISTMAS_QUERY_KEY);
      queryClient.setQueryData<ChristmasSettings>(CHRISTMAS_QUERY_KEY, {
        enabled,
        updatedAt: new Date().toISOString(),
      });
      return { previous };
    },
    onError: (_error, _enabled, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CHRISTMAS_QUERY_KEY, context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(CHRISTMAS_QUERY_KEY, data);
    },
  });
}
