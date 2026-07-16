import { api } from "@/api";

export async function uploadToImgBb(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<{ status: boolean; data: { url: string }; message: string }>(
    "/api/uploads/imgbb",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data.data.url;
}
