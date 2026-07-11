import { ApiResponse, api } from "@/api";
import {
  ExamResult,
  UpdateExamRequest,
  UpdateExamResponse,
} from "@/types/exams";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useUpdateExamMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<UpdateExamResponse>,
    Error,
    { data: UpdateExamRequest; courseId: string }
  >({
    mutationFn: ({ data, courseId }) =>
      api.put(`/api/courses/${courseId}/exams`, data).then((res) => res.data),
    onSuccess: ({ data }, { courseId }) => {
      queryClient.invalidateQueries({
        queryKey: ["course", { id: courseId }],
      });
      queryClient.invalidateQueries({
        queryKey: ["exam", { courseId, id: data.id }],
      });
    },
  });
};

export const useGetExamQuery = ({
  courseId,
  enabled,
  id,
}: {
  courseId: string;
  enabled: boolean;
  id: string;
}) => {
  return useQuery<ApiResponse<ExamResult>>({
    queryKey: ["exam", { courseId, id }],
    queryFn: () =>
      api.get(`/api/courses/${courseId}/exams/${id}`).then((res) => res.data),
    enabled,
  });
};

export const useDeleteExamMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<{}>, Error, { courseId: string; id: string }>({
    mutationFn: ({ courseId, id }) =>
      api
        .delete(`/api/courses/${courseId}/exams/${id}`)
        .then((res) => res.data),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({
        queryKey: ["course", { id: courseId }],
      });
    },
  });
};

export const useBuyExamMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<{}>, Error, { courseId: string; id: string }>({
    mutationFn: ({ courseId, id }) =>
      api
        .post(`/api/courses/${courseId}/exams/${id}/buy`)
        .then((res) => res.data),
    onSuccess: (_, { courseId, id }) => {
      queryClient.invalidateQueries({
        queryKey: ["course", { id: courseId }],
      });
      queryClient.invalidateQueries({
        queryKey: ["exam", { id, courseId }],
      });
    },
  });
};
