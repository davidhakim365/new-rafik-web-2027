import {
  getGoogleDriveAuthorizeUrl,
  getGoogleDriveFolders,
  getGoogleDriveStatus,
  saveGoogleDriveFolder,
  saveGoogleSharedDriveId,
  type GoogleDriveFolder,
  type GoogleDriveStatus,
} from "@/api/google-drive-api";
import {
  AddLecturePdfLinkItem,
  uploadLecturePdf,
  useAddLecturePdfLinksMutation,
} from "@/api/lectures-api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import { getGetLectureQueryKey } from "@/generated/api";
import { FileText, Plus, Trash2, Upload } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";

type UploadRow = {
  id: string;
  file: File;
  title: string;
  progress: number;
  status: "ready" | "uploading" | "done" | "error";
  error?: string;
};

type LinkRow = {
  id: string;
  title: string;
  url: string;
};

type AddPdfLinksModalProps = {
  onClose: () => void;
  courseId: string;
  lectureId: string;
};

const createLinkRow = (): LinkRow => ({
  id: crypto.randomUUID(),
  title: "",
  url: "",
});

const AddPdfLinksModal: React.FC<AddPdfLinksModalProps> = ({
  onClose,
  courseId,
  lectureId,
}) => {
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [linkRows, setLinkRows] = useState<LinkRow[]>([]);
  const [showLinks, setShowLinks] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const addPdfLinksMutation = useAddLecturePdfLinksMutation();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [driveStatus, setDriveStatus] = useState<GoogleDriveStatus | null>(null);
  const [sharedDriveId, setSharedDriveId] = useState("");
  const [savingDrive, setSavingDrive] = useState(false);
  const [folders, setFolders] = useState<GoogleDriveFolder[]>([]);
  const [folderId, setFolderId] = useState("root");
  const [folderQuery, setFolderQuery] = useState("");
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [savingFolder, setSavingFolder] = useState(false);

  const loadFolders = useCallback(async () => {
    setLoadingFolders(true);
    try {
      const res = await getGoogleDriveFolders();
      setFolders(res.data ?? []);
    } catch {
      setFolders([]);
      toast({
        title: "Could not load Drive folders",
        description: "Reconnect Google account, then try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingFolders(false);
    }
  }, []);

  const refreshDriveStatus = useCallback(async () => {
    try {
      const res = await getGoogleDriveStatus();
      setDriveStatus(res.data);
      if (res.data.sharedDriveId) {
        setSharedDriveId(res.data.sharedDriveId);
      }
      setFolderId(res.data.folderId || "root");
      if (res.data.canUpload) {
        void loadFolders();
      }
    } catch {
      setDriveStatus(null);
    }
  }, [loadFolders]);

  useEffect(() => {
    refreshDriveStatus();

    const onMessage = (event: MessageEvent) => {
      const data = event.data as
        | string
        | { type?: string; refreshToken?: string }
        | undefined;
      const connected =
        data === "drive-connected" ||
        (typeof data === "object" && data?.type === "drive-connected");
      if (!connected) return;

      const token =
        typeof data === "object" && data.refreshToken
          ? data.refreshToken
          : undefined;
      if (token) {
        setDriveStatus((prev) => ({
          canUpload: true,
          canConnectOAuth: prev?.canConnectOAuth ?? true,
          email: prev?.email ?? null,
          sharedDriveId: prev?.sharedDriveId ?? null,
          mode: prev?.mode && prev.mode !== "none" ? prev.mode : "user",
          refreshToken: token,
          folderId: prev?.folderId ?? null,
          folderName: prev?.folderName ?? null,
        }));
      }
      void refreshDriveStatus();
      toast({
        title: "Google Drive connected",
        description: token
          ? "Copy the refresh token shown below into env so you never connect again."
          : "You can upload PDFs from this lecture now.",
      });
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [refreshDriveStatus]);

  const connectGoogleDrive = async () => {
    const res = await getGoogleDriveAuthorizeUrl();
    const url = res.data?.url;
    if (!url) {
      toast({
        title: "Cannot connect Google Drive",
        description: "Add DriveClientId and DriveClientSecret, or use a Shared Drive ID.",
        variant: "destructive",
      });
      return;
    }
    window.open(url, "google-drive-oauth", "width=640,height=780");
  };

  const saveSharedDrive = async () => {
    if (!sharedDriveId.trim()) return;
    setSavingDrive(true);
    try {
      const res = await saveGoogleSharedDriveId(sharedDriveId.trim());
      setDriveStatus(res.data);
      toast({
        title: "Shared Drive saved",
        description: "PDFs will upload there with a public viewer link.",
      });
    } finally {
      setSavingDrive(false);
    }
  };

  const saveUploadFolder = async (nextFolderId: string) => {
    const folder =
      folders.find((item) => item.id === nextFolderId) ??
      ({
        id: nextFolderId,
        name: nextFolderId === "root" ? "My Drive" : nextFolderId,
        path: nextFolderId === "root" ? "My Drive (root)" : nextFolderId,
      } satisfies GoogleDriveFolder);
    setFolderId(nextFolderId);
    setSavingFolder(true);
    try {
      const res = await saveGoogleDriveFolder(folder.id, folder.path);
      setDriveStatus(res.data);
      setFolderId(res.data.folderId || "root");
      toast({
        title: "Upload folder saved",
        description: `PDFs will upload to ${folder.path}.`,
      });
    } finally {
      setSavingFolder(false);
    }
  };

  const refreshLecture = () => {
    qc.invalidateQueries({
      queryKey: ["lecture", { id: lectureId, courseId }],
    });
    qc.invalidateQueries({
      queryKey: getGetLectureQueryKey(courseId, lectureId),
    });
    qc.invalidateQueries({ queryKey: ["assets"] });
  };

  const addFiles = useCallback((files: File[]) => {
    const pdfs = files.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    );

    if (pdfs.length === 0) {
      toast({
        title: "PDF required",
        description: "Please choose one or more PDF files.",
        variant: "destructive",
      });
      return;
    }

    setRows((prev) => [
      ...prev,
      ...pdfs.map((file) => ({
        id: crypto.randomUUID(),
        file,
        title: file.name.replace(/\.pdf$/i, ""),
        progress: 0,
        status: "ready" as const,
      })),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: addFiles,
    accept: { "application/pdf": [".pdf"] },
    multiple: true,
    disabled: isUploading,
    noClick: true,
  });

  const updateTitle = (id: string, title: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, title } : row))
    );
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const updateLinkRow = (id: string, field: "title" | "url", value: string) => {
    setLinkRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const onSubmit = async () => {
    const pendingUploads = rows.filter((row) => row.status !== "done");
    const pendingLinks = showLinks
      ? linkRows.filter((row) => row.title.trim() || row.url.trim())
      : [];

    if (pendingUploads.length > 0 && !driveStatus?.canUpload) {
      toast({
        title: "Connect Google Drive first",
        description:
          "Click Connect Google account and sign in with your Gmail. Env vars only enable that button.",
        variant: "destructive",
      });
      return;
    }

    if (pendingUploads.length === 0 && pendingLinks.length === 0) {
      toast({
        title: "No PDFs selected",
        description: "Choose a PDF file or paste a public link.",
        variant: "destructive",
      });
      return;
    }

    if (pendingUploads.length > 0) {
      setIsUploading(true);
      let failed = false;

      for (const row of pendingUploads) {
        setRows((prev) =>
          prev.map((item) =>
            item.id === row.id
              ? { ...item, status: "uploading", progress: 0, error: undefined }
              : item
          )
        );

        try {
          await uploadLecturePdf({
            courseId,
            lectureId,
            file: row.file,
            title: row.title,
            onProgress: (percent) => {
              setRows((prev) =>
                prev.map((item) =>
                  item.id === row.id ? { ...item, progress: percent } : item
                )
              );
            },
          });

          setRows((prev) =>
            prev.map((item) =>
              item.id === row.id
                ? { ...item, status: "done", progress: 100 }
                : item
            )
          );
        } catch (error) {
          failed = true;
          const message =
            error instanceof Error ? error.message : "Upload failed";
          setRows((prev) =>
            prev.map((item) =>
              item.id === row.id
                ? { ...item, status: "error", error: message }
                : item
            )
          );
        }
      }

      setIsUploading(false);
      refreshLecture();

      if (failed) {
        toast({
          title: "Some PDFs failed to upload",
          description: "Fix the failed files and try again.",
          variant: "destructive",
        });
        if (pendingLinks.length === 0) return;
      } else if (pendingLinks.length === 0) {
        refreshLecture();
        toast({
          title: "PDF uploaded to Google Drive",
          description: "Students can open the viewer link without requesting access.",
        });
        onClose();
        return;
      }
    }

    if (pendingLinks.length > 0) {
      const data: AddLecturePdfLinkItem[] = [];

      for (const row of pendingLinks) {
        const parsed = AddLecturePdfLinkItem.safeParse({
          title: row.title.trim(),
          url: row.url.trim(),
        });

        if (!parsed.success) {
          toast({
            title: "Invalid PDF link",
            description:
              parsed.error.errors[0]?.message ?? "Check title and link",
            variant: "destructive",
          });
          return;
        }

        data.push(parsed.data);
      }

      addPdfLinksMutation.mutate(
        { courseId, lectureId, data },
        {
          onSuccess: (res) => {
            toast({
              title: "PDFs added",
              description: res.message,
            });
            onClose();
          },
        }
      );
    }
  };

  const busy = isUploading || addPdfLinksMutation.isPending;
  const visibleFolders = folders.filter(
    (folder) =>
      folder.id === folderId ||
      folder.id === "root" ||
      !folderQuery.trim() ||
      folder.path.toLowerCase().includes(folderQuery.toLowerCase()) ||
      folder.name.toLowerCase().includes(folderQuery.toLowerCase())
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100%-1rem)] max-w-lg flex-col gap-3 overflow-hidden p-4 text-foreground sm:p-6">
        <DialogHeader className="shrink-0 space-y-1 pr-6 text-left">
          <DialogTitle>Add PDF</DialogTitle>
          <DialogDescription>
            Upload to the Google Drive folder you pick. Students open it without
            requesting access.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">

        <div className="space-y-2 rounded-lg border border-border/60 p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">Google Drive</p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={connectGoogleDrive}
            >
              {driveStatus?.canUpload ? "Reconnect" : "Connect Gmail"}
            </Button>
          </div>
          {driveStatus?.canUpload ? (
            <p className="text-xs text-muted-foreground">
              {driveStatus.refreshTokenFromEnv
                ? "Using the refresh token from env. Host restarts stay connected — do not reconnect unless Google revoked that token."
                : driveStatus.mode === "user" && driveStatus.email
                  ? `Connected as ${driveStatus.email}`
                  : driveStatus.sharedDriveId
                    ? `Shared Drive ${driveStatus.sharedDriveId}`
                    : "Ready for uploads."}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Connect Gmail once, then choose the folder for PDFs.
            </p>
          )}
          {driveStatus?.refreshToken && !driveStatus.refreshTokenFromEnv && (
            <details className="rounded-md bg-muted/40 p-2">
              <summary className="cursor-pointer text-xs text-muted-foreground">
                Refresh token
              </summary>
              <div className="mt-2 space-y-2">
                <p className="max-h-14 overflow-y-auto break-all font-mono text-[11px] leading-snug">
                  GoogleForms__DriveRefreshToken={driveStatus.refreshToken}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await navigator.clipboard.writeText(
                      `GoogleForms__DriveRefreshToken=${driveStatus.refreshToken}`
                    );
                    toast({
                      title: "Refresh token copied",
                      description: "Paste it into your env, then restart the API.",
                    });
                  }}
                >
                  Copy refresh token
                </Button>
              </div>
            </details>
          )}
          {driveStatus?.canUpload && (
            <div className="space-y-2">
              <Label htmlFor="drive-folder">Upload folder</Label>
              <Input
                id="drive-folder-search"
                placeholder="Search folders"
                value={folderQuery}
                onChange={(e) => setFolderQuery(e.target.value)}
                disabled={busy || loadingFolders || savingFolder}
                className="h-9"
              />
              <select
                id="drive-folder"
                size={1}
                className="flex h-9 max-h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={folderId}
                disabled={busy || loadingFolders || savingFolder}
                onChange={(e) => {
                  void saveUploadFolder(e.target.value);
                }}
              >
                {visibleFolders.length === 0 ? (
                  <option value={folderId}>
                    {loadingFolders
                      ? "Loading folders..."
                      : driveStatus.folderName || "My Drive (root)"}
                  </option>
                ) : (
                  visibleFolders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.path}
                    </option>
                  ))
                )}
              </select>
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs text-muted-foreground">
                  {savingFolder
                    ? "Saving folder..."
                    : loadingFolders
                      ? "Loading folders..."
                      : folders.find((folder) => folder.id === folderId)?.path ??
                        driveStatus.folderName ??
                        "My Drive (root)"}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 shrink-0 px-2"
                  disabled={busy || loadingFolders || savingFolder}
                  onClick={() => {
                    void loadFolders();
                  }}
                >
                  Refresh
                </Button>
              </div>
            </div>
          )}
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">
              Shared Drive (optional)
            </summary>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Shared Drive ID or folder URL"
                value={sharedDriveId}
                onChange={(e) => setSharedDriveId(e.target.value)}
                disabled={busy || savingDrive}
                className="h-9"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy || savingDrive || !sharedDriveId.trim()}
                onClick={saveSharedDrive}
              >
                {savingDrive ? "Saving..." : "Save"}
              </Button>
            </div>
          </details>
        </div>

        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-3 transition-colors ${
            isDragActive
              ? "border-primary bg-primary/10"
              : "border-border/70 hover:border-primary/60"
          } ${busy ? "opacity-60" : ""}`}
        >
          <input {...getInputProps()} />
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              addFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
          <Upload className="h-6 w-6 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">
              {isDragActive ? "Drop PDFs here" : "Drag PDFs here, or browse"}
            </p>
            <p className="text-xs text-muted-foreground">PDF only, up to 50MB each</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            Choose PDFs
          </Button>
        </div>

        {rows.length > 0 && (
          <div className="max-h-36 space-y-3 overflow-y-auto pr-1">
            {rows.map((row) => (
              <div
                key={row.id}
                className="space-y-2 rounded-lg border border-border/60 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-red-500" />
                    <p className="truncate text-sm text-muted-foreground">
                      {row.file.name} · {(row.file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => removeRow(row.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`pdf-title-${row.id}`}>Title</Label>
                  <Input
                    id={`pdf-title-${row.id}`}
                    value={row.title}
                    disabled={busy}
                    onChange={(e) => updateTitle(row.id, e.target.value)}
                  />
                </div>
                {(row.status === "uploading" || row.status === "done") && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {row.status === "done"
                          ? "Uploaded to Google Drive"
                          : row.progress < 100
                            ? `Uploading... ${row.progress}%`
                            : "Saving to Google Drive..."}
                      </span>
                      <span>{row.progress}%</span>
                    </div>
                    <Progress value={row.progress} className="h-2" />
                  </div>
                )}
                {row.status === "error" && (
                  <p className="text-sm text-destructive">{row.error}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          className="text-left text-sm text-muted-foreground underline-offset-2 hover:underline"
          onClick={() => {
            setShowLinks((prev) => {
              const next = !prev;
              if (next && linkRows.length === 0) {
                setLinkRows([createLinkRow()]);
              }
              return next;
            });
          }}
        >
          {showLinks ? "Hide link option" : "Or paste a public PDF link"}
        </button>

        {showLinks && (
          <div className="max-h-40 space-y-3 overflow-y-auto pr-1">
            {linkRows.map((row, index) => (
              <div
                key={row.id}
                className="space-y-3 rounded-lg border border-border/60 p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Link {index + 1}</p>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={busy || linkRows.length === 1}
                    onClick={() =>
                      setLinkRows((prev) =>
                        prev.length === 1 ? prev : prev.filter((r) => r.id !== row.id)
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`pdf-link-title-${row.id}`}>Title</Label>
                  <Input
                    id={`pdf-link-title-${row.id}`}
                    placeholder="e.g. Chapter 1 notes"
                    value={row.title}
                    disabled={busy}
                    onChange={(e) => updateLinkRow(row.id, "title", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`pdf-link-url-${row.id}`}>PDF link</Label>
                  <Input
                    id={`pdf-link-url-${row.id}`}
                    placeholder="https://..."
                    value={row.url}
                    disabled={busy}
                    onChange={(e) => updateLinkRow(row.id, "url", e.target.value)}
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={busy}
              onClick={() => setLinkRows((prev) => [...prev, createLinkRow()])}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add another link
            </Button>
          </div>
        )}

        </div>

        <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t pt-3 sm:space-x-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={busy}>
            {isUploading
              ? "Uploading..."
              : addPdfLinksMutation.isPending
                ? "Saving..."
                : "Add PDFs"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddPdfLinksModal;
