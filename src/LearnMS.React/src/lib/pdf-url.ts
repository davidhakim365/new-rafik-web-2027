export type PdfAssetRef = {
  id: string;
  url?: string | null;
};

const driveFileIdFromPath =
  /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i;
const driveFileIdFromQuery = /[?&]id=([a-zA-Z0-9_-]+)/i;

export function toGoogleDrivePreviewUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.includes("/preview")) return trimmed;

  const pathMatch = trimmed.match(driveFileIdFromPath);
  if (pathMatch?.[1]) {
    return `https://drive.google.com/file/d/${pathMatch[1]}/preview`;
  }

  if (trimmed.includes("drive.google.com")) {
    const queryMatch = trimmed.match(driveFileIdFromQuery);
    if (queryMatch?.[1]) {
      return `https://drive.google.com/file/d/${queryMatch[1]}/preview`;
    }
  }

  return trimmed;
}

export function getPdfViewerUrl(asset: PdfAssetRef): string {
  if (asset.url && /drive\.google\.com/i.test(asset.url)) {
    return toGoogleDrivePreviewUrl(asset.url);
  }

  return `/api/assets/${asset.id}`;
}
