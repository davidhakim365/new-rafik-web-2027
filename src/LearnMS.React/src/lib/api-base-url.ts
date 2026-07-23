/** Absolute API origin for Capacitor / production mobile builds. Empty = same-origin (Vite proxy in web dev). */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  if (!raw || !raw.trim()) return "";
  return raw.replace(/\/$/, "");
}

/** Resolve `/api/...` paths against VITE_API_URL when set (needed for img/href in Capacitor). */
export function resolveApiUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return pathOrUrl;
  if (/^https?:\/\//i.test(pathOrUrl) || pathOrUrl.startsWith("blob:")) {
    return pathOrUrl;
  }
  const base = getApiBaseUrl();
  if (!base) return pathOrUrl;
  if (pathOrUrl.startsWith("/")) return `${base}${pathOrUrl}`;
  return `${base}/${pathOrUrl}`;
}
