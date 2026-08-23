import { ApiResponse, api } from "@/api";

export type GoogleDriveStatus = {
  canUpload: boolean;
  canConnectOAuth: boolean;
  email?: string | null;
  sharedDriveId?: string | null;
  mode: "user" | "shared-drive" | "impersonate" | "none" | string;
  refreshToken?: string | null;
};

export async function getGoogleDriveStatus() {
  const res = await api.get<ApiResponse<GoogleDriveStatus>>(
    "/api/google-drive/status"
  );
  return res.data;
}

export async function getGoogleDriveAuthorizeUrl() {
  const res = await api.get<ApiResponse<{ url: string }>>(
    "/api/google-drive/authorize-url"
  );
  return res.data;
}

export async function saveGoogleSharedDriveId(sharedDriveId: string) {
  const res = await api.post<ApiResponse<GoogleDriveStatus>>(
    "/api/google-drive/shared-drive",
    { sharedDriveId }
  );
  return res.data;
}
