import { ApiResponse, api } from "@/api";
import { PageList } from "@/types/page-list";
import { Student } from "@/types/students";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

export const useStudentsQuery = ({
  page,
  pageSize,
  search,
}: {
  page: number;
  pageSize: number;
  search: string | undefined;
}) => {
  return useQuery<ApiResponse<PageList<Student>>>({
    queryKey: ["students", { page, pageSize, search }],
    queryFn: () =>
      api
        .get(`/api/students?page=${page}&pageSize=${pageSize}&search=${search}`)
        .then((res) => res.data),
  });
};

export const CreateStudentRequest = z
  .object({
    email: z.string().email().min(1, { message: "Email is required" }),
    school: z.string().min(1, { message: "School is required" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    fullName: z.string().min(3, { message: "Name is required" }),
    phoneNumber: z.string(),
    parentPhoneNumber: z.string(),
    studentCode: z.string().optional(),
    mode: z.enum(["online", "offline"], {
      errorMap: () => ({ message: "Study mode is required" }),
    }),
    level: z.enum(["Level0", "Level1", "Level2", "Level3", "Level4"]),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        path: ["confirmPassword"],
        code: "custom",
        message: "Passwords do not match",
      });
    }

    const phoneDigits = data.phoneNumber.replace(/\D/g, "");
    const parentPhoneDigits = data.parentPhoneNumber.replace(/\D/g, "");
    if (phoneDigits && phoneDigits === parentPhoneDigits) {
      ctx.addIssue({
        path: ["parentPhoneNumber"],
        code: "custom",
        message: "Parent phone must be different from student phone",
      });
    }

    if (data.mode === "offline") {
      if (!data.studentCode || data.studentCode.length < 6) {
        ctx.addIssue({
          path: ["studentCode"],
          code: "custom",
          message: "ID must be at least 6 characters",
        });
      }
    }
  });

export type CreateStudentRequest = z.infer<typeof CreateStudentRequest>;

export const useCreateStudentMutation = () => {
  const qc = useQueryClient();

  return useMutation<ApiResponse<{}>, {}, CreateStudentRequest>({
    throwOnError: false,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
    },
    mutationFn: ({ mode: _mode, ...data }) =>
      api.post("/api/students", data).then((res) => res.data),
  });
};

export const AddStudentCreditRequest = z.object({
  amount: z.coerce
    .number()
    .min(-10000, { message: "Amount must be greater than 0" }),
});

export type AddStudentCreditRequest = z.infer<typeof AddStudentCreditRequest>;

export const addStudentCreditMutation = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<{}>,
    {},
    { id: string; data: AddStudentCreditRequest }
  >({
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
    },
    mutationFn: ({ id, data }) =>
      api.post(`/api/students/${id}/credit`, data).then((res) => res.data),
  });
};

export const useDeleteStudentMutation = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<{}>, {}, { id: string }>({
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
    },
    mutationFn: ({ id }) =>
      api.delete(`/api/students/${id}`).then((res) => res.data),
  });
};

export const useStudentQuery = ({ id }: { id: string }) => {
  return useQuery<ApiResponse<Student>>({
    queryKey: ["student", { id }],
    queryFn: () => api.get(`/api/students/${id}`).then((res) => res.data),
  });
};

export const UpdateStudentRequest = z
  .object({
    schoolName: z.string().min(1, { message: "School is required" }),
    fullName: z.string().min(3, { message: "Name is required" }),
    phoneNumber: z.string(),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    parentPhoneNumber: z.string(),
    studentCode: z.string(),
    level: z.enum(["Level0", "Level1", "Level2", "Level3", "Level4"]),
  })
  .superRefine((data, ctx) => {
    const phoneDigits = data.phoneNumber.replace(/\D/g, "");
    const parentPhoneDigits = data.parentPhoneNumber.replace(/\D/g, "");
    if (phoneDigits && phoneDigits === parentPhoneDigits) {
      ctx.addIssue({
        path: ["parentPhoneNumber"],
        code: "custom",
        message: "Parent phone must be different from student phone",
      });
    }
  });

export type UpdateStudentRequest = z.infer<typeof UpdateStudentRequest>;

export const useUpdateStudentMutation = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<{}>,
    {},
    { id: string; data: UpdateStudentRequest }
  >({
    throwOnError: false,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
    },
    mutationFn: ({ id, data }) =>
      api.patch(`/api/students/${id}`, data).then((res) => res.data),
  });
};
