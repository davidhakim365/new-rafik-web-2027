import {
  AttendByCodeRequest,
  useAttendAssistantByCodeMutation,
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
  const attendMutation = useAttendAssistantByCodeMutation();

  const [status, setStatus] = useState<
    "initializing" | "scanning" | "processing" | "success" | "error"
  >("initializing");
  const [feedback, setFeedback] = useState("");

  const form = useForm<AttendByCodeRequest>({
    resolver: zodResolver(AttendByCodeRequest),
    defaultValues: { code: "" },
  });

  const resumeScanning = useCallback((delay = 1500) => {
    window.setTimeout(() => {
      processingRef.current = false;
      setStatus("scanning");
      setFeedback("Ready for next scan...");
    }, delay);
  }, []);

  const handleCode = useCallback(
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
      setFeedback(`Processing: ${code}`);

      attendMutation.mutate(
        { code },
        {
          onSuccess: (res) => {
            const message = res.message ?? res.data?.message ?? "Session attended";
            setStatus("success");
            setFeedback(message);
            toast({ title: "Attended", description: message });
            form.reset({ code: "" });
            resumeScanning(1200);
          },
          onError: () => {
            setStatus("error");
            setFeedback(`Could not attend assistant: ${code}`);
            toast({
              title: "Scan failed",
              description: "Assistant not found or request failed.",
              variant: "destructive",
            });
            resumeScanning(2000);
          },
        }
      );
    },
    [attendMutation, form, resumeScanning]
  );

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
      if (code) handleCode(code);
    };

    Quagga.onDetected(onDetected);

    return () => {
      mounted = false;
      Quagga.offDetected(onDetected);
      Quagga.stop();
    };
  }, [handleCode]);

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
              Scan barcode or type assistant code / id
            </p>
          </div>
        </div>
        {status === "processing" && <Loader2 className="relative z-10 h-5 w-5 animate-spin text-emerald-300" />}
        {status === "success" && <CheckCircle className="relative z-10 h-5 w-5 text-emerald-400" />}
        {status === "error" && <XCircle className="relative z-10 h-5 w-5 text-red-400" />}
      </header>

      <div ref={scannerRef} className="relative min-h-0 flex-1 overflow-hidden bg-black">
        <ScannerViewfinder
          active={status === "scanning" || status === "initializing"}
          label="Align assistant barcode"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/70 to-transparent p-4 pt-16">
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-black/50 px-3 py-2 text-sm backdrop-blur-md">
            <ScanLine className="h-4 w-4 text-emerald-300" />
            <span className="text-emerald-50/90">{feedback || "Initializing camera..."}</span>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-emerald-500/15 bg-gradient-to-t from-emerald-950/80 to-black/95 p-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => handleCode(values.code))}
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
                      placeholder="e.g. 245891"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={attendMutation.isPending}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 hover:opacity-95"
            >
              Attend session
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AssistantRewardsScannerPage;
