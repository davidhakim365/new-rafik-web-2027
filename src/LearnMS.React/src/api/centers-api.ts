import { api } from "@/api";
import {
  getGetLectureStatisticsQueryKey,
  getGetLectureStudentsQueryKey,
} from "@/generated/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type CenterDto = {
  id: string;
  name: string;
  isActive: boolean;
};

type ApiSuccess<T> = {
  data: T;
  message?: string;
};

export type SingleLectureStudentWithCenter = {
  centerId?: string | null;
  centerName?: string | null;
};

const CENTERS_QUERY_KEY = ["/api/centers"] as const;
export const SELECTED_CENTER_STORAGE_KEY = "offlineAttendanceCenterId";

export const getCenters = () =>
  api.get<ApiSuccess<CenterDto[]>>("/api/centers").then((res) => res.data);

export const createCenter = (name: string) =>
  api
    .post<ApiSuccess<CenterDto>>("/api/centers", { name })
    .then((res) => res.data);

export const attendLectureAtCenter = (
  courseId: string,
  lectureId: string,
  code: string,
  centerId: string
) =>
  api
    .post<ApiSuccess<object | null>>(
      `/api/courses/${courseId}/lectures/${lectureId}/students/${code}/attend`,
      { centerId }
    )
    .then((res) => res.data);

export const toggleLectureAttendanceAtCenter = (
  courseId: string,
  lectureId: string,
  studentId: string,
  centerId?: string
) =>
  api
    .post<ApiSuccess<object | null>>(
      `/api/courses/${courseId}/lectures/${lectureId}/students/${studentId}/toggle-attendance`,
      centerId ? { centerId } : {}
    )
    .then((res) => res.data);

export function getLectureStatisticsParams(
  lectureId: string,
  centerId?: string | null
) {
  return {
    lectureId,
    ...(centerId ? { centerId } : {}),
  };
}

export function useGetCenters() {
  return useQuery({
    queryKey: CENTERS_QUERY_KEY,
    queryFn: getCenters,
  });
}

export function useCreateCenter() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createCenter(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CENTERS_QUERY_KEY });
    },
  });
}

export function useAttendLectureAtCenter() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (vars: {
      courseId: string;
      lectureId: string;
      code: string;
      centerId: string;
    }) =>
      attendLectureAtCenter(
        vars.courseId,
        vars.lectureId,
        vars.code,
        vars.centerId
      ),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: getGetLectureStudentsQueryKey(vars.courseId, vars.lectureId),
      });
      qc.invalidateQueries({
        queryKey: getGetLectureStatisticsQueryKey(
          getLectureStatisticsParams(vars.lectureId, vars.centerId)
        ),
      });
    },
  });
}

export function useToggleLectureAttendanceAtCenter() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (vars: {
      courseId: string;
      lectureId: string;
      studentId: string;
      centerId?: string;
    }) =>
      toggleLectureAttendanceAtCenter(
        vars.courseId,
        vars.lectureId,
        vars.studentId,
        vars.centerId
      ),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: getGetLectureStudentsQueryKey(vars.courseId, vars.lectureId),
      });
      qc.invalidateQueries({
        queryKey: getGetLectureStatisticsQueryKey(
          getLectureStatisticsParams(vars.lectureId, vars.centerId)
        ),
      });
    },
  });
}

export function readSelectedCenterId(): string | null {
  return localStorage.getItem(SELECTED_CENTER_STORAGE_KEY);
}

export function writeSelectedCenterId(centerId: string | null) {
  if (centerId) {
    localStorage.setItem(SELECTED_CENTER_STORAGE_KEY, centerId);
  } else {
    localStorage.removeItem(SELECTED_CENTER_STORAGE_KEY);
  }
}
