import { ApiResponse, api } from "@/api";
import { getGetStudentLecturesQueryKey } from "@/generated/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type UpdateLectureEnrollmentExpirationRequest = {
  expiresAt: string;
};

export const useUpdateLectureEnrollmentExpiration = () => {
  const qc = useQueryClient();

  return useMutation<
    ApiResponse<object | null>,
    unknown,
    {
      studentId: string;
      lectureId: string;
      data: UpdateLectureEnrollmentExpirationRequest;
      search?: string;
      page?: number;
      pageSize?: number;
    }
  >({
    mutationFn: ({ studentId, lectureId, data }) =>
      api
        .patch(
          `/api/students/${studentId}/lectures/${lectureId}/enrollment`,
          data
        )
        .then((res) => res.data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: getGetStudentLecturesQueryKey(variables.studentId, {
          page: variables.page,
          pageSize: variables.pageSize,
          search: variables.search,
        }),
      });
    },
  });
};
