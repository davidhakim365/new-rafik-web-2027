import { ApiResponse, api } from "@/api";
import type { Question as StoreQuestion } from "@/generated/model";
import { useQuestionsStore } from "@/store/use-questions-store";
import { Question, QuestionPageList } from "@/types/question";
import { QuestionChoiceDraft } from "@/types/assessment";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type CreateQuestionRequest = {
  description: string;
  text: string;
  image?: string;
  questionType: "MultipleChoice" | "ValueTolerance" | "Essay";
  multipleCorrect?: string;
  multipleChoices?: QuestionChoiceDraft[];
  valueCorrect?: number;
  valueTolerance?: number;
  essayMaxLength?: number;
  sourceTitle?: string;
  sourceIndex?: number;
};

export const useAddQuestionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<{}>, Error, CreateQuestionRequest>({
    mutationFn: (data) => {
      return api.post("/api/questions", data).then((res) => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["questions"],
      });
    },
  });
};

export const useAllQuestionsQuery = ({
  page,
  pageSize,
  search,
}: {
  page: number;
  pageSize: number;
  search: string | undefined;
}) => {
  return useQuery<ApiResponse<QuestionPageList>>({
    queryKey: ["questions", { page, pageSize, search }],
    queryFn: () =>
      api
        .get(
          `/api/questions?page=${page}&pageSize=${pageSize}&search=${search ?? ""}`
        )
        .then((res) => res.data),
  });
};

export const useDeleteQuestionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<{}>, Error, string>({
    mutationFn: (id) => {
      return api.delete(`/api/questions/${id}`).then((res) => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["questions"],
      });
    },
  });
};

export type UpdateQuestionRequest = CreateQuestionRequest & { id: string };

export const useUpdateQuestionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<Question>, Error, UpdateQuestionRequest>({
    mutationFn: ({ id, ...data }) => {
      return api.put(`/api/questions/${id}`, data).then((res) => res.data);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["quiz"] });
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.some(
            (key) => typeof key === "string" && /exam/i.test(key)
          ),
      });
      if (res.data) {
        useQuestionsStore
          .getState()
          .updateQuestion(res.data as unknown as StoreQuestion);
      }
    },
  });
};
