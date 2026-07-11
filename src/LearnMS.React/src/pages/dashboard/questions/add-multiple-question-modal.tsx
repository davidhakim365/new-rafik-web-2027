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
import { toast } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Delete, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface AddMultipleQuestionModalProps {
  onClose: () => void;
}

const AddMultipleQuestionModal: React.FC<AddMultipleQuestionModalProps> = ({
  onClose,
}) => {
  const [options, setOptions] = useState<string[]>([]);
  const addQuestionMutation = useAddQuestionMutation();

  const FormSchema = z
    .object({
      description: z.string().min(1),
      text: z.string().min(1),
      image: z
        .any()
        .refine((file) => file instanceof File, {
          message: "only one image",
        })
        .refine((file: File) => file.size / 1024 / 1024 <= 5, {
          message: "image must be less than 5MB",
        })

        .optional(),
      correctAnswer: z.string().min(1),
      answers: z.array(z.string()).default(options),
    })
    .refine((data) => new Set(data.answers).size === data.answers.length, {
      message: "Answers must be unique",
      path: ["correctAnswer"],
    })
    .refine((data) => data.answers.includes(data.correctAnswer), {
      message: "Correct answer must be one of the answers",
      path: ["correctAnswer"],
    })
    .refine(
      (data) =>
        data.answers.length >= 2 && data.answers.every((a) => a.length > 0),
      {
        message: "Answers must be at least 2 non-empty strings",
        path: ["correctAnswer"],
      }
    );

  const form = useForm({
    resolver: zodResolver(FormSchema),
  });

  const onAddQuestion = (data: z.infer<typeof FormSchema>) => {
    addQuestionMutation.mutate(
      { ...data, image: form.getValues("image") },
      {
        onSuccess: () => {
          toast({
            title: "Question added",
            description: "Question added successfully",
          });
          form.reset();
          setOptions([]);
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="w-[60vw] max-w-screen-xl max-h-[100vh] overflow-y-auto text-foreground">
        <DialogHeader>
          <DialogTitle>Add Question</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onAddQuestion as any)}>
            <fieldset
              className="space-y-4"
              disabled={addQuestionMutation.isPending}
            >
              <FormField
                name="description"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
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
                    <FormLabel>Text</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="image"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Image</FormLabel>
                    <Input
                      {...field}
                      value={value?.fileName}
                      onChange={(e) => {
                        onChange(e.target.files?.[0]);
                        form.setValue("image", e.target.files?.[0]);
                      }}
                      type="file"
                      id="image"
                      accept="image/*"
                    />
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
                        onClick={() => setOptions((opts) => [...opts, ""])}
                      >
                        <Plus />
                      </Button>
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        {options.map((option, index) => (
                          <FormItem
                            key={index}
                            className="flex items-center gap-2"
                          >
                            <FormControl>
                              <RadioGroupItem value={option} />
                            </FormControl>
                            <FormLabel className="flex items-center w-full gap-2">
                              <Input
                                value={options[index]}
                                onChange={(e) => {
                                  setOptions((opts) => {
                                    var newOpts = [...opts];
                                    newOpts[index] = e.target.value;
                                    return newOpts;
                                  });
                                }}
                              />
                              <Button
                                size="icon"
                                variant="destructive"
                                type="button"
                                onClick={() =>
                                  setOptions((opts) => {
                                    var newOpts = [...opts];
                                    newOpts.splice(index, 1);
                                    return newOpts;
                                  })
                                }
                              >
                                <Delete />
                              </Button>
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
                Submit
              </Button>
            </fieldset>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMultipleQuestionModal;
