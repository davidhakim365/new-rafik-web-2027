import { ApiResponse, api } from "@/api";
import { toast } from "@/components/ui/use-toast";
import { getGetProfileQueryKey } from "@/generated/api";
import { components } from "@/lib/api";
import { ApiError } from "@/lib/axiosCustomInstant";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

export const LoginRequest = z.object({
  email: z.string().email({ message: "You must enter a valid email" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 digits" }),
});

export type LoginRequest = z.infer<typeof LoginRequest>;
export type LoginResponse = {
  id: string;
  token: string;
};

export const RegisterRequest = z
  .object({
    level: z.enum(["Level0", "Level1", "Level2", "Level3"], {
      errorMap: () => ({ message: "Level is required" }),
    }),
    fullName: z.string().min(1, { message: "Name is required" }),
    phoneNumber: z.string(),
    parentPhoneNumber: z.string(),
    studentCode: z.string().optional(), // validate manually below
    school: z.string().min(1, { message: "School is required" }),
    email: z.string().email({ message: "Email is required" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    mode: z.enum(["online", "offline"], {
      errorMap: () => ({ message: "Study mode is required" }),
    }),
  })
  .superRefine((data, ctx) => {
    // Check matching passwords
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        path: ["confirmPassword"],
        code: "custom",
        message: "Passwords do not match",
      });
    }

    // Only require and validate studentCode if offline
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
export type RegisterRequest = z.infer<typeof RegisterRequest>;
export type RegisterResponse = {
  id: string;
};

export function useLoginMutation() {
  const qrc = useQueryClient();
  return useMutation<
    ApiResponse<components["schemas"]["LoginResult"]>,
    ApiError,
    LoginRequest
  >({
    mutationKey: ["login"],
    throwOnError: false,
    mutationFn: (data) =>
      api.post("/api/auth/login", data).then((res) => res.data),
    onSuccess: (res) => {
      if (!res.status) return;
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      localStorage.setItem("token", res.data.token);
      if (res.data.deviceKey)
        localStorage.setItem("deviceKey", res.data.deviceKey);
      qrc.invalidateQueries({ queryKey: ["account"] });
    },
  });
}

export function useRegisterMutation() {
  const qrc = useQueryClient();
  return useMutation<ApiResponse<RegisterResponse>, ApiError, RegisterRequest>({
    mutationKey: ["register"],
    throwOnError: false,

    mutationFn: (data) =>
      api.post("/api/auth/students/register", data).then((res) => res.data),
    onSuccess: (res) => {
      toast({
        title: "Account Created Successfully",
        description: `registered successfully with id ${res.data.id}`,
      });
      qrc.invalidateQueries({ queryKey: ["account"] });
    },
  });
}

export function useLogoutMutation() {
  const qrc = useQueryClient();
  return useMutation({
    mutationKey: ["logout"],
    mutationFn: async () => {},
    onSuccess: () => {
      localStorage.removeItem("token");
      qrc.invalidateQueries({ queryKey: getGetProfileQueryKey() });
    },
  });
}

export const ForgotPasswordRequest = z.object({
  email: z.string().email().min(1, { message: "Email is required" }),
});

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequest>;

export const useForgotPasswordMutation = () => {
  return useMutation<ApiResponse<{}>, {}, ForgotPasswordRequest>({
    mutationKey: ["forgot-password"],
    mutationFn: (data) =>
      api.post("/api/auth/forgot-password", data).then((res) => res.data),
  });
};

export const ResetPasswordRequest = z
  .object({
    token: z.string().min(1, { message: "Token is required" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequest>;

export const useResetPasswordMutation = () => {
  return useMutation<ApiResponse<{}>, {}, ResetPasswordRequest>({
    mutationKey: ["reset-password"],
    mutationFn: (data) =>
      api.post("/api/auth/reset-password", data).then((res) => res.data),
  });
};
