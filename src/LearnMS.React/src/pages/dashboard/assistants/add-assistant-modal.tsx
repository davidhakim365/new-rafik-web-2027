import {
  CreateAssistantRequest,
  useCreateAssistantMutation,
} from "@/api/assistants-api";
import { ImageUploadField } from "@/components/image-upload-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { toast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";

interface AddAssistantModalProps {
  onClose: () => void;
}

const AddAssistantModal: React.FC<AddAssistantModalProps> = ({ onClose }) => {
  const createAssistantMutation = useCreateAssistantMutation();

  const form = useForm<CreateAssistantRequest>({
    resolver: zodResolver(CreateAssistantRequest),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      profilePicture: undefined,
    },
  });

  const onSubmit = (data: CreateAssistantRequest) => {
    createAssistantMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Assistant created",
          description: "Assistant created successfully",
        });
        onClose();
      },
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create Assistant</DialogTitle>
          <DialogDescription>
            Add name, login credentials, and an optional profile photo (ImgBB).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <fieldset
              disabled={createAssistantMutation.isPending}
              className="flex flex-col gap-3"
            >
              <FormField
                name="fullName"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Ahmed Hassan" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="password"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="profilePicture"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile photo</FormLabel>
                    <FormControl>
                      <ImageUploadField
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit">Submit</Button>
              </DialogFooter>
            </fieldset>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAssistantModal;
