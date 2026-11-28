import { api } from "@/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export type RamadanSettings = {
  enabled: boolean;
  updatedAt: string;
};

type ApiSuccess<T> = {
  data: T;
};

export const RAMADAN_QUERY_KEY = ["ramadan-decorations"] as const;

async function fetchRamadanDecorations(): Promise<RamadanSettings> {
  const { data } = await axios.get<ApiSuccess<RamadanSettings>>("/api/ramadan");
  return data.data;
}

async function updateRamadanDecorations(enabled: boolean): Promise<RamadanSettings> {
  const { data } = await api.put<ApiSuccess<RamadanSettings>>("/api/ramadan", { enabled });
  return data.data;
}

export function useRamadanDecorations() {
  return useQuery({
    queryKey: RAMADAN_QUERY_KEY,
    queryFn: fetchRamadanDecorations,
    staleTime: 20_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    retry: 1,
    throwOnError: false,
  });
}

export function useUpdateRamadanDecorations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRamadanDecorations,
    onMutate: async (enabled) => {
      await queryClient.cancelQueries({ queryKey: RAMADAN_QUERY_KEY });
      const previous = queryClient.getQueryData<RamadanSettings>(RAMADAN_QUERY_KEY);
      queryClient.setQueryData<RamadanSettings>(RAMADAN_QUERY_KEY, {
        enabled,
        updatedAt: new Date().toISOString(),
      });
      return { previous };
    },
    onError: (_error, _enabled, context) => {
      if (context?.previous) {
        queryClient.setQueryData(RAMADAN_QUERY_KEY, context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(RAMADAN_QUERY_KEY, data);
    },
  });
}
