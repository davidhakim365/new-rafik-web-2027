import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useGetProfile, useRedeemCreditCode } from "@/generated/api";
import { toast } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

const RedeemRequest = z.object({
  code: z.string().min(1, { message: "Code is required" }),
});

type RedeemRequest = z.infer<typeof RedeemRequest>;

interface RedeemCreditModalProps {
  onClose: () => void;
}

const RedeemCreditModal = ({ onClose }: RedeemCreditModalProps) => {
  const { t } = useTranslation();
  const { refetch } = useGetProfile();
  const { mutate: redeem, isPending } = useRedeemCreditCode({
    mutation: {
      throwOnError: false,
      onSuccess: (data) => {
        toast({
          title: t("redeem.success.title"),
          description: t("redeem.success.description", {
            value: data.data?.value,
            currency: t("common.currency"),
          }),
        });
        refetch();
        onClose();
      },
      onError: (error) => {
        toast({
          title: t("redeem.error.title"),
          description: error.message,
          variant: "destructive",
        });
      },
    },
  });

  const redeemForm = useForm({
    resolver: zodResolver(RedeemRequest),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = (data: RedeemRequest) => {
    redeem({
      params: {
        code: data.code,
      },
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center text-foreground">
            {t("redeem.title")}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {t("redeem.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="px-2 pb-2">
          <Form {...redeemForm}>
            <form
              className="space-y-4"
              onSubmit={redeemForm.handleSubmit(onSubmit)}
            >
              <FormField
                control={redeemForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        className="h-12 font-mono text-lg tracking-widest text-center bg-background/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:font-sans placeholder:tracking-normal"
                        placeholder={t("redeem.placeholder")}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage className="text-center" />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isPending}
                  className="w-full text-foreground"
                >
                  {t("courses.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full font-semibold transition-all duration-200 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? t("redeem.submitting") : t("redeem.submit")}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RedeemCreditModal;
