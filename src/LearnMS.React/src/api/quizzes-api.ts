import { ApiResponse, api } from "@/api";
import { QuizDashboard, QuizResult } from "@/types/quiz";
import { InlineQuestionPayload } from "@/types/assessment";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

export type UpdateQuizRequest = {
  id?: string;
  title: string;
  description: string;
  resultType: "Hidden" | "ResultOnly" | "ResultWithAnswer";
  passCount: number;
  expiryMinutes: number;
  questions: string[];
  newQuestions: InlineQuestionPayload[];
};

export const useUpdateQuizMutation = () => {
  const qc = useQueryClient();

  return useMutation<
    ApiResponse<QuizDashboard>,
    {},
    {
      courseId: string;
      lectureId: string;
      data: UpdateQuizRequest;
    }
  >({
    mutationFn: ({ courseId, lectureId, data }) => {
      return api
        .put(`/api/courses/${courseId}/lectures/${lectureId}/quizzes`, data)
        .then((res) => res.data);
    },
    onSuccess: (res, { lectureId, courseId }) => {
      qc.invalidateQueries({
        queryKey: ["lecture", { id: lectureId, courseId }],
      });
      qc.invalidateQueries({ queryKey: ["course", { id: courseId }] });
      qc.invalidateQueries({ queryKey: ["quiz", { id: res.data.id }] });
      qc.invalidateQueries({ queryKey: ["questions"] });
    },
  });
};

export const useGetQuizQuery = ({
  id,
  courseId,
  lectureId,
  enabled,
}: {
  id: string;
  courseId: string;
  lectureId: string;
  enabled: boolean;
}) => {
  return useQuery<ApiResponse<QuizDashboard & { expiryMinutes?: number }>>({
    queryKey: ["quiz", { id }],
    enabled,
    queryFn: () =>
      api
        .get(`/api/courses/${courseId}/lectures/${lectureId}/quizzes/${id}`)
        .then((res) => res.data),
  });
};

export const useDeleteQuizMutation = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<{}>,
    {},
    { courseId: string; lectureId: string; quizId: string }
  >({
    mutationFn: ({ courseId, lectureId, quizId }) =>
      api
        .delete(
          `/api/courses/${courseId}/lectures/${lectureId}/quizzes/${quizId}`
        )
        .then((res) => res.data),
    onSuccess: (_, { lectureId, courseId }) => {
      qc.invalidateQueries({
        queryKey: ["lecture", { id: lectureId, courseId }],
      });
      qc.invalidateQueries({ queryKey: ["course", { id: courseId }] });
    },
  });
};

export const useGetStudentQuizQuery = ({
  id,
  courseId,
  lectureId,
}: {
  id: string;
  courseId: string;
  lectureId: string;
}) => {
  return useQuery<ApiResponse<QuizResult>>({
    queryKey: ["quiz", { id, courseId, lectureId }],
    queryFn: () =>
      api
        .get(`/api/courses/${courseId}/lectures/${lectureId}/quizzes/${id}/`)
        .then((res) => res.data),
  });
};

const SubmitQuizRequest = z.object({
  questionAnswers: z.array(
    z.object({
      questionId: z.string().uuid(),
      answer: z.string().min(1),
    })
  ),
});
export type SubmitQuizRequest = z.infer<typeof SubmitQuizRequest>;

export const useSubmitQuizMutation = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<{}>,
    {},
    {
      courseId: string;
      lectureId: string;
      quizId: string;
      body: SubmitQuizRequest;
    }
  >({
    mutationFn: ({ courseId, lectureId, quizId, body }) =>
      api
        .post(
          `/api/courses/${courseId}/lectures/${lectureId}/quizzes/${quizId}/submit`,
          body
        )
        .then((x) => x.data),
    onSuccess: (_, { lectureId, courseId, quizId }) => {
      qc.invalidateQueries({
        queryKey: ["quiz", { id: quizId, lectureId, courseId }],
      });
      qc.invalidateQueries({
        queryKey: ["lecture", { id: lectureId, courseId }],
      });
      qc.invalidateQueries({ queryKey: ["lesson"] });
      qc.invalidateQueries({ queryKey: ["course", { id: courseId }] });
    },
  });
};
