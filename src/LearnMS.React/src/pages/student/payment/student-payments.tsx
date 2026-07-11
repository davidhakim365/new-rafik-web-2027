import Footer from "@/components/footer";
import Loading from "@/components/loading/loading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Navigate } from "react-router-dom";
import { z } from "zod";
import { useTranslation } from "react-i18next";

const RedeemRequest = z.object({
  code: z.string().min(1, { message: "Code is required" }),
});

type RedeemRequest = z.infer<typeof RedeemRequest>;

const StudentPayments = () => {
  const { t } = useTranslation();
  const { data: profile, isLoading, refetch } = useGetProfile();
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
    values: {
      code: "",
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loading />
      </div>
    );
  }

  if (!profile?.data) {
    return (
      <Navigate to="/sign-in-sign-up" state={{ from: "/payment" }} replace />
    );
  }

  const onSubmit = (data: RedeemRequest) => {
    redeem({
      params: {
        code: data.code,
      },
    });
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-paymentPage">
      <div className="w-[100px] h-[100px]">{/* <PaymentBackground /> */}</div>
      <div className="relative flex items-center justify-center flex-1 px-4 py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="w-full max-w-md space-y-6">
          {/* Redeem Credit Form */}
          <Card className="w-full border-0 shadow-lg bg-card/95 backdrop-blur-sm">
            <CardHeader className="pb-4 text-center">
              <CardTitle className="text-2xl font-bold text-foreground">
                {t("redeem.title")}
              </CardTitle>
              <CardDescription className="mt-2 text-muted-foreground">
                {t("redeem.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
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
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full h-12 font-semibold transition-all duration-200 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? t("redeem.submitting") : t("redeem.submit")}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Credit Top-up Section */}
          <div className="rounded-lg border border-border bg-background/70 p-4 shadow-sm">
            <h2 className="text-2xl font-bold text-foreground">
              {t("topup.title")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("topup.description")}
            </p>

            <a
              href="https://forms.gle/UWyyKWD95TpssLCr7" // 🔁 Replace this with your actual Google Form URL
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-blue-600 bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none"
            >
              <span className="text-lg">＋</span>
              {t("topup.button")}
            </a>

            <p className="mt-2 text-xs text-muted-foreground">
              {t("topup.note")}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full">
        <Footer />
      </div>
    </div>
  );
};

export default StudentPayments;
