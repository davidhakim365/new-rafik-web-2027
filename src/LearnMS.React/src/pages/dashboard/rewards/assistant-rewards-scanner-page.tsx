import {
  LookupAssistantByCodeRequest,
  AssistantLookup,
  useAttendAssistantByCodeMutation,
  useLookupAssistantByCodeMutation,
} from "@/api/rewards-api";
import { ScannerViewfinder } from "@/components/rewards/reward-graphics";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/utils";
import Quagga, { QuaggaJSResultObject } from "@ericblade/quagga2";
import { zodResolver } from "@hookform/resolvers/zod";
import { Apple, ArrowLeft, CheckCircle, Loader2, ScanLine, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

const SCAN_COOLDOWN_MS = 2500;

const AssistantRewardsScannerPage = () => {
  const navigate = useNavigate();
  const scannerRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef(false);
  const lastCodeRef = useRef("");
  const lastScanTimeRef = useRef(0);

  const lookupMutation = useLookupAssistantByCodeMutation();
  const attendMutation = useAttendAssistantByCodeMutation();

  const [status, setStatus] = useState<
    "initializing" | "scanning" | "processing" | "found" | "success" | "error"
  >("initializing");
  const [feedback, setFeedback] = useState("");
  const [assistant, setAssistant] = useState<AssistantLookup | null>(null);

  const form = useForm<LookupAssistantByCodeRequest>({
    resolver: zodResolver(LookupAssistantByCodeRequest),
    defaultValues: { code: "" },
  });

  const resumeScanning = useCallback(
    (delay = 1500) => {
      window.setTimeout(() => {
        processingRef.current = false;
        setStatus((prev) => (prev === "found" ? "found" : "scanning"));
        if (!assistant) {
          setFeedback("Ready for next scan...");
        }
      }, delay);
    },
    [assistant]
  );

  const lookupCode = useCallback(
    (rawCode: string) => {
      const code = rawCode.trim();
      if (!code) return;

      const now = Date.now();
      if (processingRef.current) return;
      if (code === lastCodeRef.current && now - lastScanTimeRef.current < SCAN_COOLDOWN_MS) {
        return;
      }

      processingRef.current = true;
      lastCodeRef.current = code;
      lastScanTimeRef.current = now;
      setStatus("processing");
      setFeedback(`Looking up: ${code}`);
      setAssistant(null);

      lookupMutation.mutate(
        { code },
        {
          onSuccess: (res) => {
            const found = res.data;
            if (!found) {
              setStatus("error");
              setFeedback("Assistant not found");
              resumeScanning(2000);
              return;
            }
            setAssistant(found);
            setStatus("found");
            setFeedback(
              `${found.fullName || found.email} · ${found.apples} apples · next +${found.currentSessionValue}`
            );
            form.setValue("code", found.code);
            toast({
              title: "Assistant found",
              description: `${found.fullName || found.email} (${found.code})`,
            });
            processingRef.current = false;
          },
          onError: () => {
            setStatus("error");
            setFeedback(`Assistant not found: ${code}`);
            toast({
              title: "Scan failed",
              description: "No assistant with that code.",
              variant: "destructive",
            });
            resumeScanning(2000);
          },
        }
      );
    },
    [form, lookupMutation, resumeScanning]
  );

  const clearAssistant = useCallback(() => {
    setAssistant(null);
    setStatus("scanning");
    setFeedback("Ready for next scan...");
    form.reset({ code: "" });
    processingRef.current = false;
    lastCodeRef.current = "";
  }, [form]);

  const attendSession = () => {
    if (!assistant) return;

    attendMutation.mutate(
      { code: assistant.code },
      {
        onSuccess: (res) => {
          const message = res.message ?? res.data?.message ?? "Session attended";
          setStatus("success");
          setFeedback(message);
          toast({ title: "Attended", description: message });
          clearAssistant();
        },
        onError: () => {
          setStatus("error");
          setFeedback("Could not attend this assistant");
          toast({
            title: "Attend failed",
            description: "Please try again.",
            variant: "destructive",
          });
          processingRef.current = false;
        },
      }
    );
  };

  useEffect(() => {
    if (!scannerRef.current) return;

    let mounted = true;

    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            facingMode: "environment",
          },
        },
        locator: {
          patchSize: "medium",
          halfSample: true,
        },
        numOfWorkers: Math.min(navigator.hardwareConcurrency || 2, 4),
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader",
            "code_39_reader",
            "codabar_reader",
            "upc_reader",
          ],
        },
        locate: true,
        frequency: 10,
      },
      (err) => {
        if (!mounted) return;
        if (err) {
          setStatus("error");
          setFeedback("Could not access camera. You can still type the assistant code below.");
          toast({
            title: "Camera error",
            description: String(err),
            variant: "destructive",
          });
          return;
        }
        Quagga.start();
        setStatus("scanning");
        setFeedback("Point camera at assistant barcode, or type code below");
      }
    );

    const onDetected = (result: QuaggaJSResultObject) => {
      const code = result?.codeResult?.code;
      if (code) lookupCode(code);
    };

    Quagga.onDetected(onDetected);

    return () => {
      mounted = false;
      Quagga.offDetected(onDetected);
      Quagga.stop();
    };
  }, [lookupCode]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#06100c] text-white">
      <header className="relative flex shrink-0 items-center gap-3 overflow-hidden border-b border-emerald-500/20 bg-gradient-to-r from-emerald-950/90 via-black/90 to-black/90 px-3 py-3">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-emerald-500/20 blur-2xl"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard/assistants")}
          className="relative z-10 text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="relative z-10 flex min-w-0 flex-1 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-lg shadow-emerald-500/30">
            <Apple className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">Assistant Rewards Scanner</p>
            <p className="truncate text-xs text-emerald-200/70">
              Find assistant first, then tap Attend session
            </p>
          </div>
        </div>
        {status === "processing" && (
          <Loader2 className="relative z-10 h-5 w-5 animate-spin text-emerald-300" />
        )}
        {(status === "found" || status === "success") && (
          <CheckCircle className="relative z-10 h-5 w-5 text-emerald-400" />
        )}
        {status === "error" && <XCircle className="relative z-10 h-5 w-5 text-red-400" />}
      </header>

      <div ref={scannerRef} className="relative min-h-0 flex-1 overflow-hidden bg-black">
        <ScannerViewfinder
          active={!assistant && (status === "scanning" || status === "initializing")}
          label="Align assistant barcode"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/70 to-transparent p-4 pt-16">
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-black/50 px-3 py-2 text-sm backdrop-blur-md">
            <ScanLine className="h-4 w-4 text-emerald-300" />
            <span className="text-emerald-50/90">{feedback || "Initializing camera..."}</span>
          </div>
        </div>
      </div>

      <div className="shrink-0 space-y-4 border-t border-emerald-500/15 bg-gradient-to-t from-emerald-950/80 to-black/95 p-4">
        {assistant && (
          <div className="relative overflow-hidden rounded-3xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 via-emerald-950/40 to-black/40 p-4 shadow-lg shadow-emerald-500/10">
            <Apple
              aria-hidden
              className="pointer-events-none absolute -right-2 -top-2 size-20 rotate-12 text-emerald-400/15"
            />
            <div className="relative z-10 mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300/80">
                  Assistant found
                </p>
                <p className="text-lg font-semibold">{assistant.fullName || assistant.email}</p>
                <p className="text-sm text-white/70">
                  Code {assistant.code} · {assistant.apples} apples ·{" "}
                  {assistant.sessionsAttended} sessions
                </p>
                <p className="mt-1 text-sm text-emerald-200">
                  Next attend awards +{assistant.currentSessionValue} apples
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-white/70 hover:bg-white/10 hover:text-white"
                onClick={clearAssistant}
              >
                Clear
              </Button>
            </div>
            <Button
              type="button"
              disabled={attendMutation.isPending}
              onClick={attendSession}
              className="relative z-10 w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 hover:opacity-95"
            >
              {attendMutation.isPending ? "Attending..." : "Attend session"}
            </Button>
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => lookupCode(values.code))}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-emerald-100/80">Assistant code or id</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="border-emerald-500/25 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-emerald-500/40"
                      placeholder="Scan or type assistant code"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={lookupMutation.isPending}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 hover:opacity-95"
            >
              Find assistant
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AssistantRewardsScannerPage;
