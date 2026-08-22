import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getPdfViewerUrl, type PdfAssetRef } from "@/lib/pdf-url";
import { useState, type ReactNode } from "react";

type PdfViewerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  src: string;
};

export function PdfViewerDialog({
  open,
  onOpenChange,
  title,
  src,
}: PdfViewerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] max-w-5xl flex-col overflow-hidden p-4">
        <DialogHeader>
          <DialogTitle className="pr-8 break-words">{title}</DialogTitle>
        </DialogHeader>
        <iframe
          src={src}
          title={title}
          className="min-h-0 w-full flex-1 rounded-md border border-border/60 bg-background"
        />
      </DialogContent>
    </Dialog>
  );
}

type PdfOpenButtonProps = {
  asset: PdfAssetRef & { name?: string | null };
  className?: string;
  children: ReactNode;
};

export function PdfOpenButton({
  asset,
  className,
  children,
}: PdfOpenButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>
      <PdfViewerDialog
        open={open}
        onOpenChange={setOpen}
        title={asset.name || "PDF"}
        src={getPdfViewerUrl(asset)}
      />
    </>
  );
}
