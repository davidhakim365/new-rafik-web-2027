import { api } from "@/api";

export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<{ status: boolean; data: { url: string }; message: string }>(
    "/api/uploads/cloudinary",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data.data.url;
}
