import { ApiResponse, api } from "@/api";
import { QuestionPageList } from "@/types/question";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type CreateQuestionRequest = {
  description: string;
  text: string;
  image?: File;
  correctAnswer?: string;
  answers?: string[];
  value?: number;
  tolerance?: number;
};

export const useAddQuestionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<{}>, Error, CreateQuestionRequest>({
    mutationFn: (data) => {
      const formData = new FormData();

      formData.append("text", data.text);
      formData.append("description", data.description);
      if (data.correctAnswer) {
        formData.append("multipleCorrect", data.correctAnswer);
        data.answers!.forEach((o, i) => {
          formData.append(`multipleChoices[${i}]`, o);
        });
      } else if (data.value && data.tolerance) {
        formData.append("valueCorrect", data.value.toString());
        formData.append("valueTolerance", data.tolerance.toString());
      } else {
        throw new Error(
          "Either correct answer or value and tolerance is required"
        );
      }
      if (data.image) {
        formData.append("image", data.image);
      }

      return api.post("/api/questions", formData).then((res) => res.data);
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
          `/api/questions?page=${page}&pageSize=${pageSize}&search=${search}`
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
