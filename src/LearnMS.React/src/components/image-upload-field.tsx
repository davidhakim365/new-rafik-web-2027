import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { uploadToImgBb } from "@/lib/imgbb-upload";
import { ImageIcon, Loader2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  value?: string | null;
  onChange: (url: string) => void;
  className?: string;
  disabled?: boolean;
};

/** Upload an image via ImgBB (same path as quiz question images). */
export function ImageUploadField({
  value,
  onChange,
  className,
  disabled,
}: Props) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please choose an image file.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
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
      setUploading(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="file"
          accept="image/*"
          disabled={disabled || uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            void handleFile(f);
            e.target.value = "";
          }}
        />
        {uploading && (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading…
          </span>
        )}
      </div>

      {value ? (
        <div className="relative inline-block max-w-full">
          <img
            src={value}
            alt="Preview"
            className="max-h-48 max-w-full rounded-lg border object-contain bg-background"
          />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute -right-2 -top-2 h-7 w-7"
            disabled={disabled || uploading}
            onClick={() => onChange("")}
            aria-label="Remove image"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <div className="flex h-28 items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground">
          <ImageIcon className="h-4 w-4" />
          Choose an image to upload
        </div>
      )}
    </div>
  );
}
