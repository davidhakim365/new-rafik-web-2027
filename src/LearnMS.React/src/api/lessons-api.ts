import { ApiResponse, api } from "@/api";
import { getGetProfileQueryKey } from "@/generated/api";
import { LessonDetails } from "@/types/lessons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

export const useLessonsQuery = ({
  courseId,
  lectureId,
  lessonId,
}: {
  courseId: string;
  lectureId: string;
  lessonId: string;
}) => {
  return useQuery<ApiResponse<LessonDetails>>({
    queryKey: ["lesson", { id: lessonId }],
    queryFn: () => {
      return api
        .get(
          `/api/courses/${courseId}/lectures/${lectureId}/lessons/${lessonId}`
        )
        .then((res) => res.data);
    },
  });
};

export const UpdateLessonRequest = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  expirationHours: z.coerce
    .number()
    .min(0, { message: "Expiration hours must be greater than or equal 0" })
    .max(24, { message: "Expiration hours must be less than 24" }),
  renewalPrice: z.coerce
    .number()
    .min(0, { message: "Renewal Price is greater than 0" }),
  description: z.string(),
  videoId: z.string().min(0),
});

export type UpdateLessonRequest = z.infer<typeof UpdateLessonRequest>;

export const useUpdateLessonMutation = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<{}>,
    {},
    {
      courseId: string;
      lectureId: string;
      lessonId: string;
      data: UpdateLessonRequest;
    }
  >({
    onSuccess: (_, { courseId, lectureId, lessonId }) => {
      qc.invalidateQueries({ queryKey: ["course", { id: courseId }] });
      qc.invalidateQueries({ queryKey: ["lecture", { id: lectureId }] });
      qc.invalidateQueries({ queryKey: ["lesson", { id: lessonId }] });
      qc.invalidateQueries({ queryKey: ["courses"] });
    },
    mutationFn: ({ courseId, lectureId, lessonId, data }) =>
      api
        .patch(
          `/api/courses/${courseId}/lectures/${lectureId}/lessons/${lessonId}`,
          data
        )
        .then((res) => res.data),
  });
};




export const useDeleteLessonMutation = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<{}>,
    {},
    { courseId: string; lectureId: string; lessonId: string }
  >({
    onSuccess: (_, { courseId, lectureId }) => {
      qc.invalidateQueries({ queryKey: ["course", { id: courseId }] });
      qc.invalidateQueries({
        queryKey: ["lecture", { id: lectureId, courseId }],
      });
      qc.invalidateQueries({ queryKey: ["courses"] });
    },
    mutationFn: ({ courseId, lectureId, lessonId }) =>
      api
        .delete(
          `/api/courses/${courseId}/lectures/${lectureId}/lessons/${lessonId}`
        )
        .then((res) => res.data),
  });
};

export const useStartLessonMutation = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<{}>,
    {},
    { courseId: string; lectureId: string; lessonId: string }
  >({
    onSuccess: (_, { courseId, lectureId, lessonId }) => {
      qc.invalidateQueries({ queryKey: ["course", { id: courseId }] });
      qc.invalidateQueries({
        queryKey: ["lesson", { id: lessonId }],
      });
      qc.invalidateQueries({
        queryKey: ["lecture", { id: lectureId, courseId }],
      });
      qc.invalidateQueries({ queryKey: ["courses"] });
    },
    mutationFn: ({ courseId, lectureId, lessonId }) =>
      api
        .post(
          `/api/courses/${courseId}/lectures/${lectureId}/lessons/${lessonId}/start`
        )
        .then((res) => res.data),
  });
};

export const useRenewLessonMutation = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<{}>,
    {},
    { courseId: string; lectureId: string; lessonId: string }
  >({
    onSuccess: (_, { courseId, lectureId, lessonId }) => {
      qc.invalidateQueries({ queryKey: ["course", { id: courseId }] });
      qc.invalidateQueries({
        queryKey: ["lesson", { id: lessonId }],
      });
      qc.invalidateQueries({
        queryKey: ["lecture", { id: lectureId, courseId }],
      });
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: getGetProfileQueryKey() });
    },
    mutationFn: ({ courseId, lectureId, lessonId }) =>
      api
        .post(
          `/api/courses/${courseId}/lectures/${lectureId}/lessons/${lessonId}/renew`
        )
        .then((res) => res.data),
  });
};
