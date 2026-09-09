export function namedClipboardImage(file: File): File {
  const ext = (file.type.split("/")[1] || "png").replace("jpeg", "jpg");
  const name =
    file.name && file.name !== "image.png"
      ? file.name
      : `pasted-image.${ext}`;
  return new File([file], name, {
    type: file.type || "image/png",
    lastModified: Date.now(),
  });
}

export function imageFileFromClipboardEvent(event: {
  clipboardData: DataTransfer | null;
}): File | null {
  const data = event.clipboardData;
  if (!data) return null;

  for (const item of Array.from(data.items)) {
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) return namedClipboardImage(file);
    }
  }

  for (const file of Array.from(data.files)) {
    if (file.type.startsWith("image/")) return namedClipboardImage(file);
  }

  return null;
}

export function imageFileFromDropEvent(event: {
  dataTransfer: DataTransfer | null;
}): File | null {
  const files = event.dataTransfer?.files;
  if (!files) return null;
  for (const file of Array.from(files)) {
    if (file.type.startsWith("image/")) return file;
  }
  return null;
}

export async function imageFileFromClipboard(): Promise<File | null> {
  if (!navigator.clipboard?.read) return null;
  const items = await navigator.clipboard.read();
  for (const item of items) {
    const type = item.types.find((t) => t.startsWith("image/"));
    if (!type) continue;
    const blob = await item.getType(type);
    return namedClipboardImage(
      new File([blob], "pasted-image", { type: blob.type || "image/png" })
    );
  }
  return null;
}
