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
import { ImageUploadField } from "@/components/image-upload-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
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
              <FormField
                name="image"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Optional image</FormLabel>
                    <ImageUploadField
                      value={field.value}
                      onChange={field.onChange}
                      capturePaste
                      onUploadingChange={setUploading}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
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
