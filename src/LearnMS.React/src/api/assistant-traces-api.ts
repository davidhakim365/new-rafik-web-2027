import { api } from "@/api";
import { useQuery } from "@tanstack/react-query";

type ApiSuccess<T> = {
  data: T;
  message?: string;
};

export type AssistantTraceItem = {
  id: string;
  actorId: string;
  actorRole: string;
  actorName: string;
  action: string;
  detail?: string | null;
  method: string;
  path: string;
  courseId?: string | null;
  courseTitle?: string | null;
  lectureId?: string | null;
  lectureTitle?: string | null;
  createdAt: string;
};

export type AssistantTracePage = {
  items: AssistantTraceItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type AssistantTraceCourseOption = {
  id: string;
  title: string;
};

export type AssistantTraceLectureOption = {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
};

export type AssistantTraceAssistantOption = {
  id: string;
  fullName: string;
  email: string;
};

export type AssistantTraceOptions = {
  courses: AssistantTraceCourseOption[];
  lectures: AssistantTraceLectureOption[];
  assistants: AssistantTraceAssistantOption[];
};

export type GetAssistantTracesParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  courseId?: string;
  lectureId?: string;
  actor?: string;
};

export const ASSISTANT_TRACES_QUERY_KEY = "assistant-traces";

export function useAssistantTraceOptionsQuery() {
  return useQuery<ApiSuccess<AssistantTraceOptions>>({
    queryKey: [ASSISTANT_TRACES_QUERY_KEY, "options"],
    queryFn: () =>
      api.get<ApiSuccess<AssistantTraceOptions>>("/api/assistant-traces/options").then((res) => res.data),
    staleTime: 60_000,
  });
}

export function useAssistantTracesQuery(params: GetAssistantTracesParams) {
  return useQuery<ApiSuccess<AssistantTracePage>>({
    queryKey: [ASSISTANT_TRACES_QUERY_KEY, params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set("page", String(params.page));
      if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
      if (params.search) searchParams.set("search", params.search);
      if (params.courseId) searchParams.set("courseId", params.courseId);
      if (params.lectureId) searchParams.set("lectureId", params.lectureId);
      if (params.actor) searchParams.set("actor", params.actor);
      const query = searchParams.toString();
      return api
        .get<ApiSuccess<AssistantTracePage>>(`/api/assistant-traces${query ? `?${query}` : ""}`)
        .then((res) => res.data);
    },
  });
}
