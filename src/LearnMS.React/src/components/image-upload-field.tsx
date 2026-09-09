import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  imageFileFromClipboard,
  imageFileFromClipboardEvent,
  imageFileFromDropEvent,
} from "@/lib/clipboard-image";
import { uploadToImgBb } from "@/lib/imgbb-upload";
import { cn } from "@/lib/utils";
import { ClipboardPaste, ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

type Props = {
  value?: string | null;
  onChange: (url: string) => void;
  className?: string;
  disabled?: boolean;
  /** Compact layout for choice thumbnails. */
  compact?: boolean;
  /**
   * While mounted, Cmd/Ctrl+V with a copied image uploads here
   * unless another image field is hovered or focused.
   */
  capturePaste?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
};

type PasteTarget = {
  id: string;
  capturePaste: boolean;
  handleFile: (file: File) => void;
};

const pasteTargets = new Map<string, PasteTarget>();
let hoveredTargetId: string | null = null;
let focusedTargetId: string | null = null;
let lastTargetId: string | null = null;
let documentPasteBound = false;

function rememberTarget(id: string) {
  lastTargetId = id;
}

function activePasteTarget(): PasteTarget | undefined {
  if (hoveredTargetId) return pasteTargets.get(hoveredTargetId);
  if (focusedTargetId) return pasteTargets.get(focusedTargetId);
  if (lastTargetId) return pasteTargets.get(lastTargetId);
  for (const target of pasteTargets.values()) {
    if (target.capturePaste) return target;
  }
  return undefined;
}

function isTypingIntoText(event: ClipboardEvent) {
  const el = event.target as HTMLElement | null;
  if (!el) return false;
  const typing =
    el.tagName === "TEXTAREA" ||
    el.isContentEditable ||
    (el.tagName === "INPUT" &&
      (el as HTMLInputElement).type !== "file" &&
      (el as HTMLInputElement).type !== "hidden");
  if (!typing) return false;
  return Boolean(event.clipboardData?.getData("text/plain"));
}

function onDocumentPaste(event: ClipboardEvent) {
  const file = imageFileFromClipboardEvent(event);
  if (!file) return;
  if (isTypingIntoText(event)) return;
  const target = activePasteTarget();
  if (!target) return;
  event.preventDefault();
  target.handleFile(file);
}

function bindDocumentPaste() {
  if (documentPasteBound) return;
  document.addEventListener("paste", onDocumentPaste);
  documentPasteBound = true;
}

function unbindDocumentPasteIfIdle() {
  if (pasteTargets.size > 0) return;
  document.removeEventListener("paste", onDocumentPaste);
  documentPasteBound = false;
  hoveredTargetId = null;
  focusedTargetId = null;
  lastTargetId = null;
}

/** Upload an image via ImgBB. Supports file picker, drag-and-drop, and clipboard paste. */
export function ImageUploadField({
  value,
  onChange,
  className,
  disabled,
  compact,
  capturePaste,
  onUploadingChange,
}: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const handleFileRef = useRef<(file: File) => Promise<void> | void>(() => {});

  const setBusy = useCallback(
    (busy: boolean) => {
      setUploading(busy);
      onUploadingChange?.(busy);
    },
    [onUploadingChange]
  );

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file || disabled) return;
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file",
          description: "Please choose or paste an image.",
          variant: "destructive",
        });
        return;
      }

      setBusy(true);
      try {
        const url = await uploadToImgBb(file);
        onChange(url);
      } catch (e) {
        toast({
          title: "Upload failed",
          description: e instanceof Error ? e.message : "Could not upload image",
          variant: "destructive",
        });
      } finally {
        setBusy(false);
      }
    },
    [disabled, onChange, setBusy]
  );

  handleFileRef.current = handleFile;

  useEffect(() => {
    const target: PasteTarget = {
      id,
      capturePaste: Boolean(capturePaste),
      handleFile: (file) => {
        void handleFileRef.current(file);
      },
    };
    pasteTargets.set(id, target);
    bindDocumentPaste();
    if (capturePaste) rememberTarget(id);
    return () => {
      pasteTargets.delete(id);
      if (hoveredTargetId === id) hoveredTargetId = null;
      if (focusedTargetId === id) focusedTargetId = null;
      if (lastTargetId === id) lastTargetId = null;
      unbindDocumentPasteIfIdle();
    };
  }, [id, capturePaste]);

  const pasteFromClipboard = async () => {
    try {
      const file = await imageFileFromClipboard();
      if (!file) {
        toast({
          title: "No image in clipboard",
          description: "Copy a screenshot or image, then paste here.",
        });
        return;
      }
      await handleFile(file);
    } catch {
      toast({
        title: "Could not read clipboard",
        description: "Copy the image, click this box, then press Ctrl/Cmd+V.",
      });
    }
  };

  const busy = disabled || uploading;

  return (
    <div
      className={cn("space-y-3", className)}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          void handleFile(f);
          e.target.value = "";
        }}
      />

      <div
        ref={dropZoneRef}
        tabIndex={busy ? -1 : 0}
        aria-label="Paste, drop, or choose an image"
        onMouseEnter={() => {
          hoveredTargetId = id;
          rememberTarget(id);
        }}
        onMouseLeave={() => {
          if (hoveredTargetId === id) hoveredTargetId = null;
        }}
        onFocus={() => {
          focusedTargetId = id;
          rememberTarget(id);
        }}
        onBlur={() => {
          if (focusedTargetId === id) focusedTargetId = null;
        }}
        onPaste={(e) => {
          const file = imageFileFromClipboardEvent(e);
          if (!file) return;
          e.preventDefault();
          e.stopPropagation();
          void handleFile(file);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = imageFileFromDropEvent(e);
          void handleFile(file ?? undefined);
        }}
        className={cn(
          "rounded-lg border border-dashed outline-none transition-colors",
          compact ? "p-3" : "p-4",
          dragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/30 bg-muted/20",
          busy ? "opacity-60" : "cursor-pointer hover:border-primary/60",
          "focus-visible:ring-2 focus-visible:ring-ring"
        )}
        onClick={() => {
          dropZoneRef.current?.focus();
        }}
        onDoubleClick={() => {
          if (!busy) inputRef.current?.click();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!busy) inputRef.current?.click();
          }
        }}
      >
        {value ? (
          <div className="relative inline-block max-w-full">
            <img
              src={value}
              alt="Preview"
              className={cn(
                "max-w-full rounded-md border object-contain bg-background",
                compact ? "max-h-20" : "max-h-48"
              )}
            />
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute -right-2 -top-2 h-7 w-7"
              disabled={busy}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-center text-muted-foreground",
              compact ? "min-h-16 text-xs" : "min-h-24 text-sm"
            )}
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading…
              </span>
            ) : (
              <>
                <ImageIcon className={compact ? "h-4 w-4" : "h-5 w-5"} />
                <span>
                  {compact
                    ? "Paste (Ctrl/Cmd+V) or drop an image"
                    : "Copy a photo, then paste it here (Ctrl/Cmd+V). You can also drop an image or choose a file."}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={(e) => {
            e.stopPropagation();
            void pasteFromClipboard();
          }}
        >
          <ClipboardPaste className="mr-1.5 h-4 w-4" />
          Paste from clipboard
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          <Upload className="mr-1.5 h-4 w-4" />
          Choose file
        </Button>
      </div>
    </div>
  );
}
