import { ApiResponse, api } from "@/api";
import {
  getGetLectureQueryKey,
  getGetLectureStudentsQueryKey,
  getGetProfileQueryKey,
  getGetStudentCourseDetailsQueryKey,
} from "@/generated/api";
import { LectureDetails, SingleLectureStudent } from "@/types/lectures";
import { PageList } from "@/types/page-list";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

export const useLectureQuery = ({
  lectureId,
  courseId,
}: {
  lectureId: string;
  courseId: string;
}) => {
  return useQuery<ApiResponse<LectureDetails>>({
    queryKey: ["lecture", { id: lectureId, courseId }],
    queryFn: () =>
      api
        .get(`/api/courses/${courseId}/lectures/${lectureId}`)
        .then((res) => res.data),
  });
};

export const AddLectureRequest = z.object({
  title: z.string().min(1, { message: "Title is required" }),
});

export type AddLectureRequest = z.infer<typeof AddLectureRequest>;

export const useAddLectureMutation = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<{}>,
    {},
    { courseId: string; data: AddLectureRequest }
  >({
    mutationFn: ({ courseId, data }) =>
      api
        .post(`/api/courses/${courseId}/lectures`, data)
        .then((res) => res.data),
    onSuccess: (_, { courseId }) => {
      qc.invalidateQueries({ queryKey: ["course", { id: courseId }] });
      qc.invalidateQueries({ queryKey: ["courses"] });
    },
  });
};

export const UpdateLectureRequest = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string(),
  price: z.coerce.number().min(0, { message: "Price must be greater than 0" }),
  renewalPrice: z.coerce
    .number()
    .min(0, { message: "Renewal Price is greater than 0" }),
  expirationDays: z.coerce
    .number()
    .min(0, { message: "Expiration days must be greater than 0" }),
  imageUrl: z.string(),
  homeworkVideoUrl: z.string().optional().or(z.literal("")),
  chooseHomeworkFormId: z.string().optional().or(z.literal("")),
});

export type UpdateLectureRequest = z.infer<typeof UpdateLectureRequest>;

export const useUpdateLectureMutation = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<{}>,
    {},
    { courseId: string; lectureId: string; data: UpdateLectureRequest }
  >({
    onSuccess: (_, { lectureId }) => {
      qc.invalidateQueries({ queryKey: ["lecture", { id: lectureId }] });
      qc.invalidateQueries({ queryKey: ["courses"] });
    },
    mutationFn: ({ lectureId, courseId, data }) =>
      api
        .patch(`/api/courses/${courseId}/lectures/${lectureId}`, data)
        .then((res) => res.data),
  });
};

export const usePublishingLectureMutation = () => {
  const qc = useQueryClient();

  return useMutation<
    ApiResponse<{}>,
    {},
    { courseId: string; lectureId: string; publish: boolean }
  >({
    mutationFn: ({ courseId, lectureId, publish }) =>
      api
        .post(
          `/api/courses/${courseId}/lectures/${lectureId}/${
            publish ? "publish" : "unpublish"
          }`
        )
        .then((res) => res.data),
    onSuccess: (_, { lectureId, courseId }) => {
      qc.invalidateQueries({
        queryKey: ["lecture", { id: lectureId, courseId }],
      });
      qc.invalidateQueries({ queryKey: ["course", { id: courseId }] });
      qc.invalidateQueries({ queryKey: ["courses"] });
    },
  });
};

export const useDeleteLectureMutation = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<{}>,
    {},
    { lectureId: string; courseId: string }
  >({
    onSuccess: (_, { lectureId, courseId }) => {
      qc.invalidateQueries({
        queryKey: ["lecture", { id: lectureId, courseId }],
      });
      qc.invalidateQueries({ queryKey: ["course", { id: courseId }] });
      qc.invalidateQueries({ queryKey: ["courses"] });
    },
    mutationFn: ({ lectureId, courseId }) =>
      api
        .delete(`/api/courses/${courseId}/lectures/${lectureId}`)
        .then((res) => res.data),
  });
};

export const useBuyLectureMutation = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<{}>,
    Error,
    { lectureId: string; courseId: string }
  >({
    throwOnError: false,
    onSuccess: (_, { lectureId, courseId }) => {
      qc.invalidateQueries({
        queryKey: ["lecture", { id: lectureId, courseId }],
      });
      qc.invalidateQueries({ queryKey: ["course", { id: courseId }] });
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: getGetProfileQueryKey() });
      qc.invalidateQueries({
        queryKey: getGetStudentCourseDetailsQueryKey(courseId),
      });
    },
    mutationFn: ({ lectureId, courseId }) =>
      api
        .post(`/api/courses/${courseId}/lectures/${lectureId}/buy`)
        .then((res) => res.data),
  });
};

export const useGetLectureStudentsQuery = ({
  lectureId,
  courseId,
  page = 1,
  pageSize = 10,
  search,
}: {
  lectureId: string;
  courseId: string;
  page: number;

  pageSize: number;
  search: string | undefined;
}) => {
  return useQuery<ApiResponse<PageList<SingleLectureStudent>>>({
    queryKey: [
      "lecture-students",
      { id: lectureId, courseId, page, pageSize, search },
    ],
    queryFn: () =>
      api
        .get(
          `/api/courses/${courseId}/lectures/${lectureId}/students?page=${page}&pageSize=${pageSize}&search=${search}`
        )
        .then((res) => res.data),
  });
};

export const ChangeHomeworkScoreRequest = z.object({
  score: z.coerce.number().min(0, { message: "Score must be greater than 0" }),
});

export type ChangeHomeworkScoreRequest = z.infer<
  typeof ChangeHomeworkScoreRequest
>;


export const ChangeQuizScoreRequest = z.object({
  score: z.coerce.number().min(0, { message: "Score must be greater than 0" }),
});

export type ChangeQuizScoreRequest = z.infer<
  typeof ChangeQuizScoreRequest
>;

export const useChangeHomeworkScoreMutation = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<{}>,
    {},
    {
      lectureId: string;
      courseId: string;
      studentId: string;
      data: ChangeHomeworkScoreRequest;
    }
  >({
    onSuccess: (_, { lectureId, courseId }) => {
      qc.invalidateQueries({
        queryKey: ["lecture-students", { id: lectureId, courseId }],
      });
    },
    mutationFn: ({ lectureId, courseId, studentId, data }) =>
      api
        .put(
          `/api/courses/${courseId}/lectures/${lectureId}/students/${studentId}/homework`,
          data
        )
        .then((res) => res.data),
  });
};


export const useChangeQuizScoreMutation = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<{}>,
    {},
    {
      lectureId: string;
      courseId: string;
      studentId: string;
      data: ChangeQuizScoreRequest;
    }
  >({
    onSuccess: (_, { lectureId, courseId }) => {
      qc.invalidateQueries({
        queryKey: ["lecture-students", { id: lectureId, courseId }],
      });
    },
    mutationFn: ({ lectureId, courseId, studentId, data }) =>
      api
        .put(
          `/api/courses/${courseId}/lectures/${lectureId}/students/${studentId}/quiz`,
          data
        )
        .then((res) => res.data),
  });
};

export type SyncChooseHomeworkScoresResult = {
  matched: number;
  updated: number;
  skippedNoScore: number;
  unmatchedCodes: string[];
};

export const useSyncChooseHomeworkScoresMutation = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<SyncChooseHomeworkScoresResult>,
    Error,
    { lectureId: string; courseId: string }
  >({
    mutationFn: ({ lectureId, courseId }) =>
      api
        .post(
          `/api/courses/${courseId}/lectures/${lectureId}/choose-homework/sync`
        )
        .then((res) => res.data),
    onSuccess: async (_, { lectureId, courseId }) => {
      await Promise.all([
        qc.invalidateQueries({
          queryKey: getGetLectureStudentsQueryKey(courseId, lectureId),
        }),
        // Prefix match: also refresh paged/search variants of the students table.
        qc.invalidateQueries({
          queryKey: [`/api/courses/${courseId}/lectures/${lectureId}/students`],
        }),
        qc.invalidateQueries({
          queryKey: getGetLectureQueryKey(courseId, lectureId),
        }),
        qc.invalidateQueries({
          queryKey: ["lecture-students", { id: lectureId, courseId }],
        }),
      ]);
      await qc.refetchQueries({
        queryKey: [`/api/courses/${courseId}/lectures/${lectureId}/students`],
        type: "active",
      });
    },
  });
};


export const useUpdateLectureAssetsMutation = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<{}>,
    {},
    {
      lectureId: string;
      courseId: string;
      data: string[];
    }
  >({
    mutationFn: ({ lectureId, courseId, data }) =>
      api
        .put(`/api/courses/${courseId}/lectures/${lectureId}/assets`, data)
        .then((res) => res.data),
    onSuccess: (_, { lectureId, courseId }) => {
      qc.invalidateQueries({
        queryKey: ["lecture", { id: lectureId, courseId }],
      });
    },
  });
};

export const AddLecturePdfLinkItem = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  url: z
    .string()
    .url({ message: "Enter a valid PDF link" })
    .min(1, { message: "PDF link is required" }),
});

export type AddLecturePdfLinkItem = z.infer<typeof AddLecturePdfLinkItem>;

export async function uploadLecturePdf({
  courseId,
  lectureId,
  file,
  title,
  onProgress,
}: {
  courseId: string;
  lectureId: string;
  file: File;
  title?: string;
  onProgress: (percent: number) => void;
}) {
  const formData = new FormData();
  formData.append("file", file, file.name);
  if (title?.trim()) {
    formData.append("title", title.trim());
  }

  const token = localStorage.getItem("token");
  const deviceKey = localStorage.getItem("deviceKey");

  return new Promise<{ id: string; name: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const body = JSON.parse(xhr.responseText) as {
            data?: { asset?: { id?: string; name?: string } };
            message?: string;
          };
          const asset = body.data?.asset;
          if (!asset?.id) {
            reject(new Error("Upload succeeded but no PDF was returned."));
            return;
          }
          resolve({ id: asset.id, name: asset.name ?? file.name });
        } catch {
          reject(new Error("Upload succeeded but the server response was invalid."));
        }
        return;
      }

      try {
        const err = JSON.parse(xhr.responseText) as { message?: string };
        reject(new Error(err.message || `Upload failed with status ${xhr.status}`));
      } catch {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Could not reach the server during upload."));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload was cancelled."));
    });

    xhr.open(
      "POST",
      `/api/courses/${courseId}/lectures/${lectureId}/pdfs`
    );

    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }
    if (deviceKey) {
      xhr.setRequestHeader("DeviceKey", deviceKey);
    }

    xhr.send(formData);
  });
}

export const useAddLecturePdfLinksMutation = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<{}>,
    {},
    {
      lectureId: string;
      courseId: string;
      data: AddLecturePdfLinkItem[];
    }
  >({
    mutationFn: ({ lectureId, courseId, data }) =>
      api
        .post(`/api/courses/${courseId}/lectures/${lectureId}/pdf-links`, data)
        .then((res) => res.data),
    onSuccess: (_, { lectureId, courseId }) => {
      qc.invalidateQueries({
        queryKey: ["lecture", { id: lectureId, courseId }],
      });
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: getGetLectureQueryKey(courseId, lectureId) });
    },
  });
};

export const useReorderLectureItemsMutation = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<{}>,
    Error,
    {
      lectureId: string;
      courseId: string;
      itemIds: string[];
    }
  >({
    mutationFn: ({ lectureId, courseId, itemIds }) =>
      api
        .put(`/api/courses/${courseId}/lectures/${lectureId}/items/order`, {
          itemIds,
        })
        .then((res) => res.data),
    onSuccess: (_, { lectureId, courseId }) => {
      qc.invalidateQueries({
        queryKey: ["lecture", { id: lectureId, courseId }],
      });
      qc.invalidateQueries({
        queryKey: getGetLectureQueryKey(courseId, lectureId),
      });
      qc.invalidateQueries({ queryKey: ["course", { id: courseId }] });
    },
  });
};
