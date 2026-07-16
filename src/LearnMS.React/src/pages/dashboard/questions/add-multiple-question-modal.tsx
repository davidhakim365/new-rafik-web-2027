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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { uploadToImgBb } from "@/lib/imgbb-upload";
import { toast } from "@/lib/utils";
import { QuestionChoiceDraft } from "@/types/assessment";
import { zodResolver } from "@hookform/resolvers/zod";
import { Delete, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface AddMultipleQuestionModalProps {
  onClose: () => void;
}

const AddMultipleQuestionModal: React.FC<AddMultipleQuestionModalProps> = ({
  onClose,
}) => {
  const [choices, setChoices] = useState<QuestionChoiceDraft[]>([
    { id: crypto.randomUUID(), text: "" },
    { id: crypto.randomUUID(), text: "" },
  ]);
  const [uploading, setUploading] = useState(false);
  const addQuestionMutation = useAddQuestionMutation();

  const FormSchema = z
    .object({
      description: z.string().min(1),
      text: z.string().min(1),
      image: z.string().optional(),
      correctAnswer: z.string().min(1),
    })
    .refine(
      (data) => choices.some((c) => c.id === data.correctAnswer),
      { message: "Pick a correct choice", path: ["correctAnswer"] }
    )
    .refine(
      () =>
        choices.length >= 2 &&
        choices.every((c) => (c.text && c.text.length > 0) || c.imageUrl),
      { message: "Each choice needs text or image", path: ["correctAnswer"] }
    );

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      description: "",
      text: "",
      correctAnswer: choices[0]?.id,
    },
  });

  const upload = async (file: File, apply: (url: string) => void) => {
    setUploading(true);
    try {
      apply(await uploadToImgBb(file));
    } finally {
      setUploading(false);
    }
  };

  const onAddQuestion = (data: z.infer<typeof FormSchema>) => {
    addQuestionMutation.mutate(
      {
        text: data.text,
        description: data.description,
        image: data.image,
        questionType: "MultipleChoice",
        multipleCorrect: data.correctAnswer,
        multipleChoices: choices,
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
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="w-[60vw] max-w-screen-xl max-h-[100vh] overflow-y-auto text-foreground">
        <DialogHeader>
          <DialogTitle>Add Multiple Choice Question</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onAddQuestion as any)}>
            <fieldset
              className="space-y-4"
              disabled={addQuestionMutation.isPending || uploading}
            >
              <FormField
                name="description"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank label / description</FormLabel>
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
                    <FormLabel>Question text</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="image"
                render={() => (
                  <FormItem>
                    <FormLabel>Question image (ImgBB)</FormLabel>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f)
                          upload(f, (url) => form.setValue("image", url));
                      }}
                    />
                    {form.watch("image") && (
                      <img
                        src={form.watch("image")}
                        alt=""
                        className="mt-2 max-h-40 rounded border"
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="correctAnswer"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="p-1">
                    <FormLabel className="flex items-center justify-between">
                      Options
                      <Button
                        type="button"
                        size="icon"
                        onClick={() =>
                          setChoices((opts) => [
                            ...opts,
                            { id: crypto.randomUUID(), text: "" },
                          ])
                        }
                      >
                        <Plus />
                      </Button>
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        {choices.map((choice, index) => (
                          <FormItem
                            key={choice.id}
                            className="flex items-start gap-2"
                          >
                            <FormControl>
                              <RadioGroupItem value={choice.id} />
                            </FormControl>
                            <FormLabel className="flex flex-1 flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  value={choice.text ?? ""}
                                  placeholder="Choice text"
                                  onChange={(e) => {
                                    setChoices((opts) => {
                                      const next = [...opts];
                                      next[index] = {
                                        ...next[index],
                                        text: e.target.value,
                                      };
                                      return next;
                                    });
                                  }}
                                />
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  type="button"
                                  onClick={() =>
                                    setChoices((opts) =>
                                      opts.filter((_, i) => i !== index)
                                    )
                                  }
                                >
                                  <Delete />
                                </Button>
                              </div>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f)
                                    upload(f, (url) =>
                                      setChoices((opts) => {
                                        const next = [...opts];
                                        next[index] = {
                                          ...next[index],
                                          imageUrl: url,
                                        };
                                        return next;
                                      })
                                    );
                                }}
                              />
                              {choice.imageUrl && (
                                <img
                                  src={choice.imageUrl}
                                  alt=""
                                  className="h-16 w-16 rounded object-cover"
                                />
                              )}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Submit"
                )}
              </Button>
            </fieldset>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMultipleQuestionModal;
