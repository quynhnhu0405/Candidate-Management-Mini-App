import axios, { AxiosError } from "axios";
import i18n from "@/i18n";

// The API always returns errors as { error: { code, message } }.
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30_000,
});

// Convert any axios failure into an ApiError with a readable message.
http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: { code?: string; message?: string } }>) => {
    const apiError = error.response?.data?.error;
    if (apiError?.message) {
      return Promise.reject(new ApiError(apiError.message, apiError.code ?? "UNKNOWN", error.response?.status));
    }
    if (error.code === "ECONNABORTED") {
      return Promise.reject(new ApiError("The request timed out. Please try again.", "TIMEOUT"));
    }
    if (!error.response) {
      return Promise.reject(
        new ApiError("Cannot reach the server. Check your connection and try again.", "NETWORK_ERROR"),
      );
    }
    return Promise.reject(new ApiError("Something went wrong. Please try again.", "UNKNOWN", error.response.status));
  },
);

// Message to show the user, in the selected language. Known error codes (errors.*) are translated;
// unknown codes (e.g. a specific validation message from the server) fall back to the server text.
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return i18n.t(`errors.${error.code}`, { defaultValue: error.message });
  return i18n.t("errors.UNKNOWN");
}
