import Footer from "@/components/footer";
import Loading from "@/components/loading/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  PaymentRequestItem,
  useCreatePaymentRequestMutation,
  useMyPaymentRequestsQuery,
} from "@/api/payment-requests-api";
import { useGetProfile, useRedeemCreditCode } from "@/generated/api";
import { toast, cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ImageIcon, Upload, Wallet, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { z } from "zod";

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const RedeemRequest = z.object({
  code: z.string().min(1, { message: "Code is required" }),
});

type RedeemRequest = z.infer<typeof RedeemRequest>;

const PaymentRequestSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: "Amount must be a number" })
    .min(1, { message: "Amount must be at least 1" })
    .max(100000, { message: "Amount must be at most 100000" }),
  note: z.string().max(500).optional(),
  image: z
    .custom<File>((file) => file instanceof File, {
      message: "Transfer screenshot is required",
    })
    .refine((file) => file.size <= MAX_IMAGE_BYTES, {
      message: "Image must be less than 10MB",
    })
    .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
      message: "Only jpeg, png, webp, and gif images are allowed",
    }),
});

type PaymentRequestForm = z.infer<typeof PaymentRequestSchema>;

function statusBadgeClass(status: string) {
  if (status === "Confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (status === "Rejected") {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300";
  }
  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
}

const StudentPayments = () => {
  const { t } = useTranslation();
  const { data: profile, isLoading, refetch } = useGetProfile();
  const myRequests = useMyPaymentRequestsQuery();
  const createRequest = useCreatePaymentRequestMutation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewRequest, setPreviewRequest] = useState<PaymentRequestItem | null>(
    null
  );

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

  const requestForm = useForm<PaymentRequestForm>({
    resolver: zodResolver(PaymentRequestSchema),
    defaultValues: {
      amount: undefined as unknown as number,
      note: "",
    },
  });

  const image = requestForm.watch("image");
  const requests = myRequests.data?.data?.items ?? [];
  const hasPending = requests.some((item) => item.status === "Pending");
  const formLocked = createRequest.isPending || hasPending;

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const onDrop = useCallback(
    (files: File[]) => {
      const file = files[0];
      if (file) {
        requestForm.setValue("image", file, { shouldValidate: true });
      }
    },
    [requestForm]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
      "image/gif": [],
    },
    maxSize: MAX_IMAGE_BYTES,
    multiple: false,
    disabled: formLocked,
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
      <Navigate to="/sign-in-sign-up?from=/payment" replace />
    );
  }

  const credits =
    "credits" in profile.data ? Number(profile.data.credits ?? 0) : 0;

  const onRedeem = (data: RedeemRequest) => {
    redeem({
      params: {
        code: data.code,
      },
    });
  };

  const onSubmitRequest = (data: PaymentRequestForm) => {
    if (hasPending) return;
    const formData = new FormData();
    formData.append("amount", String(data.amount));
    if (data.note?.trim()) formData.append("note", data.note.trim());
    formData.append("image", data.image);

    createRequest.mutate(formData, {
      onSuccess: (res) => {
        toast({
          title: t("payments.request.successTitle"),
          description:
            res.message ?? t("payments.request.successDescription"),
        });
        requestForm.reset({
          amount: undefined as unknown as number,
          note: "",
          image: undefined as unknown as File,
        });
        setPreviewUrl(null);
      },
    });
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-paymentPage">
      <div className="relative flex items-center justify-center flex-1 px-4 py-8 sm:py-12 md:py-16">
        <div className="w-full max-w-2xl space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="text-3xl font-bold text-foreground">
              {t("payments.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("payments.subtitle")}
            </p>
          </div>

          <Card className="w-full border-0 shadow-lg bg-card/95 backdrop-blur-sm">
            <CardContent className="flex items-center gap-3 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("payments.balance")}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {credits} {t("common.currency")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full border-0 shadow-lg bg-card/95 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold text-foreground">
                {t("payments.request.title")}
              </CardTitle>
              <CardDescription>{t("payments.request.description")}</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {hasPending && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  {t("payments.request.pendingBlocked")}
                </div>
              )}
              <Form {...requestForm}>
                <form
                  className="space-y-4"
                  onSubmit={requestForm.handleSubmit(onSubmitRequest)}
                >
                  <FormField
                    control={requestForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("payments.request.amount")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={100000}
                            step="0.01"
                            placeholder={t("payments.request.amountPlaceholder")}
                            disabled={formLocked}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={requestForm.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("payments.request.note")}</FormLabel>
                        <FormControl>
                          <Textarea
                            maxLength={500}
                            placeholder={t("payments.request.notePlaceholder")}
                            disabled={formLocked}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={requestForm.control}
                    name="image"
                    render={() => (
                      <FormItem>
                        <FormLabel>{t("payments.request.image")}</FormLabel>
                        <FormControl>
                          <div
                            {...getRootProps()}
                            className={cn(
                              "relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition",
                              isDragActive
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50",
                              formLocked &&
                                "pointer-events-none opacity-60"
                            )}
                          >
                            <input {...getInputProps()} />
                            {previewUrl ? (
                              <div className="space-y-3">
                                <img
                                  src={previewUrl}
                                  alt="Transfer screenshot preview"
                                  className="mx-auto max-h-56 rounded-lg object-contain"
                                />
                                <p className="text-sm text-muted-foreground">
                                  {t("payments.request.changeImage")}
                                </p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                {isDragActive ? (
                                  <Upload className="h-8 w-8" />
                                ) : (
                                  <ImageIcon className="h-8 w-8" />
                                )}
                                <p className="text-sm font-medium">
                                  {t("payments.request.dropzone")}
                                </p>
                                <p className="text-xs">
                                  {t("payments.request.imageHint")}
                                </p>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        {previewUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="mt-1"
                            disabled={formLocked}
                            onClick={() => {
                              requestForm.resetField("image");
                              setPreviewUrl(null);
                            }}
                          >
                            <X className="mr-1 h-4 w-4" />
                            {t("payments.request.changeImage")}
                          </Button>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={formLocked}
                    className="w-full h-12 font-semibold"
                  >
                    {createRequest.isPending
                      ? t("payments.request.submitting")
                      : t("payments.request.submit")}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

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
                  onSubmit={redeemForm.handleSubmit(onRedeem)}
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

          <Card className="w-full border-0 shadow-lg bg-card/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>{t("payments.request.listTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {myRequests.isLoading ? (
                <Loading />
              ) : requests.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t("payments.request.empty")}
                </p>
              ) : (
                requests.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-xl border border-border/70 bg-background/60 p-3"
                  >
                    <button
                      type="button"
                      className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted"
                      onClick={() => setPreviewRequest(item)}
                    >
                      <img
                        src={item.imageThumbUrl || item.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">
                          {item.amount} {t("common.currency")}
                        </p>
                        <Badge className={statusBadgeClass(item.status)}>
                          {item.status === "Confirmed"
                            ? t("payments.status.Confirmed")
                            : item.status === "Rejected"
                              ? t("payments.status.Rejected")
                              : t("payments.status.Pending")}
                        </Badge>
                      </div>
                      {item.note && (
                        <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                          {item.note}
                        </p>
                      )}
                      {item.status === "Rejected" && item.rejectionReason && (
                        <p className="whitespace-pre-wrap break-words text-sm text-rose-600">
                          {t("payments.request.rejectedReason")}:{" "}
                          {item.rejectionReason}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.createdAt), "dd MMM yyyy, HH:mm")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={!!previewRequest}
        onOpenChange={(open) => {
          if (!open) setPreviewRequest(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("payments.request.image")}</DialogTitle>
          </DialogHeader>
          {previewRequest && (
            <img
              src={previewRequest.imageUrl}
              alt=""
              className="max-h-[75vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="w-full">
        <Footer />
      </div>
    </div>
  );
};

export default StudentPayments;
