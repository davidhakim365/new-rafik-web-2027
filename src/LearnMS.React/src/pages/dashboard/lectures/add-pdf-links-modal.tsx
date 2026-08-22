import {
  getGoogleDriveAuthorizeUrl,
  getGoogleDriveStatus,
  saveGoogleSharedDriveId,
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

  const refreshDriveStatus = useCallback(async () => {
    try {
      const res = await getGoogleDriveStatus();
      setDriveStatus(res.data);
      if (res.data.sharedDriveId) {
        setSharedDriveId(res.data.sharedDriveId);
      }
    } catch {
      setDriveStatus(null);
    }
  }, []);

  useEffect(() => {
    refreshDriveStatus();

    const onMessage = (event: MessageEvent) => {
      if (event.data === "drive-connected") {
        refreshDriveStatus();
        toast({
          title: "Google Drive connected",
          description: "You can upload PDFs from this lecture now.",
        });
      }
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
    window.open(url, "google-drive-oauth", "width=520,height=720");
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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl text-foreground">
        <DialogHeader>
          <DialogTitle>Add PDF</DialogTitle>
          <DialogDescription>
            Upload a PDF from here. It is sent to your Google Drive as a public
            viewer link, so students can open it without requesting access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-lg border border-border/60 p-3">
          <p className="text-sm font-medium">Google Drive</p>
          {driveStatus?.canUpload ? (
            <p className="text-sm text-muted-foreground">
              {driveStatus.mode === "user" && driveStatus.email
                ? `Connected as ${driveStatus.email}. Uploads use your Drive storage.`
                : driveStatus.sharedDriveId
                  ? `Uploading to Shared Drive ${driveStatus.sharedDriveId}.`
                  : "Google Drive is ready for uploads."}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Google service accounts cannot store files. Connect your Google
              account, or paste a Shared Drive ID after adding the service
              account as Content manager.
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Shared Drive ID or folder URL"
              value={sharedDriveId}
              onChange={(e) => setSharedDriveId(e.target.value)}
              disabled={busy || savingDrive}
            />
            <Button
              type="button"
              variant="outline"
              disabled={busy || savingDrive || !sharedDriveId.trim()}
              onClick={saveSharedDrive}
            >
              {savingDrive ? "Saving..." : "Save Drive"}
            </Button>
          </div>
          {driveStatus?.canConnectOAuth && (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={connectGoogleDrive}
            >
              Connect Google account
            </Button>
          )}
        </div>

        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 transition-colors ${
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
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="font-medium">
              {isDragActive ? "Drop PDFs here" : "Drag & drop PDFs, or browse"}
            </p>
            <p className="text-sm text-muted-foreground">PDF only, up to 50MB each</p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            Choose PDFs
          </Button>
        </div>

        {rows.length > 0 && (
          <div className="max-h-[32vh] space-y-3 overflow-y-auto pr-1">
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
          <div className="max-h-[24vh] space-y-3 overflow-y-auto pr-1">
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

        <DialogFooter>
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
