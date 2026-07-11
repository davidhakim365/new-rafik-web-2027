import { toast } from "@/components/ui/use-toast";
import { ApiError } from "@/lib/axiosCustomInstant";
import axios from "axios";

export class ApiResponse<TData> {
  status: true = true;
  constructor(public message: string, public data: TData) {}
}

export const api = axios.create();

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const deviceKey = localStorage.getItem("deviceKey");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (deviceKey) {
    config.headers.DeviceKey = deviceKey;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response?.status >= 400) {
      const data = error.response.data as any;

      if (error.response.status === 401) {
        localStorage.removeItem("token");
      }

      toast({
        title: "Error",
        description: data.message,
        variant: "destructive",
      });

      throw new ApiError(data.code, data.message);
    }

    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });

    return Promise.reject(error);
  }
);
