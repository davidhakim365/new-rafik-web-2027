import { toast } from "@/lib/utils";
import Axios, { AxiosError, AxiosRequestConfig } from "axios";

export const AXIOS_INSTANCE = Axios.create(); // use your own URL here or environment variable

AXIOS_INSTANCE.interceptors.request.use((config) => {
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

AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response?.status >= 400) {
      const data = error.response.data as any;

      if (error.response.status === 401) {
        localStorage.removeItem("token");
      }

      toast({
        title: "Couldn't load, please try again",
        description: data.message,
        variant: "destructive",
      });

      throw new ApiError(data.code, data.message);
    }



    return Promise.reject(error);
  }
);

// add a second `options` argument here if you want to pass extra options to each generated query

export class ApiError extends Error {
  public status: false = false;
  constructor(public code: string, public message: string) {
    super(message);
  }
}

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const source = Axios.CancelToken.source();
  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-ignore
  promise.cancel = () => {
    source.cancel("Query was cancelled");
  };

  return promise;
};

export type ErrorType<Error> = AxiosError<Error> | ApiError;
