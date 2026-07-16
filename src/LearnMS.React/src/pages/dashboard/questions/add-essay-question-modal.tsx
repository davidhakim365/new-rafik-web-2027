import { useAddQuestionMutation } from "@/api/questions-api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { uploadToImgBb } from "@/lib/imgbb-upload";
import { toast } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const FormSchema = z.object({
  description: z.string().min(1),
  text: z.string().min(1),
  image: z.string().optional(),
});

export default function AddEssayQuestionModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const addQuestionMutation = useAddQuestionMutation();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { description: "", text: "" },
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg text-foreground">
        <DialogHeader>
          <DialogTitle>Add Essay Question</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((data) => {
              addQuestionMutation.mutate(
                {
                  ...data,
                  questionType: "Essay",
                },
                {
                  onSuccess: () => {
                    toast({
                      title: "Question added",
                      description: "Essay question saved to bank",
                    });
                    onClose();
                  },
                }
              );
            })}
          >
            <fieldset
              disabled={addQuestionMutation.isPending || uploading}
              className="space-y-4"
            >
              <FormField
                name="description"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank label</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="text"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Optional image</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setUploading(true);
                    try {
                      form.setValue("image", await uploadToImgBb(f));
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </FormItem>
              <Button type="submit" className="w-full">
                Save to bank
              </Button>
            </fieldset>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
