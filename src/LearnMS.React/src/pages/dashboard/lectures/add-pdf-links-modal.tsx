import {
  AddLecturePdfLinkItem,
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
import { toast } from "@/components/ui/use-toast";
import { Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";

type PdfLinkRow = {
  id: string;
  title: string;
  url: string;
};

type AddPdfLinksModalProps = {
  onClose: () => void;
  courseId: string;
  lectureId: string;
};

const createRow = (): PdfLinkRow => ({
  id: crypto.randomUUID(),
  title: "",
  url: "",
});

const AddPdfLinksModal: React.FC<AddPdfLinksModalProps> = ({
  onClose,
  courseId,
  lectureId,
}) => {
  const [rows, setRows] = useState<PdfLinkRow[]>([createRow()]);
  const addPdfLinksMutation = useAddLecturePdfLinksMutation();

  const updateRow = (id: string, field: "title" | "url", value: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.id !== id)));
  };

  const onSubmit = () => {
    const data: AddLecturePdfLinkItem[] = [];

    for (const row of rows) {
      const parsed = AddLecturePdfLinkItem.safeParse({
        title: row.title.trim(),
        url: row.url.trim(),
      });

      if (!parsed.success) {
        toast({
          title: "Invalid PDF link",
          description: parsed.error.errors[0]?.message ?? "Check title and Google Drive link",
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
            title: "PDF links added",
            description: res.message,
          });
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl text-foreground">
        <DialogHeader>
          <DialogTitle>Add PDF links</DialogTitle>
          <DialogDescription>
            Paste Google Drive links with a title for each PDF. They will appear
            in this lecture and in Files for reuse.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="space-y-3 rounded-lg border border-border/60 p-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">PDF {index + 1}</p>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={rows.length === 1}
                  onClick={() => removeRow(row.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`pdf-title-${row.id}`}>Title</Label>
                <Input
                  id={`pdf-title-${row.id}`}
                  placeholder="e.g. Chapter 1 notes"
                  value={row.title}
                  onChange={(e) => updateRow(row.id, "title", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`pdf-url-${row.id}`}>Google Drive link</Label>
                <Input
                  id={`pdf-url-${row.id}`}
                  placeholder="https://drive.google.com/..."
                  value={row.url}
                  onChange={(e) => updateRow(row.id, "url", e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setRows((prev) => [...prev, createRow()])}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add another PDF
        </Button>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={addPdfLinksMutation.isPending}
          >
            {addPdfLinksMutation.isPending ? "Saving..." : "Save PDFs"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddPdfLinksModal;
