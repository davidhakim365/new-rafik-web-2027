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
  valueCorrect: z.coerce.number(),
  valueTolerance: z.coerce.number(),
});

const AddValueQuestionModal: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  const [uploading, setUploading] = useState(false);
  const addQuestionMutation = useAddQuestionMutation();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      description: "",
      text: "",
      valueCorrect: 0,
      valueTolerance: 0,
    },
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="w-[60vw] max-w-screen-xl max-h-[100vh] overflow-y-auto text-foreground">
        <DialogHeader>
          <DialogTitle>Add Number Question</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => {
              addQuestionMutation.mutate(
                {
                  text: data.text,
                  description: data.description,
                  image: data.image,
                  questionType: "ValueTolerance",
                  valueCorrect: data.valueCorrect,
                  valueTolerance: data.valueTolerance,
                },
                {
                  onSuccess: () => {
                    toast({
                      title: "Question added",
                      description: "Question added successfully",
                    });
                    form.reset();
                    onClose();
                  },
                }
              );
            })}
          >
            <fieldset
              className="space-y-4"
              disabled={addQuestionMutation.isPending || uploading}
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
                      <Textarea {...field} />
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
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  name="valueCorrect"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correct value</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="valueTolerance"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tolerance</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full">
                Submit
              </Button>
            </fieldset>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddValueQuestionModal;
