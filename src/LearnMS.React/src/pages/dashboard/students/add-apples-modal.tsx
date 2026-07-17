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
import { Apple } from "lucide-react";
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
      <DialogContent className="overflow-hidden sm:max-w-[425px] text-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full bg-emerald-500/15 blur-2xl"
        />
        <DialogHeader className="relative z-10">
          <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-color2 text-white shadow-lg shadow-emerald-500/25">
            <Apple className="size-5" />
          </div>
          <DialogTitle>Add / remove apples</DialogTitle>
          <DialogDescription>
            Update apples for {student.fullName}. Current balance:{" "}
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
              {student.apples ?? 0}
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="relative z-10">
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
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-600 to-color2 text-white shadow-md shadow-emerald-500/20"
                >
                  Submit
                </Button>
              </DialogFooter>
            </fieldset>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddApplesModal;
