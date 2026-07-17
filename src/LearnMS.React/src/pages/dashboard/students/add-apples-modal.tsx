import { AddStudentApplesRequest, useAddStudentApplesMutation } from "@/api/rewards-api";
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

interface AddApplesModalProps {
  onClose: () => void;
  student: {
    id: string;
    fullName: string;
    apples?: number;
  };
}

const AddApplesModal: React.FC<AddApplesModalProps> = ({ onClose, student }) => {
  const addStudentApples = useAddStudentApplesMutation();

  const form = useForm<AddStudentApplesRequest>({
    resolver: zodResolver(AddStudentApplesRequest),
    defaultValues: {
      amount: 1,
      reason: "",
    },
  });

  const onSubmit = (data: AddStudentApplesRequest) => {
    addStudentApples.mutate(
      { studentId: student.id, data },
      {
        onSuccess: (res) => {
          toast({
            title: "Apples updated",
            description: res.message ?? "Student apples updated successfully",
          });
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] text-foreground">
        <DialogHeader>
          <DialogTitle>Add / remove apples</DialogTitle>
          <DialogDescription>
            Update apples for {student.fullName}. Current balance: {student.apples ?? 0}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <fieldset
              disabled={addStudentApples.isPending}
              className="flex flex-col gap-2"
            >
              <FormField
                name="amount"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (+/-)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="reason"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Optional" />
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

export default AddApplesModal;
