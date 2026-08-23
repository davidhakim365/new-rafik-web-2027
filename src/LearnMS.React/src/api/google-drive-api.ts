import { ApiResponse, api } from "@/api";

export type GoogleDriveStatus = {
  canUpload: boolean;
  canConnectOAuth: boolean;
  email?: string | null;
  sharedDriveId?: string | null;
  mode: "user" | "shared-drive" | "impersonate" | "none" | string;
  refreshToken?: string | null;
  folderId?: string | null;
  folderName?: string | null;
};

export type GoogleDriveFolder = {
  id: string;
  name: string;
  path: string;
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

export async function getGoogleDriveFolders() {
  const res = await api.get<ApiResponse<GoogleDriveFolder[]>>(
    "/api/google-drive/folders"
  );
  return res.data;
}

export async function saveGoogleDriveFolder(folderId: string, folderName: string) {
  const res = await api.post<ApiResponse<GoogleDriveStatus>>(
    "/api/google-drive/folder",
    { folderId, folderName }
  );
  return res.data;
}
