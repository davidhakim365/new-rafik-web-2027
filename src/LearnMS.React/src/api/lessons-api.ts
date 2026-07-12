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

export type LessonVideoUploadPolicy = {
  videoId: string;
  policy: string;
  key: string;
  xAmzSignature: string;
  xAmzAlgorithm: string;
  xAmzDate: string;
  xAmzCredential: string;
  uploadLink: string;
};

export type LessonVideoStatus = {
  videoId: string;
  status: string;
};

export async function getLessonVideoUploadPolicy({
  courseId,
  lectureId,
  lessonId,
}: {
  courseId: string;
  lectureId: string;
  lessonId: string;
}) {
  const response = await api.post<ApiResponse<LessonVideoUploadPolicy>>(
    `/api/courses/${courseId}/lectures/${lectureId}/lessons/${lessonId}/video/policy`
  );
  return response.data.data;
}

export async function validateLessonVideoStatus({
  courseId,
  lectureId,
  lessonId,
}: {
  courseId: string;
  lectureId: string;
  lessonId: string;
}) {
  const response = await api.post<ApiResponse<LessonVideoStatus>>(
    `/api/courses/${courseId}/lectures/${lectureId}/lessons/${lessonId}/video/validate`
  );
  return response.data.data;
}

export async function saveLessonVideoId({
  courseId,
  lectureId,
  lessonId,
  videoId,
}: {
  courseId: string;
  lectureId: string;
  lessonId: string;
  videoId: string;
}) {
  const response = await api.patch<ApiResponse<{}>>(
    `/api/courses/${courseId}/lectures/${lectureId}/lessons/${lessonId}`,
    { videoId }
  );
  return response.data;
}

export async function uploadVideoToVdoCipher({
  file,
  policy,
  onProgress,
}: {
  file: File;
  policy: LessonVideoUploadPolicy;
  onProgress: (percent: number) => void;
}) {
  const formData = new FormData();
  formData.append("policy", policy.policy);
  formData.append("key", policy.key);
  formData.append("x-amz-signature", policy.xAmzSignature);
  formData.append("x-amz-algorithm", policy.xAmzAlgorithm);
  formData.append("x-amz-date", policy.xAmzDate);
  formData.append("x-amz-credential", policy.xAmzCredential);
  formData.append("success_action_status", "201");
  formData.append("success_action_redirect", "");
  formData.append("file", file, file.name);

  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 201 || xhr.status === 204 || xhr.status === 200) {
        resolve();
        return;
      }
      reject(new Error(`Upload failed with status ${xhr.status}`));
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload. Check your internet connection."));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload was cancelled."));
    });

    xhr.open("POST", policy.uploadLink);
    xhr.send(formData);
  });
}

export async function waitForVideoReady({
  courseId,
  lectureId,
  lessonId,
  maxAttempts = 60,
  intervalMs = 5000,
}: {
  courseId: string;
  lectureId: string;
  lessonId: string;
  maxAttempts?: number;
  intervalMs?: number;
}) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await validateLessonVideoStatus({
      courseId,
      lectureId,
      lessonId,
    });

    if (status.status.toLowerCase() === "ready") {
      return status;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Video is still processing. Please check back in a few minutes.");
}
